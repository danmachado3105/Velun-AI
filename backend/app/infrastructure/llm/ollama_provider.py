"""
Implementação do provedor de IA usando o Ollama.

Esta classe sabe, especificamente, como conversar com o Ollama.
Se um dia você trocar de motor de IA, só precisa criar uma nova
classe parecida com essa, sem tocar no resto do sistema.
"""

import json
from collections.abc import AsyncGenerator

import httpx

from app.core.config import settings
from app.infrastructure.llm.base import LLMProvider


class OllamaProvider(LLMProvider):
    """Provedor de IA que conversa com um modelo rodando no Ollama."""

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL

    async def generate(self, messages: list[dict[str, str]]) -> str:
        """Manda o histórico de mensagens e espera a resposta completa."""
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json={"model": self.model, "messages": messages, "stream": False},
            )
            response.raise_for_status()
            data = response.json()
            return data["message"]["content"]

    async def generate_stream(
        self, messages: list[dict[str, str]]
    ) -> AsyncGenerator[str, None]:
        """Manda o histórico e vai devolvendo a resposta aos poucos (streaming)."""
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/api/chat",
                json={"model": self.model, "messages": messages, "stream": True},
            ) as response:
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    chunk = json.loads(line)
                    content = chunk.get("message", {}).get("content", "")
                    if content:
                        yield content
                    if chunk.get("done"):
                        break