import os
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine
from alembic import context

# Load .env file so DATABASE_URL is available when running alembic directly
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))
except ImportError:
    pass

# Alembic Config object
config = context.config

# Set up logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")

# Import ALL models so autogenerate can detect them
from src.models.database import Base  # noqa: F401 — Base must be imported
import src.models.core          # noqa: F401
import src.models.alerts        # noqa: F401
import src.models.work_orders   # noqa: F401
import src.models.spare_parts   # noqa: F401
import src.models.ml_models     # noqa: F401
import src.models.digital_twin  # noqa: F401
import src.models.ot_data       # noqa: F401
import src.models.tar           # noqa: F401
import src.models.roi           # noqa: F401
import src.models.compliance    # noqa: F401
import src.models.energy        # noqa: F401
import src.models.field_ops     # noqa: F401
import src.models.castrol       # noqa: F401
import src.models.offshore      # noqa: F401
import src.models.adoption      # noqa: F401
import src.models.wave_tracker     # noqa: F401
import src.models.edge_ai          # noqa: F401
import src.models.artemis_core     # noqa: F401
import src.models.artemis_arbitrage  # noqa: F401
import src.models.artemis_castrol  # noqa: F401
import src.models.artemis_aviation # noqa: F401
import src.models.artemis_carbon   # noqa: F401

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    # Create engine directly from DATABASE_URL to avoid configparser % interpolation issues
    connectable = create_async_engine(DATABASE_URL, poolclass=pool.NullPool)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    import asyncio
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
