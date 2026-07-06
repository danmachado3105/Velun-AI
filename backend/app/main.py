"""
Ponto de entrada da aplicação Velun AI.

Este arquivo é responsável apenas por criar e configurar a instância
do FastAPI e registrar os routers (rotas). Toda a lógica de negócio
fica nas camadas de application/domain — main.py não deve conter
regras de negócio, apenas "montagem" da aplicação.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import health, chat

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)

# CORS: necessário porque o frontend (React, rodando em outra porta)
# vai fazer requisições para essa API. Em produção, restringiremos
# as origens permitidas — por enquanto, liberamos para desenvolvimento local.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
],  # porta padrão do Vite (React)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de rotas: cada "domínio" da aplicação (health, chat, memória...)
# terá seu próprio router, mantendo main.py limpo e organizado.
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])