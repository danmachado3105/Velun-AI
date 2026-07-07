"""
Serviço de conversas.

Esta camada organiza as ações relacionadas a conversas (criar, listar,
adicionar mensagem, apagar) e agora também orquestra a chamada à IA
para gerar respostas.
"""

from app.application.services.memory_service import MemoryService
from app.core.prompts import SYSTEM_PROMPT
from app.infrastructure.database.repository import ConversationRepository
from app.infrastructure.database.models import ConversationModel, MessageModel
from app.infrastructure.llm.base import LLMProvider

def _generate_title_from_content(content: str, max_length: int = 40) -> str:
    """
    Gera um título curto a partir do conteúdo da primeira mensagem.

    Corta o texto no limite de caracteres, sem quebrar uma palavra
    no meio, e adiciona reticências se o texto foi cortado.
    """
    cleaned = content.strip().replace("\n", " ")
    if len(cleaned) <= max_length:
        return cleaned

    truncated = cleaned[:max_length].rsplit(" ", 1)[0]
    return f"{truncated}..."

class ConversationService:
    """Organiza as ações de negócio relacionadas a conversas."""

    def __init__(
        self,
        repository: ConversationRepository,
        llm_provider: LLMProvider,
        memory_service: MemoryService,
    ):
        self.repository = repository
        self.llm_provider = llm_provider
        self.memory_service = memory_service

    def create_conversation(self, title: str = "Nova conversa") -> ConversationModel:
        """Cria uma nova conversa vazia."""
        return self.repository.create_conversation(title=title)

    def list_conversations(self) -> list[ConversationModel]:
        """Lista todas as conversas existentes."""
        return self.repository.list_conversations()

    def get_conversation(self, conversation_id: str) -> ConversationModel | None:
        """Busca uma conversa específica pelo ID."""
        return self.repository.get_conversation(conversation_id)

    async def send_message(self, conversation_id: str, content: str) -> ConversationModel:
        """
        Envia uma mensagem do usuário e obtém a resposta da IA.

        Passos:
        1. Salva a mensagem do usuário no banco.
        2. Monta o histórico completo da conversa.
        3. Pergunta para a IA, usando esse histórico como contexto.
        4. Salva a resposta da IA no banco.
        5. Devolve a conversa atualizada, já com a resposta.
        """
        conversation_before = self.repository.get_conversation(conversation_id)
        is_first_message = len(conversation_before.messages) == 0 if conversation_before else False

        self.repository.add_message(
            conversation_id=conversation_id, role="user", content=content
        )

        if is_first_message:
            title = _generate_title_from_content(content)
            self.repository.update_title(conversation_id, title)

        conversation = self.repository.get_conversation(conversation_id)
        history = [
            {"role": message.role, "content": message.content}
            for message in conversation.messages
        ]

        # Busca memórias relevantes e as adiciona ao system prompt.
        memory_context = await self.memory_service.get_relevant_context(content)
        system_content = SYSTEM_PROMPT + memory_context

        messages_with_system = [{"role": "system", "content": system_content}] + history

        ai_response = await self.llm_provider.generate(messages_with_system)

        self.repository.add_message(
            conversation_id=conversation_id, role="assistant", content=ai_response
        )

        # Analisa a mensagem do usuário para extrair possíveis memórias,
        # sem atrasar a resposta que o usuário já recebeu.
        await self.memory_service.extract_and_save(content)

        return self.repository.get_conversation(conversation_id)

    async def send_message_stream(self, conversation_id: str, content: str):
        """
        Envia uma mensagem do usuário e transmite a resposta da IA
        em pedaços, à medida que ela é gerada (streaming).

        Ao final, salva a resposta completa no banco, assim como
        já fazemos na versão sem streaming.
        """
        conversation_before = self.repository.get_conversation(conversation_id)
        is_first_message = len(conversation_before.messages) == 0 if conversation_before else False

        self.repository.add_message(
            conversation_id=conversation_id, role="user", content=content
        )

        if is_first_message:
            title = _generate_title_from_content(content)
            self.repository.update_title(conversation_id, title)

        conversation = self.repository.get_conversation(conversation_id)
        history = [
            {"role": message.role, "content": message.content}
            for message in conversation.messages
        ]
        # Busca memórias relevantes e as adiciona ao system prompt.
        memory_context = await self.memory_service.get_relevant_context(content)
        system_content = SYSTEM_PROMPT + memory_context

        messages_with_system = [{"role": "system", "content": system_content}] + history

        full_response = ""
        async for chunk in self.llm_provider.generate_stream(messages_with_system):
            full_response += chunk
            yield chunk

        self.repository.add_message(
            conversation_id=conversation_id, role="assistant", content=full_response
        )

        # Analisa a mensagem do usuário para extrair possíveis memórias,
        # sem atrasar a resposta que o usuário já recebeu.
        await self.memory_service.extract_and_save(content)

    def delete_conversation(self, conversation_id: str) -> None:
        """Apaga uma conversa inteira."""
        self.repository.delete_conversation(conversation_id)