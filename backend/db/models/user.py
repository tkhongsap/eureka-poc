from sqlalchemy import Column, String, DateTime, JSON, Text
from sqlalchemy.sql import func

from db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True)
    email = Column(String(255), nullable=True, unique=True)
    password_hash = Column(String(255), nullable=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    employee_id = Column(String(50), nullable=True)
    job_title = Column(String(100), nullable=True)
    role = Column(String(100), nullable=True)  # Display role for show
    user_role = Column(
        String(50), nullable=False, index=True
    )  # System role for permissions
    status = Column(String(50), default="active", index=True)
    settings = Column(JSON, default=dict)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    # OAuth provider IDs
    google_user_id = Column(String(100), nullable=True, unique=True, index=True)
    replit_user_id = Column(String(100), nullable=True, unique=True, index=True)
    first_name = Column(String(255), nullable=True)
    last_name = Column(String(255), nullable=True)


class OAuth(Base):
    """OAuth token storage for Replit Auth"""
    __tablename__ = "oauth_tokens"

    id = Column(String(50), primary_key=True)
    user_id = Column(String(50), nullable=False, index=True)
    provider = Column(String(50), nullable=False, default="replit")
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_type = Column(String(50), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    browser_session_key = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
