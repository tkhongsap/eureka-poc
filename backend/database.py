import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy import text

# Load .env file from project root
project_root = Path(__file__).parent.parent
env_path = project_root / ".env"
load_dotenv(dotenv_path=env_path)


class Base(DeclarativeBase):
    pass


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
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from db_models import Request, WorkOrder, Image, Notification
    Base.metadata.create_all(bind=engine)
    print("[Database] Tables created successfully")

    # Ensure images table has base64_data column (for existing databases)
    try:
        with engine.connect() as conn:
            # Check column existence in PostgreSQL
            result = conn.execute(text(
                """
                SELECT EXISTS (
                  SELECT 1 FROM information_schema.columns 
                  WHERE table_name='images' AND column_name='base64_data'
                )
                """
            ))
            exists = result.scalar()
            if not exists:
                conn.execute(text("ALTER TABLE images ADD COLUMN base64_data TEXT"))
                print("[Database] Added column images.base64_data")
    except Exception as e:
        print(f"[Database] Warning: could not verify/add base64_data column: {e}")
