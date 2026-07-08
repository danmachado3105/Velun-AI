"""
Rotas relacionadas a conversas (chats).

Aqui ficam as "portas de entrada" que o frontend vai chamar para
criar conversas, listar o histórico e enviar mensagens.
"""

from app.infrastructure.database.document_repository import DocumentRepository
from app.api.schemas.chat import DocumentResponse

from fastapi import UploadFile, File
from app.infrastructure.files.text_extractor import TextExtractor, UnsupportedFileTypeError
from app.api.schemas.chat import UploadFileResponse

from sse_starlette.sse import EventSourceResponse
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.infrastructure.llm.ollama_provider import OllamaProvider
from app.infrastructure.memory.embedding_provider import OllamaEmbeddingProvider
from app.infrastructure.memory.memory_repository import MemoryRepository
from app.application.services.memory_service import MemoryService

from app.infrastructure.database.session import get_db
from app.infrastructure.database.repository import ConversationRepository
from app.application.services.conversation_service import ConversationService
from app.api.schemas.chat import ConversationResponse, SendMessageRequest

router = APIRouter()


def get_conversation_service(db: Session = Depends(get_db)) -> ConversationService:
    """
    Monta o serviço de conversas com tudo que ele precisa.
    """
    repository = ConversationRepository(db)
    llm_provider = OllamaProvider()

    embedding_provider = OllamaEmbeddingProvider()
    memory_repository = MemoryRepository(embedding_provider)
    memory_service = MemoryService(memory_repository, llm_provider)

    return ConversationService(repository, llm_provider, memory_service)


@router.post("/conversations", response_model=ConversationResponse)
def create_conversation(
    service: ConversationService = Depends(get_conversation_service),
):
    """Cria uma nova conversa vazia."""
    conversation = service.create_conversation()
    return conversation


@router.get("/conversations", response_model=list[ConversationResponse])
def list_conversations(
    service: ConversationService = Depends(get_conversation_service),
):
    """Lista todas as conversas existentes, mais recentes primeiro."""
    return service.list_conversations()


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: str,
    service: ConversationService = Depends(get_conversation_service),
):
    """Busca uma conversa específica, com todas as suas mensagens."""
    conversation = service.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")
    return conversation


@router.post("/conversations/{conversation_id}/messages", response_model=ConversationResponse)
async def send_message(
    conversation_id: str,
    payload: SendMessageRequest,
    service: ConversationService = Depends(get_conversation_service),
):
    """
    Envia uma mensagem do usuário e recebe a resposta da IA,
    já salva no histórico da conversa.
    """
    conversation = service.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")

    return await service.send_message(conversation_id, payload.content)


@router.delete("/conversations/{conversation_id}", status_code=204)
def delete_conversation(
    conversation_id: str,
    service: ConversationService = Depends(get_conversation_service),
):
    """Apaga uma conversa inteira, junto com suas mensagens."""
    conversation = service.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")

    service.delete_conversation(conversation_id)

@router.post("/conversations/{conversation_id}/messages/stream")
async def send_message_stream(
    conversation_id: str,
    payload: SendMessageRequest,
    service: ConversationService = Depends(get_conversation_service),
):
    """
    Envia uma mensagem e transmite a resposta da IA em tempo real,
    pedaço por pedaço (streaming via Server-Sent Events).
    """
    conversation = service.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")

    async def event_generator():
        async for chunk in service.send_message_stream(conversation_id, payload.content):
            yield {"event": "message", "data": chunk}
        yield {"event": "done", "data": ""}

    return EventSourceResponse(event_generator())

@router.post("/conversations/{conversation_id}/upload", response_model=DocumentResponse)
async def upload_file(
    conversation_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    service: ConversationService = Depends(get_conversation_service),
):
    """
    Recebe um arquivo, extrai seu texto e salva como um documento
    anexado à conversa (separado do histórico de mensagens).
    """
    conversation = service.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")

    file_bytes = await file.read()
    extractor = TextExtractor()

    try:
        extracted_text = extractor.extract(file.filename, file_bytes)
    except UnsupportedFileTypeError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if not extracted_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Não foi possível extrair texto deste arquivo.",
        )

    document_repository = DocumentRepository(db)
    document = document_repository.add_document(
        conversation_id=conversation_id,
        filename=file.filename,
        content=extracted_text,
    )
    return document