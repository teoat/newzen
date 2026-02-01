import pytest
from sqlmodel import create_engine, SQLModel
from sqlalchemy.pool import StaticPool
from app.core import db as app_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_engine():
    """
    Globally override the database engine for all tests to use a shared in-memory SQLite DB.
    This ensures consistency across different test modules and background tasks.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # Override the global engine in app.core.db
    app_db.engine = engine
    
    # Import all models to register them with SQLModel metadata
    from app import models 
    
    # Initialize schema
    SQLModel.metadata.create_all(engine)
    
    yield engine
