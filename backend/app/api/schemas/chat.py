"""
Formatos de dados (schemas) usados na API de chat.

Esses schemas definem exatamente o que o frontend deve enviar
e o que a API vai devolver — funcionam como um "contrato" entre
o frontend e o backend.
"""

from datetime import datetime
from pydantic import BaseModel, Field


class MessageResponse(BaseModel):
    """Como uma mensagem aparece quando devolvida pela API."""
    id: str
    role: str
    content: str
    created_at: datetime

    # Permite converter direto de um modelo do banco (SQLAlchemy)
    # para este schema, sem precisar copiar campo por campo.
    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    """Como uma conversa aparece quando devolvida pela API."""
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse] = []

    model_config = {"from_attributes": True}


class SendMessageRequest(BaseModel):
    """O que o frontend precisa enviar para mandar uma mensagem."""
    content: str = Field(min_length=1, description="Texto da mensagem do usuário")

class UploadFileResponse(BaseModel):
    """Resposta ao processar um arquivo enviado."""
    filename: str
    extracted_text: str
    character_count: int

class DocumentResponse(BaseModel):
    """Como um documento anexado aparece na API."""
    id: str
    filename: str
    created_at: datetime

    model_config = {"from_attributes": True}