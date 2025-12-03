from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.sql import func

from db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
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
