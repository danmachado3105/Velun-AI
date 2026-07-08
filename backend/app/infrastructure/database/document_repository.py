"""
Repositório de documentos anexados a conversas.

Guarda o texto extraído de arquivos separado do histórico de
mensagens, evitando que o conteúdo seja duplicado repetidamente
a cada nova pergunta na conversa.
"""

from sqlalchemy.orm import Session

from app.infrastructure.database.models import DocumentModel


class DocumentRepository:
    """Guarda e busca documentos anexados a conversas."""

    def __init__(self, db: Session):
        self.db = db

    def add_document(self, conversation_id: str, filename: str, content: str) -> DocumentModel:
        """Salva um novo documento anexado a uma conversa."""
        document = DocumentModel(
            conversation_id=conversation_id, filename=filename, content=content
        )
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        return document

    def list_documents(self, conversation_id: str) -> list[DocumentModel]:
        """Lista todos os documentos anexados a uma conversa."""
        return (
            self.db.query(DocumentModel)
            .filter(DocumentModel.conversation_id == conversation_id)
            .all()
        )