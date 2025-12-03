from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class UserSettings(BaseModel):
    # Future implementation
    pass


class UserCreate(BaseModel):
    email: str
    password_hash: str
    name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    employee_id: Optional[str] = None
    job_title: Optional[str] = None
    role: Optional[str] = None  # Display role for show
    userRole: str  # System role for permissions


class UserUpdate(BaseModel):
    email: Optional[str] = None
    password_hash: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    employee_id: Optional[str] = None
    job_title: Optional[str] = None
    role: Optional[str] = None  # Display role for show
    userRole: Optional[str] = None  # System role for permissions
    status: Optional[str] = None
    settings: Optional[dict] = None


class User(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    password_hash: Optional[str] = None
    name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    employee_id: Optional[str] = None
    job_title: Optional[str] = None
    role: Optional[str] = None  # Display role for show
    userRole: str = Field(validation_alias="user_role")  # System role for permissions
    status: Optional[str] = None
    settings: Optional[dict] = None
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
