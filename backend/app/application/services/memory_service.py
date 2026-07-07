"""
Serviço de memórias.

Decide quando uma mensagem do usuário deve virar uma memória
permanente, e busca memórias relevantes para enriquecer futuras
respostas da IA.
"""

from app.core.prompts import MEMORY_EXTRACTION_PROMPT
from app.infrastructure.llm.base import LLMProvider
from app.infrastructure.memory.memory_repository import MemoryRepository


class MemoryService:
    """Organiza a extração e busca de memórias."""

    def __init__(self, memory_repository: MemoryRepository, llm_provider: LLMProvider):
        self.memory_repository = memory_repository
        self.llm_provider = llm_provider

    async def extract_and_save(self, user_message: str) -> None:
        """
        Analisa uma mensagem do usuário e salva como memória, se
        for identificado algo relevante para lembrar no futuro.
        """
        prompt = MEMORY_EXTRACTION_PROMPT.format(message=user_message)
        result = await self.llm_provider.generate([{"role": "user", "content": prompt}])

        cleaned_result = result.strip()
        if cleaned_result.upper() != "NADA" and len(cleaned_result) > 0:
            await self.memory_repository.add_memory(cleaned_result)

    async def get_relevant_context(self, query: str) -> str:
        """
        Busca memórias relevantes para a mensagem atual e as formata
        como um texto pronto para ser incluído no prompt da IA.
        """
        memories = await self.memory_repository.search_relevant_memories(query)
        if not memories:
            return ""

        memory_lines = "\n".join(f"- {memory}" for memory in memories)
        return f"\n\nInformações que você sabe sobre o usuário:\n{memory_lines}"