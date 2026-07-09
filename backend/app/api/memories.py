"""
Rotas relacionadas ao gerenciamento de memórias do usuário.

Permite visualizar e apagar memórias que o Velun AI guardou
sobre o usuário ao longo das conversas.
"""

from fastapi import APIRouter
from pydantic import BaseModel

from app.infrastructure.memory.embedding_provider import OllamaEmbeddingProvider
from app.infrastructure.memory.memory_repository import MemoryRepository

router = APIRouter()


class MemoryResponse(BaseModel):
    """Representa uma memória guardada."""
    id: str
    content: str


def get_memory_repository() -> MemoryRepository:
    """Monta o repositório de memórias."""
    embedding_provider = OllamaEmbeddingProvider()
    return MemoryRepository(embedding_provider)


@router.get("/memories", response_model=list[MemoryResponse])
def list_memories():
    """Lista todas as memórias guardadas sobre o usuário."""
    repository = get_memory_repository()
    return repository.list_all_memories()


@router.delete("/memories/{memory_id}", status_code=204)
def delete_memory(memory_id: str):
    """Apaga uma memória específica."""
    repository = get_memory_repository()
    repository.delete_memory(memory_id)