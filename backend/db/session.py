import os
from pathlib import Path

from db.base import Base
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Load .env file from project root
project_root = Path(__file__).parent.parent.parent
env_path = project_root / ".env"
load_dotenv(dotenv_path=env_path)


DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")


engine = create_engine(
    DATABASE_URL,
    pool_recycle=300,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Yield a database session for FastAPI dependencies."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database tables.

    In production you should prefer Alembic migrations, but this helper
    keeps compatibility with the existing startup flow.
    """
    # Import models so they are registered with Base.metadata
    from db import models as _models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    print("[Database] Tables created successfully")

    # Ensure images table has base64_data column (for existing databases)
    try:
        with engine.connect() as conn:
            # Check column existence in PostgreSQL
            result = conn.execute(
                text(
                    """
                SELECT EXISTS (
                  SELECT 1 FROM information_schema.columns 
                  WHERE table_name='images' AND column_name='base64_data'
                )
                """
                )
            )
            exists = result.scalar()
            if not exists:
                conn.execute(text("ALTER TABLE images ADD COLUMN base64_data TEXT"))
                print("[Database] Added column images.base64_data")
    except Exception as e:
        print(f"[Database] Warning: could not verify/add base64_data column: {e}")

    # Ensure users table has team_id column (for existing databases)
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text(
                    """
                SELECT EXISTS (
                  SELECT 1 FROM information_schema.columns 
                  WHERE table_name='users' AND column_name='team_id'
                )
                """
                )
            )
            exists = result.scalar()
            if not exists:
                conn.execute(text("ALTER TABLE users ADD COLUMN team_id VARCHAR(100)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_team_id ON users (team_id)"))
                conn.commit()
                print("[Database] Added column users.team_id with index")
    except Exception as e:
        print(f"[Database] Warning: could not verify/add team_id column: {e}")

    # Ensure workorders table has managed_by column (for existing databases)
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text(
                    """
                SELECT EXISTS (
                  SELECT 1 FROM information_schema.columns 
                  WHERE table_name='workorders' AND column_name='managed_by'
                )
                """
                )
            )
            exists = result.scalar()
            if not exists:
                conn.execute(text("ALTER TABLE workorders ADD COLUMN managed_by VARCHAR(255)"))
                conn.commit()
                print("[Database] Added column workorders.managed_by")
    except Exception as e:
        print(f"[Database] Warning: could not verify/add managed_by column: {e}")
