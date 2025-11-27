"""
Site Models for Eureka CMMS

This module defines the Pydantic models for site management in the multi-site,
multi-tenant architecture. Each site represents a factory, warehouse, office,
or facility within a tenant organization.

Models:
    - SiteType: Enum for site type classification
    - SiteStatus: Enum for site operational status
    - SiteCriticality: Enum for site criticality level
    - SiteBase: Base model with shared fields
    - SiteCreate: Model for creating new sites
    - SiteUpdate: Model for updating existing sites
    - Site: Full site model with all fields
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class SiteType(str, Enum):
    """
    Type of site determines available workflows and features.
    
    - factory: Production facilities with equipment maintenance focus
    - warehouse: Material storage with handling equipment
    - office: Administrative buildings with HVAC/facilities focus
    - distribution_center: Logistics hubs with material handling
    - other: Custom site types
    """
    FACTORY = "factory"
    WAREHOUSE = "warehouse"
    OFFICE = "office"
    DISTRIBUTION_CENTER = "distribution_center"
    OTHER = "other"


class SiteStatus(str, Enum):
    """
    Site operational status.
    
    - active: Normal operations, site appears in dashboards and assignments
    - inactive: Permanently closed, data archived but preserved for compliance
    - maintenance: Temporarily offline (planned shutdown, maintenance window)
    """
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"


class SiteCriticality(str, Enum):
    """
    Criticality level for resource prioritization during emergencies.
    
    Used by Enterprise Operations Center (EOC) for cross-site dispatch.
    
    - critical: Main production sites requiring immediate response
    - high: Important facilities with significant business impact
    - medium: Standard operational sites
    - low: Backup or non-critical locations
    """
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class SiteBase(BaseModel):
    """
    Base site model with shared fields for create and update operations.
    """
    
    # Site identification
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Display name shown throughout the application (e.g., 'Bangkok Manufacturing Plant')"
    )
    
    # Site classification
    site_type: SiteType = Field(
        SiteType.FACTORY,
        description="Type of site: factory, warehouse, office, distribution_center, or other"
    )
    
    criticality: SiteCriticality = Field(
        SiteCriticality.MEDIUM,
        description="Criticality level for resource prioritization: critical, high, medium, or low"
    )
    
    # Location information
    address_line1: Optional[str] = Field(
        None,
        max_length=255,
        description="Street address line 1 for shipping and legal documents"
    )
    
    address_line2: Optional[str] = Field(
        None,
        max_length=255,
        description="Street address line 2 (suite, building, floor)"
    )
    
    city: Optional[str] = Field(
        None,
        max_length=100,
        description="City name for geographic reporting"
    )
    
    state_province: Optional[str] = Field(
        None,
        max_length=100,
        description="State or province name"
    )
    
    postal_code: Optional[str] = Field(
        None,
        max_length=20,
        description="Postal or ZIP code"
    )
    
    country: Optional[str] = Field(
        None,
        max_length=100,
        description="Country name for international operations"
    )
    
    latitude: Optional[Decimal] = Field(
        None,
        ge=-90,
        le=90,
        description="GPS latitude coordinate (decimal degrees, -90 to 90)"
    )
    
    longitude: Optional[Decimal] = Field(
        None,
        ge=-180,
        le=180,
        description="GPS longitude coordinate (decimal degrees, -180 to 180)"
    )
    
    # Contact information
    site_manager_name: Optional[str] = Field(
        None,
        max_length=255,
        description="Name of the Site Manager responsible for this location"
    )
    
    site_manager_email: Optional[EmailStr] = Field(
        None,
        description="Email address of the Site Manager for notifications and alerts"
    )
    
    site_manager_phone: Optional[str] = Field(
        None,
        max_length=50,
        description="Phone number of the Site Manager (include country code)"
    )
    
    emergency_contact_name: Optional[str] = Field(
        None,
        max_length=255,
        description="Name of the emergency contact person (24/7 availability)"
    )
    
    emergency_contact_phone: Optional[str] = Field(
        None,
        max_length=50,
        description="Phone number of the emergency contact for critical situations"
    )
    
    # Licensing
    license_allocation: int = Field(
        0,
        ge=0,
        description="Number of user licenses allocated from tenant's pool to this site"
    )
    
    # Regional configuration (can override tenant defaults)
    timezone: Optional[str] = Field(
        None,
        max_length=50,
        description="Default timezone in IANA format (e.g., 'Asia/Bangkok'). If NULL, inherits from tenant"
    )
    
    currency: Optional[str] = Field(
        None,
        min_length=3,
        max_length=3,
        description="ISO 4217 currency code. If NULL, inherits from tenant"
    )
    
    language: Optional[str] = Field(
        None,
        max_length=10,
        description="Default UI language code (ISO 639-1). If NULL, inherits from tenant"
    )
    
    date_format: Optional[str] = Field(
        None,
        max_length=20,
        description="Date display format (YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY). If NULL, inherits from tenant"
    )
    
    # Flexible settings storage
    settings: Dict[str, Any] = Field(
        default_factory=dict,
        description="Flexible JSON storage for site-specific configurations"
    )


class SiteCreate(SiteBase):
    """
    Model for creating a new site.
    
    The site code is auto-generated by the system (e.g., SITE-001),
    so it's not included in the create request.
    The tenant_id is typically set from the authenticated user's context.
    """
    pass


class SiteUpdate(BaseModel):
    """
    Model for updating an existing site.
    
    All fields are optional - only provided fields will be updated.
    The site code and ID cannot be changed after creation.
    """
    
    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=255,
        description="Display name shown throughout the application"
    )
    
    site_type: Optional[SiteType] = Field(
        None,
        description="Type of site"
    )
    
    criticality: Optional[SiteCriticality] = Field(
        None,
        description="Criticality level for resource prioritization"
    )
    
    address_line1: Optional[str] = Field(
        None,
        max_length=255,
        description="Street address line 1"
    )
    
    address_line2: Optional[str] = Field(
        None,
        max_length=255,
        description="Street address line 2"
    )
    
    city: Optional[str] = Field(
        None,
        max_length=100,
        description="City name"
    )
    
    state_province: Optional[str] = Field(
        None,
        max_length=100,
        description="State or province name"
    )
    
    postal_code: Optional[str] = Field(
        None,
        max_length=20,
        description="Postal or ZIP code"
    )
    
    country: Optional[str] = Field(
        None,
        max_length=100,
        description="Country name"
    )
    
    latitude: Optional[Decimal] = Field(
        None,
        ge=-90,
        le=90,
        description="GPS latitude coordinate"
    )
    
    longitude: Optional[Decimal] = Field(
        None,
        ge=-180,
        le=180,
        description="GPS longitude coordinate"
    )
    
    site_manager_name: Optional[str] = Field(
        None,
        max_length=255,
        description="Name of the Site Manager"
    )
    
    site_manager_email: Optional[EmailStr] = Field(
        None,
        description="Email address of the Site Manager"
    )
    
    site_manager_phone: Optional[str] = Field(
        None,
        max_length=50,
        description="Phone number of the Site Manager"
    )
    
    emergency_contact_name: Optional[str] = Field(
        None,
        max_length=255,
        description="Name of the emergency contact person"
    )
    
    emergency_contact_phone: Optional[str] = Field(
        None,
        max_length=50,
        description="Phone number of the emergency contact"
    )
    
    license_allocation: Optional[int] = Field(
        None,
        ge=0,
        description="Number of user licenses allocated to this site"
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
    
    status: Optional[SiteStatus] = Field(
        None,
        description="Site operational status"
    )
    
    settings: Optional[Dict[str, Any]] = Field(
        None,
        description="Site-specific configurations"
    )


class Site(SiteBase):
    """
    Full site model representing a record in the database.
    
    Includes all base fields plus system-managed fields like ID, code,
    tenant_id, status, license usage, and audit timestamps.
    """
    
    # System-generated identifier (UUID)
    id: UUID = Field(
        ...,
        description="Unique identifier for the site (UUID)"
    )
    
    # Foreign key to parent tenant
    tenant_id: UUID = Field(
        ...,
        description="Foreign key to the parent tenant for multi-tenant data isolation"
    )
    
    # Human-readable site code (auto-generated, e.g., SITE-001)
    code: str = Field(
        ...,
        max_length=20,
        description="Human-readable site code for UI and reports"
    )
    
    # Current license usage (managed by the system)
    licenses_used: int = Field(
        0,
        ge=0,
        description="Current count of active user licenses at this site"
    )
    
    # Site status
    status: SiteStatus = Field(
        SiteStatus.ACTIVE,
        description="Site operational status: active, inactive, or maintenance"
    )
    
    # Audit timestamps
    created_at: datetime = Field(
        ...,
        description="Timestamp when site was created"
    )
    
    updated_at: datetime = Field(
        ...,
        description="Timestamp of last modification"
    )
    
    # Audit user references (UUID of the user who performed the action)
    created_by: Optional[UUID] = Field(
        None,
        description="User ID of Tenant Admin or Site Manager who created this site"
    )
    
    updated_by: Optional[UUID] = Field(
        None,
        description="User ID who last modified this site record"
    )

    class Config:
        """Pydantic configuration."""
        from_attributes = True  # Enable ORM mode for SQLAlchemy compatibility

