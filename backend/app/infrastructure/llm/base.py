"""
Contrato (interface) que qualquer provedor de IA deve seguir.

Isso permite trocar o Ollama por outro motor de IA no futuro,
sem precisar mudar o resto do sistema.
"""

from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator


class LLMProvider(ABC):
    """Define o que todo provedor de modelo de IA precisa saber fazer."""

    @abstractmethod
    async def generate(self, messages: list[dict[str, str]]) -> str:
        """Gera uma resposta completa a partir do histórico de mensagens."""
        raise NotImplementedError

    @abstractmethod
    async def generate_stream(
        self, messages: list[dict[str, str]]
    ) -> AsyncGenerator[str, None]:
        """Gera a resposta em pedaços (streaming), palavra por palavra."""
        raise NotImplementedError