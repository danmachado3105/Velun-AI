"""
Gerador de embeddings usando o Ollama.

Um "embedding" é uma lista de números que representa o SIGNIFICADO
de um texto. Textos com significados parecidos geram números parecidos,
o que permite buscar por semelhança de sentido, não só de palavras.
"""

import httpx

from app.core.config import settings


class OllamaEmbeddingProvider:
    """Gera embeddings chamando o Ollama."""

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_EMBEDDING_MODEL

    async def embed(self, text: str) -> list[float]:
        """Transforma um texto em uma lista de números (embedding)."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/api/embeddings",
                json={"model": self.model, "prompt": text},
            )
            response.raise_for_status()
            data = response.json()
            return data["embedding"]