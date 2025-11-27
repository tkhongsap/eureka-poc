"""
Inventory Part Models for Eureka CMMS

This module defines the Pydantic models for inventory part management in the
multi-site, multi-tenant architecture. Inventory parts represent spare parts,
consumables, tools, and raw materials stored in warehouses with stock level
tracking, reorder point management, and supplier information.

Models:
    - PartType: Enum for part type classification
    - PartStatus: Enum for part status
    - InventoryPartBase: Base model with shared fields
    - InventoryPartCreate: Model for creating new inventory parts
    - InventoryPartUpdate: Model for updating existing inventory parts
    - InventoryPart: Full inventory part model with all fields
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class PartType(str, Enum):
    """
    Type of part determines its role and available workflows.

    - spare_part: Replacement parts for equipment maintenance
    - consumable: Items consumed during operations (lubricants, filters)
    - tool: Tools and instruments used for maintenance
    - raw_material: Raw materials for manufacturing or repair
    """

    SPARE_PART = "spare_part"
    CONSUMABLE = "consumable"
    TOOL = "tool"
    RAW_MATERIAL = "raw_material"


class PartStatus(str, Enum):
    """
    Part status determines availability and visibility.

    - active: Part is available for use and appears in parts catalog
    - discontinued: Part is no longer available from supplier but may still
                   be in stock (historical data preserved)
    - obsolete: Part is obsolete and should not be used (replacement parts
               should be identified)
    """

    ACTIVE = "active"
    DISCONTINUED = "discontinued"
    OBSOLETE = "obsolete"


class InventoryPartBase(BaseModel):
    """
    Base inventory part model with shared fields for create and update operations.
    """

    # Part identification
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Display name shown throughout the application (e.g., 'Ball Bearing 6205-2RS')",
    )

    description: Optional[str] = Field(
        None,
        description="Detailed description of the part, its specifications, and usage notes",
    )

    # Part classification
    category: Optional[str] = Field(
        None,
        max_length=100,
        description="Part category for grouping and reporting (e.g., 'Bearings', 'Motors')",
    )

    part_type: PartType = Field(
        PartType.SPARE_PART,
        description="Type of part: spare_part, consumable, tool, or raw_material",
    )

    unit_of_measure: str = Field(
        "pcs",
        max_length=20,
        description="Unit of measure for quantity tracking (e.g., 'pcs', 'kg', 'L')",
    )

    # Stock management
    quantity_on_hand: int = Field(
        0, ge=0, description="Current physical stock quantity on hand"
    )

    quantity_reserved: int = Field(
        0,
        ge=0,
        description="Quantity reserved for specific work orders (pending issuance)",
    )

    reorder_point: int = Field(
        0,
        ge=0,
        description="Reorder Point (ROP) threshold. System generates alerts when stock falls below this",
    )

    reorder_quantity: int = Field(
        0,
        ge=0,
        description="Recommended order quantity when stock falls below reorder_point",
    )

    minimum_stock: int = Field(
        0,
        ge=0,
        description="Minimum safety stock level. System alerts when stock falls below this critical threshold",
    )

    maximum_stock: Optional[int] = Field(
        None,
        ge=0,
        description="Maximum storage capacity for this part. Used for inventory optimization",
    )

    # Location tracking
    warehouse: Optional[str] = Field(
        None,
        max_length=100,
        description="Warehouse name where this part is stored. Supports multi-warehouse inventory management",
    )

    bin_location: Optional[str] = Field(
        None,
        max_length=50,
        description="Bin or shelf location within the warehouse (e.g., 'A-12-3')",
    )

    # Financial information
    unit_cost: Decimal = Field(
        0,
        ge=0,
        description="Current unit cost in tenant currency. Used for cost calculations when parts are issued",
    )

    average_cost: Decimal = Field(
        0,
        ge=0,
        description="Weighted average cost calculated from all stock receipts. Used for inventory valuation",
    )

    currency: Optional[str] = Field(
        None,
        min_length=3,
        max_length=3,
        description="ISO 4217 currency code for cost calculations. Inherits from site currency if not specified",
    )

    # Supplier information
    supplier_id: Optional[UUID] = Field(
        None,
        description="Foreign key to suppliers table. Links part to primary supplier",
    )

    supplier_part_number: Optional[str] = Field(
        None,
        max_length=100,
        description="Supplier's part number for this item. Used for purchase order creation",
    )

    lead_time_days: Optional[int] = Field(
        None,
        ge=0,
        description="Lead time in days from order placement to receipt. Used for reorder planning",
    )

    # Technical specifications
    barcode: Optional[str] = Field(
        None,
        max_length=100,
        description="Barcode string for barcode scanning. Used for quick part identification",
    )

    qr_code: Optional[str] = Field(
        None,
        max_length=100,
        description="QR code string for mobile scanning. Auto-generated on creation or manually assigned",
    )

    specifications: Dict[str, Any] = Field(
        default_factory=dict,
        description="Flexible JSON storage for technical specifications (dimensions, weight, material, etc.)",
    )

    image_ids: List[str] = Field(
        default_factory=list,
        description="Array of image IDs (stored in MinIO/S3) attached to the part",
    )

    # Flexible settings storage
    settings: Dict[str, Any] = Field(
        default_factory=dict,
        description="Flexible JSON storage for part-specific configurations",
    )

    @field_validator("maximum_stock")
    @classmethod
    def validate_maximum_stock(cls, v: Optional[int], info) -> Optional[int]:
        """Ensure maximum_stock is greater than minimum_stock if both are provided."""
        if v is not None and "minimum_stock" in info.data:
            minimum = info.data.get("minimum_stock", 0)
            if minimum > 0 and v < minimum:
                raise ValueError(
                    "maximum_stock must be greater than or equal to minimum_stock"
                )
        return v

    @field_validator("reorder_point")
    @classmethod
    def validate_reorder_point(cls, v: int, info) -> int:
        """Ensure reorder_point is less than or equal to minimum_stock (logical ordering)."""
        if "minimum_stock" in info.data:
            minimum = info.data.get("minimum_stock", 0)
            if minimum > 0 and v > minimum:
                raise ValueError(
                    "reorder_point should be less than or equal to minimum_stock"
                )
        return v


class InventoryPartCreate(InventoryPartBase):
    """
    Model for creating a new inventory part.

    The part code is auto-generated by the system (e.g., PART-12345),
    so it's not included in the create request.
    The tenant_id and site_id are typically set from the authenticated user's context.
    """

    pass


class InventoryPartUpdate(BaseModel):
    """
    Model for updating an existing inventory part.

    All fields are optional - only provided fields will be updated.
    The part code and ID cannot be changed after creation.
    """

    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=255,
        description="Display name shown throughout the application",
    )

    description: Optional[str] = Field(
        None, description="Detailed description of the part"
    )

    category: Optional[str] = Field(
        None, max_length=100, description="Part category for grouping and reporting"
    )

    part_type: Optional[PartType] = Field(None, description="Type of part")

    unit_of_measure: Optional[str] = Field(
        None, max_length=20, description="Unit of measure for quantity tracking"
    )

    quantity_on_hand: Optional[int] = Field(
        None, ge=0, description="Current physical stock quantity on hand"
    )

    quantity_reserved: Optional[int] = Field(
        None, ge=0, description="Quantity reserved for specific work orders"
    )

    reorder_point: Optional[int] = Field(
        None, ge=0, description="Reorder Point (ROP) threshold"
    )

    reorder_quantity: Optional[int] = Field(
        None,
        ge=0,
        description="Recommended order quantity when stock falls below reorder_point",
    )

    minimum_stock: Optional[int] = Field(
        None, ge=0, description="Minimum safety stock level"
    )

    maximum_stock: Optional[int] = Field(
        None, ge=0, description="Maximum storage capacity for this part"
    )

    warehouse: Optional[str] = Field(
        None, max_length=100, description="Warehouse name where this part is stored"
    )

    bin_location: Optional[str] = Field(
        None, max_length=50, description="Bin or shelf location within the warehouse"
    )

    unit_cost: Optional[Decimal] = Field(
        None, ge=0, description="Current unit cost in tenant currency"
    )

    average_cost: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Weighted average cost calculated from all stock receipts",
    )

    currency: Optional[str] = Field(
        None,
        min_length=3,
        max_length=3,
        description="ISO 4217 currency code for cost calculations",
    )

    supplier_id: Optional[UUID] = Field(
        None, description="Foreign key to suppliers table"
    )

    supplier_part_number: Optional[str] = Field(
        None, max_length=100, description="Supplier's part number for this item"
    )

    lead_time_days: Optional[int] = Field(
        None, ge=0, description="Lead time in days from order placement to receipt"
    )

    barcode: Optional[str] = Field(
        None, max_length=100, description="Barcode string for barcode scanning"
    )

    qr_code: Optional[str] = Field(
        None, max_length=100, description="QR code string for mobile scanning"
    )

    specifications: Optional[Dict[str, Any]] = Field(
        None, description="Technical specifications (JSON)"
    )

    image_ids: Optional[List[str]] = Field(
        None, description="Array of image IDs attached to the part"
    )

    status: Optional[PartStatus] = Field(
        None, description="Part status determines availability and visibility"
    )

    settings: Optional[Dict[str, Any]] = Field(
        None, description="Part-specific configurations"
    )


class InventoryPart(InventoryPartBase):
    """
    Full inventory part model representing a record in the database.

    Includes all base fields plus system-managed fields like ID, code,
    tenant_id, site_id, quantity_available, status, and audit timestamps.
    """

    # System-generated identifier (UUID)
    id: UUID = Field(..., description="Unique identifier for the inventory part (UUID)")

    # Foreign key to parent tenant
    tenant_id: UUID = Field(
        ...,
        description="Foreign key to the parent tenant for multi-tenant data isolation",
    )

    # Foreign key to parent site
    site_id: UUID = Field(
        ..., description="Foreign key to the site where this part is stored"
    )

    # Human-readable part code (auto-generated, e.g., PART-12345)
    code: str = Field(
        ..., max_length=50, description="Human-readable part code for UI and reports"
    )

    # Calculated available quantity (quantity_on_hand - quantity_reserved)
    quantity_available: int = Field(
        0,
        ge=0,
        description="Calculated available quantity. Updated automatically via database trigger",
    )

    # Part status
    status: PartStatus = Field(
        PartStatus.ACTIVE, description="Part status: active, discontinued, or obsolete"
    )

    # Audit timestamps
    created_at: datetime = Field(..., description="Timestamp when part was created")

    updated_at: datetime = Field(..., description="Timestamp of last modification")

    # Audit user references (UUID of the user who performed the action)
    created_by: Optional[UUID] = Field(
        None,
        description="User ID of Site Store Manager or Tenant Admin who created this part",
    )

    updated_by: Optional[UUID] = Field(
        None, description="User ID who last modified this part record"
    )

    class Config:
        """Pydantic configuration."""

        from_attributes = True  # Enable ORM mode for SQLAlchemy compatibility
