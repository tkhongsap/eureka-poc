"""
User Models for Eureka CMMS

This module defines the Pydantic models for user management in the multi-tenant
architecture. Each user has a role that determines their permissions and data access scope.

Models:
    - UserRole: Enum for user roles
    - UserStatus: Enum for user account status
    - UserBase: Base model with shared fields
    - UserCreate: Model for creating new users
    - UserUpdate: Model for updating existing users
    - User: Full user model with all fields
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRole(str, Enum):
    """
    User role determines what actions they can perform and what data they can access.
    
    Maps directly to the permission matrix in workflow-implementation.md.
    Single role per user in Phase 1 (multi-role support can be added in Phase 2).
    """

    SUPER_ADMIN = "super_admin"
    TENANT_ADMIN = "tenant_admin"
    TENANT_CONFIG_MANAGER = "tenant_config_manager"
    SITE_MANAGER = "site_manager"
    SITE_STORE_MANAGER = "site_store_manager"
    TECHNICIAN = "technician"
    TENANT_EOC = "tenant_eoc"
    TENANT_SPARE_PART_CENTER = "tenant_spare_part_center"


class UserStatus(str, Enum):
    """
    User account status.
    
    - active: Normal operation, user can login and perform actions
    - suspended: Temporary block (e.g., payment issues, investigation), data preserved but login disabled
    - deactivated: Permanent removal, account cannot login. Data preserved for compliance
    """

    ACTIVE = "active"
    SUSPENDED = "suspended"
    DEACTIVATED = "deactivated"


class UserBase(BaseModel):
    """
    Base user model with shared fields for create and update operations.
    """

    # Profile information
    first_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="User's first name. Displayed in UI greetings and work order assignments",
    )

    last_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="User's last name. Required for formal reports and compliance documents",
    )

    display_name: Optional[str] = Field(
        None,
        max_length=255,
        description="Cached full display name. Computed from first_name and last_name but can be overridden for nicknames",
    )

    email: EmailStr = Field(
        ...,
        description="Primary login credential. Must be globally unique across all tenants",
    )

    phone: Optional[str] = Field(
        None,
        max_length=50,
        description="Contact phone number. Critical for emergency dispatch and work order assignments. Include country code",
    )

    avatar_url: Optional[str] = Field(
        None,
        max_length=500,
        description="URL to user's profile image (stored in MinIO/S3). Displayed in work order cards and Kanban board",
    )

    employee_id: Optional[str] = Field(
        None,
        max_length=50,
        description="Employee identifier from HR/ERP systems. Links CMMS user identity to corporate identity",
    )

    job_title: Optional[str] = Field(
        None,
        max_length=100,
        description="User's job title or position. Provides role context in UI and helps with work order assignments",
    )

    # Role and multi-tenant assignment
    role: UserRole = Field(
        ...,
        description="User's role determines actions and data access. Maps to permission matrix",
    )

    tenant_id: Optional[str] = Field(
        None,
        description="Tenant ID (UUID). Required for all users except super_admin. Used for multi-tenant data isolation",
    )

    site_id: Optional[str] = Field(
        None,
        description="Site ID (UUID). Required for site-level roles (technician, site_manager, site_store_manager). NULL for tenant-level roles",
    )

    # System and status management
    status: UserStatus = Field(
        UserStatus.ACTIVE,
        description="User account status. Controls access to the platform",
    )

    settings: Dict[str, Any] = Field(
        default_factory=dict,
        description="Flexible JSON storage for user preferences: theme, language, notifications, filters, dashboard layout",
    )


class UserCreate(UserBase):
    """
    Model for creating a new user.
    
    Includes password field which is required for creation but not stored in base model.
    """

    password: str = Field(
        ...,
        min_length=8,
        description="Plain text password. Will be hashed before storage. Minimum 8 characters",
    )

    code: Optional[str] = Field(
        None,
        max_length=20,
        description="Human-readable user code (e.g., USR-001). Auto-generated if not provided",
    )


class UserUpdate(BaseModel):
    """
    Model for updating an existing user.
    
    All fields are optional to allow partial updates.
    Password updates should be handled separately for security.
    """

    first_name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        description="User's first name",
    )

    last_name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        description="User's last name",
    )

    display_name: Optional[str] = Field(
        None,
        max_length=255,
        description="Cached full display name. Can be overridden for nicknames",
    )

    email: Optional[EmailStr] = Field(
        None,
        description="Primary login credential. Must be globally unique across all tenants",
    )

    phone: Optional[str] = Field(
        None,
        max_length=50,
        description="Contact phone number. Include country code",
    )

    avatar_url: Optional[str] = Field(
        None,
        max_length=500,
        description="URL to user's profile image (stored in MinIO/S3)",
    )

    employee_id: Optional[str] = Field(
        None,
        max_length=50,
        description="Employee identifier from HR/ERP systems",
    )

    job_title: Optional[str] = Field(
        None,
        max_length=100,
        description="User's job title or position",
    )

    role: Optional[UserRole] = Field(
        None,
        description="User's role determines actions and data access",
    )

    tenant_id: Optional[str] = Field(
        None,
        description="Tenant ID (UUID). Required for all users except super_admin",
    )

    site_id: Optional[str] = Field(
        None,
        description="Site ID (UUID). Required for site-level roles",
    )

    status: Optional[UserStatus] = Field(
        None,
        description="User account status. Controls access to the platform",
    )

    settings: Optional[Dict[str, Any]] = Field(
        None,
        description="Flexible JSON storage for user preferences",
    )


class User(UserBase):
    """
    Full user model with all fields including audit trail.
    
    Used for API responses and includes read-only fields like id, created_at, etc.
    """

    # Core identification
    id: str = Field(
        ...,
        description="Unique identifier (UUID as string). Used as foreign key reference in work_orders and audit trails",
    )

    code: str = Field(
        ...,
        max_length=20,
        description="Human-readable user code (e.g., USR-001). Unique within tenant",
    )

    # System fields (read-only)
    last_login_at: Optional[str] = Field(
        None,
        description="Timestamp of last successful login (ISO format). NULL if user has never logged in",
    )

    # Audit trail
    created_at: str = Field(
        ...,
        description="Timestamp when user account was created (ISO format). Never modified after initial creation",
    )

    updated_at: str = Field(
        ...,
        description="Timestamp of last modification (ISO format). Auto-updated via database trigger",
    )

    created_by: Optional[str] = Field(
        None,
        description="User ID of admin who created this user account (UUID). NULL for system-seeded records",
    )

    updated_by: Optional[str] = Field(
        None,
        description="User ID who last modified this user record (UUID). Tracks all changes for audit trail",
    )

    # Exclude password_hash from API responses (security)
    class Config:
        exclude = {"password_hash"}


class UserResponse(User):
    """
    User model for API responses.
    
    Excludes sensitive fields like password_hash.
    """

    pass


class UserLogin(BaseModel):
    """
    Model for user login requests.
    """

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class UserPasswordChange(BaseModel):
    """
    Model for password change requests.
    """

    current_password: str = Field(..., description="Current password for verification")
    new_password: str = Field(
        ...,
        min_length=8,
        description="New password. Minimum 8 characters",
    )

