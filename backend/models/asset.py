"""
Asset Models for Eureka CMMS

This module defines the Pydantic models for asset management in the multi-site,
multi-tenant architecture. Assets represent WHAT equipment/machines are installed
at functional locations, with their own component hierarchy (e.g., Conveyor → Motor → Bearings).

Models:
    - AssetType: Enum for asset type classification
    - AssetCriticality: Enum for asset criticality level
    - AssetStatus: Enum for asset operational status
    - AssetBase: Base model with shared fields
    - AssetCreate: Model for creating new assets
    - AssetUpdate: Model for updating existing assets
    - Asset: Full asset model with all fields
"""

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class AssetType(str, Enum):
    """
    Type of asset determines its role and available workflows.
    
    - equipment: Production equipment (conveyors, pumps, motors)
    - machine: Complex machinery (robots, CNC machines, assembly lines)
    - component: Sub-component of another asset (bearings, gears, sensors)
    - tool: Tools and instruments (measuring devices, hand tools)
    - vehicle: Mobile assets (forklifts, trucks, carts)
    - facility: Building systems (HVAC, electrical, plumbing)
    - other: Custom asset types
    """
    EQUIPMENT = "equipment"
    MACHINE = "machine"
    COMPONENT = "component"
    TOOL = "tool"
    VEHICLE = "vehicle"
    FACILITY = "facility"
    OTHER = "other"


class AssetCriticality(str, Enum):
    """
    Criticality level determines priority for maintenance and resource allocation.
    
    Used by Site Managers for work order prioritization and EOC for emergency coordination.
    
    - critical: Production-stopping equipment requiring immediate response
    - high: Important equipment with significant business impact
    - medium: Standard operational equipment
    - low: Non-critical or backup equipment
    """
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class AssetStatus(str, Enum):
    """
    Current operational status of the asset.
    
    - operational: Asset is running normally
    - downtime: Asset is not operational (breakdown, failure)
    - maintenance: Asset is under maintenance or repair
    - decommissioned: Asset is permanently removed from service
    """
    OPERATIONAL = "operational"
    DOWNTIME = "downtime"
    MAINTENANCE = "maintenance"
    DECOMMISSIONED = "decommissioned"


class AssetBase(BaseModel):
    """
    Base asset model with shared fields for create and update operations.
    """
    
    # Asset identification
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Display name shown throughout the application (e.g., 'Main Conveyor Belt')"
    )
    
    # Asset classification
    asset_type: AssetType = Field(
        AssetType.EQUIPMENT,
        description="Type of asset: equipment, machine, component, tool, vehicle, facility, or other"
    )
    
    category: Optional[str] = Field(
        None,
        max_length=100,
        description="Asset category for grouping and reporting (e.g., 'Conveyor Systems', 'Pumps')"
    )
    
    criticality: AssetCriticality = Field(
        AssetCriticality.MEDIUM,
        description="Criticality level: critical, high, medium, or low"
    )
    
    status: AssetStatus = Field(
        AssetStatus.OPERATIONAL,
        description="Current operational status: operational, downtime, maintenance, or decommissioned"
    )
    
    # Manufacturer & identification
    manufacturer: Optional[str] = Field(
        None,
        max_length=255,
        description="Manufacturer name (e.g., 'Siemens', 'ABB', 'Kuka')"
    )
    
    model: Optional[str] = Field(
        None,
        max_length=255,
        description="Model number or designation (e.g., 'CV-2000', 'KR-16')"
    )
    
    serial_number: Optional[str] = Field(
        None,
        max_length=100,
        description="Serial number from manufacturer. Unique identifier for warranty claims"
    )
    
    # Hierarchy management
    functional_location_id: Optional[UUID] = Field(
        None,
        description="Foreign key to functional_locations table. Links asset to WHERE it is installed"
    )
    
    parent_id: Optional[UUID] = Field(
        None,
        description="Foreign key to parent asset (self-reference). Forms component hierarchy"
    )
    
    # Health & performance
    health_score: int = Field(
        100,
        ge=0,
        le=100,
        description="Calculated health score (0-100) based on recent work orders and maintenance history"
    )
    
    # Installation & warranty
    installation_date: Optional[date] = Field(
        None,
        description="Date when asset was installed at current location"
    )
    
    warranty_expiry: Optional[date] = Field(
        None,
        description="Warranty expiration date. System sends alerts when expiring"
    )
    
    # Financial information
    acquisition_cost: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Original purchase/acquisition cost in tenant currency"
    )
    
    # Technical specifications
    specifications: Dict[str, Any] = Field(
        default_factory=dict,
        description="Flexible JSON storage for technical specifications (power rating, capacity, dimensions, etc.)"
    )
    
    # Mobile & documentation
    qr_code: Optional[str] = Field(
        None,
        max_length=100,
        description="QR code string for mobile scanning. Auto-generated on creation or manually assigned"
    )
    
    image_ids: List[str] = Field(
        default_factory=list,
        description="Array of image IDs (stored in MinIO/S3) attached to the asset"
    )
    
    # Flexible settings storage
    settings: Dict[str, Any] = Field(
        default_factory=dict,
        description="Flexible JSON storage for asset-specific configurations"
    )


class AssetCreate(AssetBase):
    """
    Model for creating a new asset.
    
    The asset code is auto-generated by the system (e.g., AST-CV-101),
    so it's not included in the create request.
    The tenant_id and site_id are typically set from the authenticated user's context.
    """
    pass


class AssetUpdate(BaseModel):
    """
    Model for updating an existing asset.
    
    All fields are optional - only provided fields will be updated.
    The asset code and ID cannot be changed after creation.
    """
    
    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=255,
        description="Display name shown throughout the application"
    )
    
    asset_type: Optional[AssetType] = Field(
        None,
        description="Type of asset"
    )
    
    category: Optional[str] = Field(
        None,
        max_length=100,
        description="Asset category for grouping and reporting"
    )
    
    criticality: Optional[AssetCriticality] = Field(
        None,
        description="Criticality level"
    )
    
    status: Optional[AssetStatus] = Field(
        None,
        description="Current operational status"
    )
    
    manufacturer: Optional[str] = Field(
        None,
        max_length=255,
        description="Manufacturer name"
    )
    
    model: Optional[str] = Field(
        None,
        max_length=255,
        description="Model number or designation"
    )
    
    serial_number: Optional[str] = Field(
        None,
        max_length=100,
        description="Serial number from manufacturer"
    )
    
    functional_location_id: Optional[UUID] = Field(
        None,
        description="Foreign key to functional_locations table"
    )
    
    parent_id: Optional[UUID] = Field(
        None,
        description="Foreign key to parent asset (self-reference)"
    )
    
    health_score: Optional[int] = Field(
        None,
        ge=0,
        le=100,
        description="Calculated health score (0-100)"
    )
    
    installation_date: Optional[date] = Field(
        None,
        description="Date when asset was installed at current location"
    )
    
    warranty_expiry: Optional[date] = Field(
        None,
        description="Warranty expiration date"
    )
    
    acquisition_cost: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Original purchase/acquisition cost in tenant currency"
    )
    
    specifications: Optional[Dict[str, Any]] = Field(
        None,
        description="Technical specifications (JSON)"
    )
    
    qr_code: Optional[str] = Field(
        None,
        max_length=100,
        description="QR code string for mobile scanning"
    )
    
    image_ids: Optional[List[str]] = Field(
        None,
        description="Array of image IDs attached to the asset"
    )
    
    settings: Optional[Dict[str, Any]] = Field(
        None,
        description="Asset-specific configurations"
    )


class Asset(AssetBase):
    """
    Full asset model representing a record in the database.
    
    Includes all base fields plus system-managed fields like ID, code,
    tenant_id, site_id, and audit timestamps.
    """
    
    # System-generated identifier (UUID)
    id: UUID = Field(
        ...,
        description="Unique identifier for the asset (UUID)"
    )
    
    # Foreign key to parent tenant
    tenant_id: UUID = Field(
        ...,
        description="Foreign key to the parent tenant for multi-tenant data isolation"
    )
    
    # Foreign key to parent site
    site_id: UUID = Field(
        ...,
        description="Foreign key to the site where this asset is located"
    )
    
    # Human-readable asset code (auto-generated, e.g., AST-CV-101)
    code: str = Field(
        ...,
        max_length=50,
        description="Human-readable asset code for UI and reports"
    )
    
    # Audit timestamps
    created_at: datetime = Field(
        ...,
        description="Timestamp when asset was created"
    )
    
    updated_at: datetime = Field(
        ...,
        description="Timestamp of last modification"
    )
    
    # Audit user references (UUID of the user who performed the action)
    created_by: Optional[UUID] = Field(
        None,
        description="User ID of Site Manager or Tenant Admin who created this asset"
    )
    
    updated_by: Optional[UUID] = Field(
        None,
        description="User ID who last modified this asset record"
    )

    class Config:
        """Pydantic configuration."""
        from_attributes = True  # Enable ORM mode for SQLAlchemy compatibility

