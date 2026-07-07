"""
Repositório de conversas.

Esta classe é a única parte do sistema que conversa diretamente
com o banco de dados para salvar/buscar conversas e mensagens.
O resto da aplicação usa apenas os métodos abaixo, sem saber
como o banco funciona por dentro.
"""

from sqlalchemy.orm import Session

from app.infrastructure.database.models import ConversationModel, MessageModel


class ConversationRepository:
    """Guarda e busca conversas no banco de dados."""

    def __init__(self, db: Session):
        self.db = db

    def create_conversation(self, title: str = "Nova conversa") -> ConversationModel:
        """Cria uma nova conversa vazia."""
        conversation = ConversationModel(title=title)
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    def get_conversation(self, conversation_id: str) -> ConversationModel | None:
        """Busca uma conversa pelo ID, ou None se não existir."""
        return self.db.get(ConversationModel, conversation_id)

    def list_conversations(self) -> list[ConversationModel]:
        """Lista todas as conversas, mais recentes primeiro."""
        return (
            self.db.query(ConversationModel)
            .order_by(ConversationModel.updated_at.desc())
            .all()
        )

    def add_message(
        self, conversation_id: str, role: str, content: str
    ) -> MessageModel:
        """Adiciona uma mensagem a uma conversa existente."""
        message = MessageModel(
            conversation_id=conversation_id, role=role, content=content
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def update_title(self, conversation_id: str, title: str) -> None:
        """Atualiza o título de uma conversa."""
        conversation = self.get_conversation(conversation_id)
        if conversation:
            conversation.title = title
            self.db.commit()

    def delete_conversation(self, conversation_id: str) -> None:
        """Apaga uma conversa (e suas mensagens, por causa do cascade)."""
        conversation = self.get_conversation(conversation_id)
        if conversation:
            self.db.delete(conversation)
            self.db.commit()