import os
import shutil
import tempfile
from datetime import datetime
from typing import Generator

import pytest
from config import SESSION_COOKIE_NAME, SESSION_SECRET
from db import get_db as real_get_db
from db.base import Base
from fastapi.testclient import TestClient
from itsdangerous import URLSafeTimedSerializer
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from utils import PICTURES_DIR

session_serializer = URLSafeTimedSerializer(SESSION_SECRET)

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


@pytest.fixture(scope="function", autouse=True)
def clean_db(create_test_db):
    """
    Clean all data from database tables before and after each test.
    This ensures test isolation - each test starts with a fresh database.
    """
    # Import models to get all tables registered
    from db import models as _models  # noqa: F401

    # Get table names from metadata
    table_names = list(Base.metadata.tables.keys())

    # Clean up before test runs
    def cleanup():
        with engine.begin() as conn:
            # Disable foreign key checks for SQLite to allow any deletion order
            conn.execute(text("PRAGMA foreign_keys = OFF"))
            for table_name in table_names:
                conn.execute(text(f"DELETE FROM {table_name}"))
            conn.execute(text("PRAGMA foreign_keys = ON"))

    cleanup()  # Clean before test
    yield
    cleanup()  # Clean after test


def create_session_token(user_id: str) -> str:
    """Create a session token for testing authentication"""
    session_data = {
        "user_id": user_id,
        "user_data": {},
        "created_at": datetime.now().isoformat(),
    }
    return session_serializer.dumps(session_data)


def create_authenticated_user(client, **user_data) -> dict:
    """
    Create a user and return user data with session token.
    Useful for tests that need an authenticated user.

    Args:
        client: TestClient instance
        **user_data: User data to override defaults (email, password_hash, name, userRole, etc.)

    Returns:
        dict with user data and 'token' key containing the session token
    """
    default_user = {
        "email": "auth@example.com",
        "password_hash": "hash",
        "name": "Auth User",
        "userRole": "Admin",
    }
    default_user.update(user_data)

    resp = client.post("/api/users", json=default_user)
    assert resp.status_code == 200
    user = resp.json()
    token = create_session_token(user["id"])
    return {**user, "token": token, "cookies": {SESSION_COOKIE_NAME: token}}


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


@pytest.fixture
def auth_user(client: TestClient) -> dict:
    """
    Create an authenticated user (Admin role by default) and return user data with token.

    Returns:
        dict with user data and 'token' key containing the session token

    Usage:
        def test_something(client: TestClient, auth_user: dict):
            resp = client.get("/api/protected", cookies={SESSION_COOKIE_NAME: auth_user["token"]})
    """

    return create_authenticated_user(client, userRole="Admin")


@pytest.fixture
def auth_technician(client: TestClient) -> dict:
    """
    Create an authenticated user with Technician role and return user data with token.

    Returns:
        dict with user data and 'token' key containing the session token
    """

    return create_authenticated_user(client, userRole="Technician")


@pytest.fixture
def auth_head_technician(client: TestClient) -> dict:
    """
    Create an authenticated user with Head Technician role and return user data with token.

    Returns:
        dict with user data and 'token' key containing the session token
    """

    return create_authenticated_user(client, userRole="Head Technician")
