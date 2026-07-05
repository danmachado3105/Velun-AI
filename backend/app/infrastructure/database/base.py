"""
Base declarativa do SQLAlchemy.

Todas as classes de modelo (tabelas) do sistema herdam desta Base.
Mantê-la em um arquivo separado evita imports circulares entre
os modelos e o módulo de sessão do banco.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Classe base para todos os modelos ORM da aplicação."""
    pass