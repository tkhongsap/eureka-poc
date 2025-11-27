"""
Tenant Models for Eureka CMMS

This module defines the Pydantic models for tenant management in the multi-tenant
architecture. Each tenant represents an organization using the platform.

Models:
    - TenantStatus: Enum for tenant account status
    - SubscriptionPlan: Enum for subscription tiers
    - TenantBase: Base model with shared fields
    - TenantCreate: Model for creating new tenants
    - TenantUpdate: Model for updating existing tenants
    - Tenant: Full tenant model with all fields
"""

from datetime import date, datetime
from enum import Enum
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class TenantStatus(str, Enum):
    """
    Tenant account status.
    
    - active: Normal operation, full access to platform
    - suspended: Temporary block (e.g., payment issues), data preserved
    - deactivated: Permanent deactivation, data archived
    """
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DEACTIVATED = "deactivated"


class SubscriptionPlan(str, Enum):
    """
    Subscription tier determining feature access and pricing.
    
    - starter: Basic features, limited users, standard support
    - professional: Advanced features, more users, priority support
    - enterprise: Full features, unlimited users, dedicated support
    """
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


class TenantBase(BaseModel):
    """
    Base tenant model with shared fields for create and update operations.
    """
    
    # Organization name displayed throughout the application
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Official organization name (e.g., 'Acme Manufacturing Corp')"
    )
    
    # Legal company registration or tax ID number
    company_registration_number: Optional[str] = Field(
        None,
        max_length=100,
        description="Legal company registration or tax ID number for invoicing and compliance"
    )
    
    # Primary contact information
    primary_contact_name: Optional[str] = Field(
        None,
        max_length=255,
        description="Name of the primary contact person responsible for the tenant account"
    )
    
    primary_contact_email: EmailStr = Field(
        ...,
        description="Email address for billing notifications, system alerts, and account management"
    )
    
    primary_contact_phone: Optional[str] = Field(
        None,
        max_length=50,
        description="Phone number for urgent support escalations (include country code)"
    )
    
    billing_address: Optional[str] = Field(
        None,
        description="Full postal address for invoicing and legal correspondence"
    )
    
    # Subscription and licensing
    subscription_plan: SubscriptionPlan = Field(
        SubscriptionPlan.STARTER,
        description="Subscription tier: starter, professional, or enterprise"
    )
    
    license_pool: int = Field(
        0,
        ge=0,
        description="Total number of user licenses allocated to this tenant"
    )
    
    contract_start_date: Optional[date] = Field(
        None,
        description="Subscription effective start date for billing cycle calculations"
    )
    
    contract_end_date: Optional[date] = Field(
        None,
        description="Subscription expiration date. System sends renewal reminders before expiry"
    )
    
    # Regional configuration
    timezone: str = Field(
        "UTC",
        max_length=50,
        description="Default timezone in IANA format (e.g., 'Asia/Bangkok')"
    )
    
    currency: str = Field(
        "USD",
        min_length=3,
        max_length=3,
        description="ISO 4217 currency code for cost calculations and financial reports"
    )
    
    language: str = Field(
        "en",
        max_length=10,
        description="Default UI language code (ISO 639-1). Users can override in preferences"
    )
    
    date_format: str = Field(
        "YYYY-MM-DD",
        max_length=20,
        description="Date display format (YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY)"
    )
    
    # Branding
    logo_url: Optional[str] = Field(
        None,
        max_length=500,
        description="URL to tenant logo image (stored in MinIO/S3)"
    )
    
    branding_primary_color: Optional[str] = Field(
        "#2563EB",
        max_length=7,
        description="Primary brand color in hex format (e.g., '#2563EB')"
    )
    
    branding_secondary_color: Optional[str] = Field(
        None,
        max_length=7,
        description="Secondary brand color in hex format"
    )
    
    # Flexible settings storage
    settings: Dict[str, Any] = Field(
        default_factory=dict,
        description="Flexible JSON storage for tenant-specific configurations"
    )

    @field_validator("branding_primary_color", "branding_secondary_color")
    @classmethod
    def validate_hex_color(cls, v: Optional[str]) -> Optional[str]:
        """Validate that color values are in hex format (#RRGGBB)."""
        if v is None:
            return v
        if not v.startswith("#") or len(v) != 7:
            raise ValueError("Color must be in hex format (#RRGGBB)")
        try:
            int(v[1:], 16)
        except ValueError:
            raise ValueError("Color must be a valid hex color code")
        return v.upper()

    @field_validator("contract_end_date")
    @classmethod
    def validate_contract_dates(cls, v: Optional[date], info) -> Optional[date]:
        """Ensure contract end date is after start date."""
        if v is None:
            return v
        start_date = info.data.get("contract_start_date")
        if start_date and v < start_date:
            raise ValueError("Contract end date must be after start date")
        return v


class TenantCreate(TenantBase):
    """
    Model for creating a new tenant.
    
    The tenant code is auto-generated by the system (e.g., TNT-001),
    so it's not included in the create request.
    """
    pass


class TenantUpdate(BaseModel):
    """
    Model for updating an existing tenant.
    
    All fields are optional - only provided fields will be updated.
    The tenant code and ID cannot be changed after creation.
    """
    
    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=255,
        description="Official organization name"
    )
    
    company_registration_number: Optional[str] = Field(
        None,
        max_length=100,
        description="Legal company registration or tax ID number"
    )
    
    primary_contact_name: Optional[str] = Field(
        None,
        max_length=255,
        description="Name of the primary contact person"
    )
    
    primary_contact_email: Optional[EmailStr] = Field(
        None,
        description="Email address for billing and system notifications"
    )
    
    primary_contact_phone: Optional[str] = Field(
        None,
        max_length=50,
        description="Phone number for support escalations"
    )
    
    billing_address: Optional[str] = Field(
        None,
        description="Full postal address for invoicing"
    )
    
    subscription_plan: Optional[SubscriptionPlan] = Field(
        None,
        description="Subscription tier"
    )
    
    license_pool: Optional[int] = Field(
        None,
        ge=0,
        description="Total number of user licenses"
    )
    
    contract_start_date: Optional[date] = Field(
        None,
        description="Subscription start date"
    )
    
    contract_end_date: Optional[date] = Field(
        None,
        description="Subscription end date"
    )
    
    timezone: Optional[str] = Field(
        None,
        max_length=50,
        description="Default timezone in IANA format"
    )
    
    currency: Optional[str] = Field(
        None,
        min_length=3,
        max_length=3,
        description="ISO 4217 currency code"
    )
    
    language: Optional[str] = Field(
        None,
        max_length=10,
        description="Default UI language code"
    )
    
    date_format: Optional[str] = Field(
        None,
        max_length=20,
        description="Date display format"
    )
    
    logo_url: Optional[str] = Field(
        None,
        max_length=500,
        description="URL to tenant logo"
    )
    
    branding_primary_color: Optional[str] = Field(
        None,
        max_length=7,
        description="Primary brand color in hex format"
    )
    
    branding_secondary_color: Optional[str] = Field(
        None,
        max_length=7,
        description="Secondary brand color in hex format"
    )
    
    status: Optional[TenantStatus] = Field(
        None,
        description="Tenant account status"
    )
    
    settings: Optional[Dict[str, Any]] = Field(
        None,
        description="Tenant-specific configurations"
    )

    @field_validator("branding_primary_color", "branding_secondary_color")
    @classmethod
    def validate_hex_color(cls, v: Optional[str]) -> Optional[str]:
        """Validate that color values are in hex format (#RRGGBB)."""
        if v is None:
            return v
        if not v.startswith("#") or len(v) != 7:
            raise ValueError("Color must be in hex format (#RRGGBB)")
        try:
            int(v[1:], 16)
        except ValueError:
            raise ValueError("Color must be a valid hex color code")
        return v.upper()


class Tenant(TenantBase):
    """
    Full tenant model representing a record in the database.
    
    Includes all base fields plus system-managed fields like ID, code,
    status, license usage, and audit timestamps.
    """
    
    # System-generated identifier (UUID)
    id: UUID = Field(
        ...,
        description="Unique identifier for the tenant (UUID)"
    )
    
    # Human-readable tenant code (auto-generated, e.g., TNT-001)
    code: str = Field(
        ...,
        max_length=20,
        description="Human-readable tenant code for UI and reports"
    )
    
    # Current license usage (managed by the system)
    licenses_used: int = Field(
        0,
        ge=0,
        description="Current count of active user licenses"
    )
    
    # Account status
    status: TenantStatus = Field(
        TenantStatus.ACTIVE,
        description="Tenant account status: active, suspended, or deactivated"
    )
    
    # Audit timestamps
    created_at: datetime = Field(
        ...,
        description="Timestamp when tenant was onboarded"
    )
    
    updated_at: datetime = Field(
        ...,
        description="Timestamp of last modification"
    )
    
    # Audit user references (UUID of the user who performed the action)
    created_by: Optional[UUID] = Field(
        None,
        description="User ID of Super Admin who created this tenant"
    )
    
    updated_by: Optional[UUID] = Field(
        None,
        description="User ID who last modified this tenant record"
    )

    class Config:
        """Pydantic configuration."""
        from_attributes = True  # Enable ORM mode for SQLAlchemy compatibility

