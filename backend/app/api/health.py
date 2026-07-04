"""
Rotas de health check.

Servem para verificar se a API está no ar e se as dependências externas
(neste caso, o Ollama) estão acessíveis. Isso é essencial em qualquer
sistema real: é o primeiro endpoint que ferramentas de monitoramento
e o próprio frontend vão checar antes de assumir que o backend está saudável.
"""

import httpx
from fastapi import APIRouter

from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    """Verifica se a API está rodando (sem checar dependências externas)."""
    return {"status": "ok", "app": settings.APP_NAME}


@router.get("/health/ollama")
async def health_check_ollama():
    """Verifica se conseguimos nos comunicar com o Ollama."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            response.raise_for_status()
            models = [m["name"] for m in response.json().get("models", [])]
            return {
                "status": "ok",
                "ollama_url": settings.OLLAMA_BASE_URL,
                "available_models": models,
            }
    except httpx.HTTPError as exc:
        return {
            "status": "error",
            "detail": f"Não foi possível conectar ao Ollama: {exc}",
        }