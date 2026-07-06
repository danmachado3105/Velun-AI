"""
Serviço de conversas.

Esta camada organiza as ações relacionadas a conversas (criar, listar,
adicionar mensagem, apagar) e agora também orquestra a chamada à IA
para gerar respostas.
"""

from app.core.prompts import SYSTEM_PROMPT
from app.infrastructure.database.repository import ConversationRepository
from app.infrastructure.database.models import ConversationModel, MessageModel
from app.infrastructure.llm.base import LLMProvider


class ConversationService:
    """Organiza as ações de negócio relacionadas a conversas."""

    def __init__(self, repository: ConversationRepository, llm_provider: LLMProvider):
        self.repository = repository
        self.llm_provider = llm_provider

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
        self.repository.add_message(
            conversation_id=conversation_id, role="user", content=content
        )

        conversation = self.repository.get_conversation(conversation_id)
        history = [
            {"role": message.role, "content": message.content}
            for message in conversation.messages
        ]

        # O system prompt sempre vai primeiro, "ensinando" a IA
        # sobre sua identidade antes de qualquer mensagem do usuário.
        messages_with_system = [{"role": "system", "content": SYSTEM_PROMPT}] + history

        ai_response = await self.llm_provider.generate(messages_with_system)

        self.repository.add_message(
            conversation_id=conversation_id, role="assistant", content=ai_response
        )

        return self.repository.get_conversation(conversation_id)

    def delete_conversation(self, conversation_id: str) -> None:
        """Apaga uma conversa inteira."""
        self.repository.delete_conversation(conversation_id)