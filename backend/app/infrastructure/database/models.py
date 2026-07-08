"""
Modelos ORM (SQLAlchemy) — representam as tabelas do banco de dados.

Importante: estes modelos descrevem a PERSISTÊNCIA (como os dados
são guardados no banco), não as regras de negócio. As regras de
negócio vivem nas entidades de domínio (app/domain/entities.py).
Essa separação é explicada em detalhe logo abaixo, no chat.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base


def _now() -> datetime:
    """Retorna o horário atual em UTC (evita bugs de fuso horário)."""
    return datetime.now(timezone.utc)


def _new_id() -> str:
    """Gera um identificador único universal (UUID) como string."""
    return str(uuid.uuid4())


class ConversationModel(Base):
    """Representa uma conversa (um 'chat') no banco de dados."""

    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    title: Mapped[str] = mapped_column(String(255), default="Nova conversa")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    # relacionamento: uma conversa tem várias mensagens.
    # cascade="all, delete-orphan" garante que, ao apagar uma conversa,
    # todas as suas mensagens são apagadas junto — evita "mensagens órfãs".
    messages: Mapped[list["MessageModel"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="MessageModel.created_at",
    )


class MessageModel(Base):
    """Representa uma única mensagem dentro de uma conversa."""

    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"))

    # 'role' indica quem enviou a mensagem: "user" ou "assistant".
    # Esse é o mesmo padrão usado por APIs de LLM (OpenAI, Anthropic, etc.),
    # o que facilita montar o histórico no formato que o Ollama espera.
    role: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    conversation: Mapped["ConversationModel"] = relationship(back_populates="messages")

class DocumentModel(Base):
    """Representa um arquivo anexado a uma conversa (texto extraído)."""

    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"))
    filename: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)