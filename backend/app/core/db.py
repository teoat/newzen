import os
from contextlib import contextmanager
from sqlmodel import create_engine, Session, SQLModel
from dotenv import load_dotenv

load_dotenv()

# Database configuration with production-ready pooling
DEFAULT_DB_URL = "sqlite:///./storage/zenith.db"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Configure connection based on database type and environment
if DATABASE_URL.startswith("sqlite"):
    # SQLite configuration (development)
    connect_args = {"check_same_thread": False}
    echo = ENVIRONMENT == "development"
    engine = create_engine(
        DATABASE_URL,
        echo=echo,
        connect_args=connect_args
    )
else:
    # PostgreSQL configuration (production) with connection pooling
    pool_size = int(os.getenv("DB_POOL_SIZE", "20"))
    max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "10"))
    pool_timeout = int(os.getenv("DB_POOL_TIMEOUT", "30"))
    pool_recycle = int(os.getenv("DB_POOL_RECYCLE", "3600"))

    engine = create_engine(
        DATABASE_URL,
        echo=ENVIRONMENT == "development",
        pool_size=pool_size,
        max_overflow=max_overflow,
        pool_timeout=pool_timeout,
        pool_recycle=pool_recycle,
        pool_pre_ping=True,  # Validate connections before use
        pool_reset_on_return="commit"  # Reset connection state
    )


def init_db():
    """Initialize the database schema."""
    # Standardize on Alembic migrations. SQLModel.metadata.create_all
    # is kept for unit testing and initial dev scaffolding.
    SQLModel.metadata.create_all(engine)


@contextmanager
def get_db():
    """Context manager for database sessions."""
    with Session(engine) as session:
        yield session


def get_session():
    """FastAPI dependency for database sessions."""
    with Session(engine) as session:
        yield session
