"""
Regras de negócio do Velun AI.

Aqui definimos o que é uma "Conversa" e uma "Mensagem" de verdade,
com suas regras — sem nenhuma ligação com banco de dados. Isso deixa
essas regras fáceis de testar e de entender, sem precisar saber nada
sobre SQL ou tabelas.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum


class MessageRole(str, Enum):
    """Define quem enviou a mensagem: o usuário ou a IA."""
    USER = "user"
    ASSISTANT = "assistant"


@dataclass
class Message:
    """Uma única mensagem dentro de uma conversa."""

    role: MessageRole
    content: str
    id: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def __post_init__(self):
        # Regra de negócio: mensagem vazia não faz sentido.
        if not self.content or not self.content.strip():
            raise ValueError("O conteúdo da mensagem não pode estar vazio.")


@dataclass
class Conversation:
    """Uma conversa, composta por várias mensagens."""

    title: str = "Nova conversa"
    id: str | None = None
    messages: list[Message] = field(default_factory=list)

    def add_message(self, role: MessageRole, content: str) -> Message:
        """Adiciona uma nova mensagem à conversa e a retorna."""
        message = Message(role=role, content=content)
        self.messages.append(message)
        return message