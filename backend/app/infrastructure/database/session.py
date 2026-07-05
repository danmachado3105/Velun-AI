"""
Gerenciamento da conexão com o banco de dados.

Define o 'engine' (conexão física com o banco) e a fábrica de sessões.
O padrão `get_db` abaixo é o jeito recomendado pelo próprio FastAPI de
injetar uma sessão de banco por requisição, garantindo que ela seja
sempre fechada corretamente, mesmo se ocorrer um erro no meio do caminho.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings

# connect_args é necessário apenas para SQLite: por padrão, o SQLite
# não permite que a mesma conexão seja usada por threads diferentes,
# mas o FastAPI pode processar requisições em threads distintas.
# Ao migrar para PostgreSQL, essa linha deixa de ser necessária.
connect_args = (
    {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency do FastAPI: fornece uma sessão de banco por requisição.

    O padrão `yield` garante que, mesmo se a rota lançar uma exceção,
    o bloco `finally` executa e a conexão é devolvida ao pool.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()