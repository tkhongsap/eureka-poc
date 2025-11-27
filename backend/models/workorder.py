"""
Work Order Models for Eureka CMMS

This module defines the Pydantic models for work order management. Models support
both the existing API format (camelCase, title case statuses) and the new database
schema (snake_case, lowercase statuses) for backward compatibility.

Models:
    - WorkOrderStatus: Enum for work order status (database format)
    - WorkOrderPriority: Enum for work order priority (database format)
    - WorkOrderType: Enum for work order type (database format)
    - WorkOrderCreate: Model for creating new work orders
    - WorkOrderUpdate: Model for updating existing work orders
    - WorkOrder: Full work order model with all fields
    - TechnicianUpdate: Model for technician work updates
"""

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class WorkOrderStatus(str, Enum):
    """
    Work order status in database format (snake_case).

    Maps to workflow statuses: Open → In Progress → Pending → Completed → Closed
    """

    OPEN = "open"
    IN_PROGRESS = "in_progress"
    PENDING = "pending"
    COMPLETED = "completed"
    CLOSED = "closed"
    CANCELED = "canceled"


class WorkOrderPriority(str, Enum):
    """
    Work order priority level in database format (lowercase).
    """

    EMERGENCY = "emergency"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class WorkOrderType(str, Enum):
    """
    Work order type in database format (snake_case).
    """

    BREAKDOWN = "breakdown"
    PREVENTIVE_MAINTENANCE = "preventive_maintenance"
    CORRECTIVE = "corrective"
    INSPECTION = "inspection"
    SAFETY = "safety"
    OTHER = "other"


# Helper functions to convert between API format and database format
def status_to_db_format(status: str) -> str:
    """Convert API status format (title case with spaces) to DB format (snake_case)."""
    mapping = {
        "Open": "open",
        "In Progress": "in_progress",
        "Pending": "pending",
        "Completed": "completed",
        "Closed": "closed",
        "Canceled": "canceled",
    }
    return mapping.get(status, status.lower().replace(" ", "_"))


def status_to_api_format(status: str) -> str:
    """Convert DB status format (snake_case) to API format (title case with spaces)."""
    mapping = {
        "open": "Open",
        "in_progress": "In Progress",
        "pending": "Pending",
        "completed": "Completed",
        "closed": "Closed",
        "canceled": "Canceled",
    }
    return mapping.get(status, status.replace("_", " ").title())


def priority_to_db_format(priority: str) -> str:
    """Convert API priority format (title case) to DB format (lowercase)."""
    return priority.lower()


def priority_to_api_format(priority: str) -> str:
    """Convert DB priority format (lowercase) to API format (title case)."""
    return priority.title()


class WorkOrderCreate(BaseModel):
    """
    Model for creating a new work order.

    Maintains backward compatibility with existing API while supporting new fields.
    """

    # Required fields (existing)
    title: str = Field(
        ..., description="Brief title summarizing the work to be performed"
    )
    description: str = Field(
        ..., description="Detailed description of the work required"
    )
    assetName: str = Field(..., description="Asset/equipment name (denormalized)")
    location: str = Field(..., description="Human-readable location description")
    priority: str = Field(
        ..., description="Priority level: Emergency, High, Medium, Low"
    )
    dueDate: str = Field(..., description="Target completion date (ISO format)")

    # Optional fields (existing)
    status: str = Field(default="Open", description="Initial status (defaults to Open)")
    assignedTo: Optional[str] = Field(
        default=None, description="Assigned technician ID (UUID)"
    )
    imageIds: List[str] = Field(
        default_factory=list, description="Array of image IDs attached during creation"
    )
    requestId: Optional[str] = Field(
        default=None, description="Original work notification/request ID"
    )

    # New optional fields (database schema)
    tenantId: Optional[str] = Field(default=None, description="Tenant ID (UUID)")
    siteId: Optional[str] = Field(default=None, description="Site ID (UUID)")
    code: Optional[str] = Field(
        default=None, description="Human-readable work order code (e.g., WO-00001)"
    )
    workType: Optional[str] = Field(
        default=None,
        description="Work type: breakdown, preventive_maintenance, corrective, inspection, safety, other",
    )
    assetId: Optional[str] = Field(default=None, description="Asset ID (UUID)")
    functionalLocationId: Optional[str] = Field(
        default=None, description="Functional location ID (UUID)"
    )
    reportedBy: Optional[str] = Field(
        default=None, description="User ID who reported/created the work order (UUID)"
    )
    scheduledStart: Optional[str] = Field(
        default=None, description="Planned start date and time (ISO format)"
    )
    scheduledEnd: Optional[str] = Field(
        default=None, description="Planned end date and time (ISO format)"
    )
    estimatedHours: Optional[float] = Field(
        default=None, description="Estimated labor hours required"
    )
    tags: Optional[List[str]] = Field(
        default=None, description="Array of tags/labels for categorization"
    )
    settings: Optional[Dict[str, Any]] = Field(
        default=None, description="Custom fields and settings (JSON)"
    )

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        """Accept both API format (title case) and DB format (snake_case)."""
        if v:
            # Normalize to API format for backward compatibility
            return status_to_api_format(v)
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        """Accept both API format (title case) and DB format (lowercase)."""
        if v:
            return priority_to_api_format(v)
        return v


class WorkOrder(BaseModel):
    """
    Full work order model with all fields.

    Maintains backward compatibility with existing API while supporting new database fields.
    All new fields are Optional to ensure backward compatibility.
    """

    # Core identification (existing)
    id: str = Field(..., description="Unique identifier (UUID as string)")
    title: str = Field(
        ..., description="Brief title summarizing the work to be performed"
    )
    description: str = Field(
        ..., description="Detailed description of the work required"
    )
    assetName: str = Field(..., description="Asset/equipment name (denormalized)")
    location: str = Field(..., description="Human-readable location description")
    priority: str = Field(
        ..., description="Priority level: Emergency, High, Medium, Low"
    )
    status: str = Field(
        ...,
        description="Current status: Open, In Progress, Pending, Completed, Closed, Canceled",
    )
    assignedTo: Optional[str] = Field(
        default=None, description="Assigned technician ID (UUID)"
    )
    dueDate: str = Field(..., description="Target completion date (ISO format)")
    createdAt: str = Field(..., description="Creation timestamp (ISO format)")

    # Existing optional fields
    imageIds: List[str] = Field(
        default_factory=list, description="Array of image IDs attached during creation"
    )
    requestId: Optional[str] = Field(
        default=None, description="Original work notification/request ID"
    )
    technicianNotes: Optional[str] = Field(
        default=None, description="Notes entered by technician during work"
    )
    technicianImages: List[str] = Field(
        default_factory=list, description="Array of image IDs captured by technician"
    )
    adminReview: Optional[str] = Field(
        default=None, description="Review comments from Admin"
    )

    # New optional fields (database schema) - all Optional for backward compatibility
    code: Optional[str] = Field(
        default=None, description="Human-readable work order code (e.g., WO-00001)"
    )
    tenantId: Optional[str] = Field(default=None, description="Tenant ID (UUID)")
    siteId: Optional[str] = Field(default=None, description="Site ID (UUID)")
    workType: Optional[str] = Field(
        default=None,
        description="Work type: breakdown, preventive_maintenance, corrective, inspection, safety, other",
    )
    assetId: Optional[str] = Field(default=None, description="Asset ID (UUID)")
    functionalLocationId: Optional[str] = Field(
        default=None, description="Functional location ID (UUID)"
    )
    reportedBy: Optional[str] = Field(
        default=None, description="User ID who reported/created the work order (UUID)"
    )

    # Scheduling fields
    scheduledStart: Optional[str] = Field(
        default=None, description="Planned start date and time (ISO format)"
    )
    scheduledEnd: Optional[str] = Field(
        default=None, description="Planned end date and time (ISO format)"
    )
    estimatedHours: Optional[float] = Field(
        default=None, description="Estimated labor hours required"
    )

    # Actual work tracking
    actualStart: Optional[str] = Field(
        default=None, description="Actual start date and time (ISO format)"
    )
    actualEnd: Optional[str] = Field(
        default=None, description="Actual end date and time (ISO format)"
    )
    actualHours: Optional[float] = Field(
        default=None, description="Actual labor hours spent"
    )

    # Cost tracking
    laborCost: Optional[float] = Field(
        default=None, description="Labor cost in tenant currency"
    )
    partsCost: Optional[float] = Field(
        default=None, description="Parts and materials cost in tenant currency"
    )
    totalCost: Optional[float] = Field(
        default=None, description="Total cost of the work order"
    )

    # Failure analysis
    failureCode: Optional[str] = Field(
        default=None, description="Failure code classification"
    )
    rootCause: Optional[str] = Field(
        default=None, description="Root cause analysis description"
    )
    correctiveAction: Optional[str] = Field(
        default=None, description="Corrective action taken"
    )

    # References
    parentWorkOrderId: Optional[str] = Field(
        default=None, description="Parent work order ID for hierarchies (UUID)"
    )
    pmScheduleId: Optional[str] = Field(
        default=None, description="PM schedule ID that generated this work order (UUID)"
    )

    # Metadata
    tags: Optional[List[str]] = Field(
        default=None, description="Array of tags/labels for categorization"
    )
    settings: Optional[Dict[str, Any]] = Field(
        default=None, description="Custom fields and settings (JSON)"
    )

    # Audit trail
    updatedAt: Optional[str] = Field(
        default=None, description="Last modification timestamp (ISO format)"
    )
    createdBy: Optional[str] = Field(
        default=None, description="User ID who created this work order (UUID)"
    )
    updatedBy: Optional[str] = Field(
        default=None, description="User ID who last modified this work order (UUID)"
    )

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        """Accept both API format (title case) and DB format (snake_case)."""
        if v:
            return status_to_api_format(v)
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        """Accept both API format (title case) and DB format (lowercase)."""
        if v:
            return priority_to_api_format(v)
        return v


class WorkOrderUpdate(BaseModel):
    """
    Model for updating an existing work order.

    All fields are optional to allow partial updates.
    Maintains backward compatibility with existing API.
    """

    # Existing fields
    title: Optional[str] = Field(
        default=None, description="Brief title summarizing the work to be performed"
    )
    description: Optional[str] = Field(
        default=None, description="Detailed description of the work required"
    )
    assetName: Optional[str] = Field(
        default=None, description="Asset/equipment name (denormalized)"
    )
    location: Optional[str] = Field(
        default=None, description="Human-readable location description"
    )
    priority: Optional[str] = Field(
        default=None, description="Priority level: Emergency, High, Medium, Low"
    )
    status: Optional[str] = Field(
        default=None,
        description="Current status: Open, In Progress, Pending, Completed, Closed, Canceled",
    )
    assignedTo: Optional[str] = Field(
        default=None, description="Assigned technician ID (UUID)"
    )
    dueDate: Optional[str] = Field(
        default=None, description="Target completion date (ISO format)"
    )
    imageIds: Optional[List[str]] = Field(
        default=None, description="Array of image IDs attached during creation"
    )
    adminReview: Optional[str] = Field(
        default=None, description="Review comments from Admin"
    )

    # New optional fields (database schema)
    code: Optional[str] = Field(
        default=None, description="Human-readable work order code (e.g., WO-00001)"
    )
    workType: Optional[str] = Field(
        default=None,
        description="Work type: breakdown, preventive_maintenance, corrective, inspection, safety, other",
    )
    assetId: Optional[str] = Field(default=None, description="Asset ID (UUID)")
    functionalLocationId: Optional[str] = Field(
        default=None, description="Functional location ID (UUID)"
    )
    reportedBy: Optional[str] = Field(
        default=None, description="User ID who reported/created the work order (UUID)"
    )
    scheduledStart: Optional[str] = Field(
        default=None, description="Planned start date and time (ISO format)"
    )
    scheduledEnd: Optional[str] = Field(
        default=None, description="Planned end date and time (ISO format)"
    )
    estimatedHours: Optional[float] = Field(
        default=None, description="Estimated labor hours required"
    )
    actualStart: Optional[str] = Field(
        default=None, description="Actual start date and time (ISO format)"
    )
    actualEnd: Optional[str] = Field(
        default=None, description="Actual end date and time (ISO format)"
    )
    actualHours: Optional[float] = Field(
        default=None, description="Actual labor hours spent"
    )
    laborCost: Optional[float] = Field(
        default=None, description="Labor cost in tenant currency"
    )
    partsCost: Optional[float] = Field(
        default=None, description="Parts and materials cost in tenant currency"
    )
    totalCost: Optional[float] = Field(
        default=None, description="Total cost of the work order"
    )
    failureCode: Optional[str] = Field(
        default=None, description="Failure code classification"
    )
    rootCause: Optional[str] = Field(
        default=None, description="Root cause analysis description"
    )
    correctiveAction: Optional[str] = Field(
        default=None, description="Corrective action taken"
    )
    parentWorkOrderId: Optional[str] = Field(
        default=None, description="Parent work order ID for hierarchies (UUID)"
    )
    pmScheduleId: Optional[str] = Field(
        default=None, description="PM schedule ID that generated this work order (UUID)"
    )
    tags: Optional[List[str]] = Field(
        default=None, description="Array of tags/labels for categorization"
    )
    settings: Optional[Dict[str, Any]] = Field(
        default=None, description="Custom fields and settings (JSON)"
    )

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        """Accept both API format (title case) and DB format (snake_case)."""
        if v:
            return status_to_api_format(v)
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> Optional[str]:
        """Accept both API format (title case) and DB format (lowercase)."""
        if v:
            return priority_to_api_format(v)
        return v


class TechnicianUpdate(BaseModel):
    """
    Model for technician work updates.

    Used when technician marks work as complete and submits notes/images.
    """

    technicianNotes: str = Field(
        ..., description="Notes entered by technician during work completion"
    )
    technicianImages: List[str] = Field(
        default_factory=list, description="Array of image IDs captured by technician"
    )
    status: str = Field(
        default="Pending",
        description="Status after technician update (defaults to Pending)",
    )

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        """Accept both API format (title case) and DB format (snake_case)."""
        if v:
            return status_to_api_format(v)
        return v
