from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class NotificationPreferences(BaseModel):
    """User notification preferences"""
    wo_assigned: bool = True  # Notify when work order assigned
    wo_status_changed: bool = True  # Notify when status changes
    wo_overdue: bool = True  # Notify when work orders become overdue
    wo_due_soon: bool = True  # Remind 7 days before due
    email_digest: bool = False  # Daily email digest


class UserSettings(BaseModel):
    """User settings including notification preferences"""
    notifications: Optional[NotificationPreferences] = None


class ProfileUpdate(BaseModel):
    """Profile fields that users can update themselves"""
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(BaseModel):
    email: Optional[str] = None
    password_hash: Optional[str] = None
    name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    employee_id: Optional[str] = None
    job_title: Optional[str] = None
    role: Optional[str] = None  # Display role for show
    userRole: str  # System role for permissions
    teamId: Optional[str] = None  # Team ID for technician grouping
    replit_user_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


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
    teamId: Optional[str] = None  # Team ID for technician grouping
    status: Optional[str] = None
    settings: Optional[dict] = None


class RoleUpdateRequest(BaseModel):
    userRole: str
    reason: Optional[str] = None


class User(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: Optional[str] = None
    password_hash: Optional[str] = None
    name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    employee_id: Optional[str] = None
    job_title: Optional[str] = None
    role: Optional[str] = None  # Display role for show
    userRole: str = Field(validation_alias="user_role")  # System role for permissions
    teamId: Optional[str] = Field(default=None, validation_alias="team_id")  # Team ID for technician grouping
    status: Optional[str] = None
    settings: Optional[dict] = None
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    replit_user_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
