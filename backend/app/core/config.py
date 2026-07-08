"""
Configurações centrais da aplicação Velun AI.

Este módulo define a classe Settings, responsável por carregar e validar
todas as variáveis de ambiente usadas pelo sistema. Centralizar a
configuração aqui evita espalhar `os.getenv()` pelo código e garante
que erros de configuração sejam detectados na inicialização, não em
produção.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações da aplicação, carregadas a partir do arquivo .env."""

    # --- Aplicação ---
    APP_NAME: str = "Velun AI"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # --- Modelo de IA (Ollama) ---
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:3b"
    OLLAMA_EMBEDDING_MODEL: str = "nomic-embed-text"
    OLLAMA_VISION_MODEL: str = "qwen2.5vl:3b"

    # --- Banco de dados ---
    DATABASE_URL: str = "sqlite:///./velun.db"

    # Diz ao Pydantic para carregar essas variáveis a partir do arquivo .env
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


# Instância única (singleton) usada por toda a aplicação.
# Importamos essa variável em vez de instanciar Settings() em cada arquivo.
settings = Settings()