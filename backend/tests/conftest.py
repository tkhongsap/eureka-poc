import os
import shutil
import tempfile
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from db.base import Base
from db import get_db as real_get_db
from utils import PICTURES_DIR

from main import app

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

# Use StaticPool so all sessions share the same in-memory database connection.
# Otherwise each connection would see its own empty database, causing "no such table" errors.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def create_test_db() -> Generator[None, None, None]:
    """Create all tables in the in-memory SQLite database for the test session."""
    # Import models so they are registered with Base.metadata
    from db import models as _models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    try:
        yield
    finally:
        Base.metadata.drop_all(bind=engine)


def override_get_db() -> Generator:
    """Yield a database session for FastAPI dependency override."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session")
def temp_pictures_dir() -> Generator[str, None, None]:
    """
    Use a temporary directory for image storage during tests to avoid
    writing files into the real storage folder.
    """
    original_dir = PICTURES_DIR
    temp_dir = tempfile.mkdtemp(prefix="test_pictures_")
    # Ensure the directory exists
    os.makedirs(temp_dir, exist_ok=True)

    # Monkeypatch the module-level constant used by the app
    import utils.storage as storage_module

    storage_module.PICTURES_DIR = temp_dir

    try:
        yield temp_dir
    finally:
        # Restore original value
        storage_module.PICTURES_DIR = original_dir
        shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture(scope="session")
def client(
    create_test_db: None, temp_pictures_dir: str
) -> Generator[TestClient, None, None]:
    """
    Provide a TestClient with the test database and temporary pictures directory.
    """
    app.dependency_overrides[real_get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
