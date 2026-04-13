import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

# Support both Supabase PostgreSQL (production) and SQLite (local dev)
_raw_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./eaios_dev.db")

# Supabase uses postgresql+asyncpg:// — keep as-is.  Local dev uses SQLite.
DATABASE_URL = _raw_url

_connect_args: dict = {}
if DATABASE_URL.startswith("sqlite"):
    _connect_args = {"check_same_thread": False}

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args=_connect_args,
)

SessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with SessionLocal() as session:
        yield session


async def create_all_tables():
    """Used by the seed script and tests to create tables on SQLite."""
    async with engine.begin() as conn:
        from src.models import database  # ensure Base is the same object
        await conn.run_sync(Base.metadata.create_all)
