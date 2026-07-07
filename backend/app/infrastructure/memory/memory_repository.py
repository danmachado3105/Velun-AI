"""
Repositório de memórias, usando ChromaDB.

Guarda cada memória junto com seu embedding, e permite buscar as
memórias mais parecidas (por significado) com um texto de consulta.
"""

import uuid

import chromadb

from app.infrastructure.memory.embedding_provider import OllamaEmbeddingProvider


class MemoryRepository:
    """Guarda e busca memórias no ChromaDB."""

    def __init__(self, embedding_provider: OllamaEmbeddingProvider):
        # PersistentClient salva os dados em disco, numa pasta local,
        # para as memórias sobreviverem entre reinicializações do sistema.
        self.client = chromadb.PersistentClient(path="./chroma_data")
        self.collection = self.client.get_or_create_collection(name="memories")
        self.embedding_provider = embedding_provider

    async def add_memory(self, content: str) -> str:
        """Salva uma nova memória e devolve seu ID."""
        memory_id = str(uuid.uuid4())
        embedding = await self.embedding_provider.embed(content)

        self.collection.add(
            ids=[memory_id],
            embeddings=[embedding],
            documents=[content],
        )
        return memory_id

    async def search_relevant_memories(self, query: str, limit: int = 5) -> list[str]:
        """Busca as memórias mais relevantes para um texto de consulta."""
        # Se ainda não há memórias guardadas, evita erro do ChromaDB.
        if self.collection.count() == 0:
            return []

        query_embedding = await self.embedding_provider.embed(query)
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=min(limit, self.collection.count()),
        )
        documents = results.get("documents", [[]])
        return documents[0] if documents else []

    def list_all_memories(self) -> list[dict]:
        """Lista todas as memórias guardadas (para o usuário ver/gerenciar)."""
        results = self.collection.get()
        return [
            {"id": id_, "content": content}
            for id_, content in zip(results["ids"], results["documents"])
        ]

    def delete_memory(self, memory_id: str) -> None:
        """Apaga uma memória específica."""
        self.collection.delete(ids=[memory_id])