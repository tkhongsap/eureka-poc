"""
Work Notification Models for Eureka CMMS

This module defines the Pydantic models for work notification management in the
multi-site, multi-tenant architecture. Work notifications track maintenance requests
submitted by non-technical staff before they become work orders. Supports QR code
scanning, mobile portal submission, asset/location linking, and conversion to
work orders.

Models:
    - NotificationStatus: Enum for notification status
    - NotificationPriority: Enum for notification priority
    - WorkNotificationBase: Base model with shared fields
    - WorkNotificationCreate: Model for creating new notifications
    - WorkNotificationUpdate: Model for updating existing notifications
    - WorkNotification: Full notification model with all fields
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class NotificationStatus(str, Enum):
    """
    Notification status determines workflow stage and visibility.

    - open: Pending review by Site Manager
    - in_progress: Being evaluated/converted to work order
    - converted: Converted to work order (linked to work_order_id)
    - closed: Resolved without creating work order
    """

    OPEN = "open"
    IN_PROGRESS = "in_progress"
    CONVERTED = "converted"
    CLOSED = "closed"


class NotificationPriority(str, Enum):
    """
    Priority level set by reporter or call center operator.

    - emergency: Critical issue requiring immediate attention
    - high: High priority issue
    - medium: Medium priority issue
    - low: Low priority issue
    """

    EMERGENCY = "emergency"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class WorkNotificationBase(BaseModel):
    """
    Base work notification model with shared fields for create and update operations.
    """

    # Notification identification
    title: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Brief title summarizing the maintenance issue (e.g., 'Leaking pipe in Building A')",
    )

    description: str = Field(
        ...,
        min_length=1,
        description="Detailed description of the problem reported. Used for Site Manager review and work order creation",
    )

    # Asset reference
    asset_id: Optional[UUID] = Field(
        None,
        description="Foreign key to assets table. Links notification to specific equipment if issue is equipment-related",
    )

    functional_location_id: Optional[UUID] = Field(
        None,
        description="Foreign key to functional_locations table. Links notification to location if issue is location-based",
    )

    qr_code: Optional[str] = Field(
        None,
        max_length=255,
        description="QR code value that was scanned to create this notification. Used for tracking QR code usage",
    )

    # Reporter information
    reporter_name: Optional[str] = Field(
        None,
        max_length=255,
        description="Name of the person reporting the issue. Required for external reporters (non-system users)",
    )

    reporter_email: Optional[EmailStr] = Field(
        None,
        description="Email address of the reporter. Used for notifications and follow-up communications",
    )

    reporter_phone: Optional[str] = Field(
        None,
        max_length=50,
        description="Phone number of the reporter. Used for urgent issues and follow-up calls",
    )

    reported_by: Optional[UUID] = Field(
        None,
        description="Foreign key to users table. User ID if notification was submitted by an internal user",
    )

    # Notification details
    priority: NotificationPriority = Field(
        NotificationPriority.MEDIUM,
        description="Priority level set by reporter or call center operator. Used for triage and work order priority assignment",
    )

    image_ids: List[UUID] = Field(
        default_factory=list,
        description="Array of image UUIDs attached to the notification. Images are stored in object storage and referenced by UUID",
    )

    # Resolution tracking
    status: NotificationStatus = Field(
        NotificationStatus.OPEN,
        description="Notification status: open, in_progress, converted, or closed",
    )

    work_order_id: Optional[UUID] = Field(
        None,
        description="Foreign key to work_orders table. Links notification to work order when converted",
    )

    resolution_notes: Optional[str] = Field(
        None,
        description="Notes explaining how notification was resolved if closed without creating work order",
    )

    resolved_at: Optional[datetime] = Field(
        None,
        description="Timestamp when notification was resolved (converted or closed). Used for notification-to-resolution time tracking",
    )

    resolved_by: Optional[UUID] = Field(
        None,
        description="User ID who resolved or converted the notification (Site Manager)",
    )

    @field_validator("asset_id", "functional_location_id")
    @classmethod
    def validate_asset_or_location(cls, v: Optional[UUID], info) -> Optional[UUID]:
        """Ensure at least one asset reference is provided (asset_id or functional_location_id)."""
        if "asset_id" in info.data and "functional_location_id" in info.data:
            asset_id = info.data.get("asset_id")
            functional_location_id = info.data.get("functional_location_id")
            if asset_id is None and functional_location_id is None:
                raise ValueError(
                    "Either asset_id or functional_location_id must be provided"
                )
        return v

    @field_validator("reporter_name", "reported_by")
    @classmethod
    def validate_reporter_info(cls, v: Optional[Any], info) -> Optional[Any]:
        """Ensure reporter information is provided (either reporter_name for external or reported_by for internal users)."""
        if "reporter_name" in info.data and "reported_by" in info.data:
            reporter_name = info.data.get("reporter_name")
            reported_by = info.data.get("reported_by")
            if reporter_name is None and reported_by is None:
                raise ValueError(
                    "Either reporter_name (external) or reported_by (internal user) must be provided"
                )
        return v

    @field_validator("work_order_id")
    @classmethod
    def validate_converted_has_work_order(
        cls, v: Optional[UUID], info
    ) -> Optional[UUID]:
        """Ensure work_order_id is set when status is 'converted'."""
        if "status" in info.data:
            status = info.data.get("status")
            if status == NotificationStatus.CONVERTED and v is None:
                raise ValueError(
                    "work_order_id must be provided when status is 'converted'"
                )
        return v

    @field_validator("work_order_id")
    @classmethod
    def validate_non_converted_no_work_order(
        cls, v: Optional[UUID], info
    ) -> Optional[UUID]:
        """Ensure work_order_id is NULL when status is not 'converted'."""
        if "status" in info.data:
            status = info.data.get("status")
            if status != NotificationStatus.CONVERTED and v is not None:
                raise ValueError(
                    "work_order_id must be NULL when status is not 'converted'"
                )
        return v

    @field_validator("resolved_at", "resolved_by")
    @classmethod
    def validate_resolved_fields(cls, v: Optional[Any], info) -> Optional[Any]:
        """Ensure resolved_at and resolved_by are set when status is 'converted' or 'closed'."""
        if "status" in info.data:
            status = info.data.get("status")
            field_name = info.field_name
            if status in (NotificationStatus.CONVERTED, NotificationStatus.CLOSED):
                resolved_at = info.data.get("resolved_at")
                resolved_by = info.data.get("resolved_by")
                if field_name == "resolved_at" and v is None:
                    raise ValueError(
                        "resolved_at must be provided when status is 'converted' or 'closed'"
                    )
                if field_name == "resolved_by" and v is None:
                    raise ValueError(
                        "resolved_by must be provided when status is 'converted' or 'closed'"
                    )
        return v


class WorkNotificationCreate(WorkNotificationBase):
    """
    Model for creating a new work notification.

    The notification code is auto-generated by the system (e.g., WN-001),
    so it's not included in the create request.
    The tenant_id and site_id are typically set from the authenticated user's context.
    """

    pass


class WorkNotificationUpdate(BaseModel):
    """
    Model for updating an existing work notification.

    All fields are optional - only provided fields will be updated.
    The notification code and ID cannot be changed after creation.
    """

    title: Optional[str] = Field(
        None,
        min_length=1,
        max_length=255,
        description="Brief title summarizing the maintenance issue",
    )

    description: Optional[str] = Field(
        None, min_length=1, description="Detailed description of the problem reported"
    )

    asset_id: Optional[UUID] = Field(None, description="Foreign key to assets table")

    functional_location_id: Optional[UUID] = Field(
        None, description="Foreign key to functional_locations table"
    )

    qr_code: Optional[str] = Field(
        None,
        max_length=255,
        description="QR code value that was scanned to create this notification",
    )

    reporter_name: Optional[str] = Field(
        None, max_length=255, description="Name of the person reporting the issue"
    )

    reporter_email: Optional[EmailStr] = Field(
        None, description="Email address of the reporter"
    )

    reporter_phone: Optional[str] = Field(
        None, max_length=50, description="Phone number of the reporter"
    )

    reported_by: Optional[UUID] = Field(None, description="Foreign key to users table")

    priority: Optional[NotificationPriority] = Field(None, description="Priority level")

    image_ids: Optional[List[UUID]] = Field(
        None, description="Array of image UUIDs attached to the notification"
    )

    status: Optional[NotificationStatus] = Field(
        None, description="Notification status"
    )

    work_order_id: Optional[UUID] = Field(
        None, description="Foreign key to work_orders table"
    )

    resolution_notes: Optional[str] = Field(
        None, description="Notes explaining how notification was resolved"
    )

    resolved_at: Optional[datetime] = Field(
        None, description="Timestamp when notification was resolved"
    )

    resolved_by: Optional[UUID] = Field(
        None, description="User ID who resolved or converted the notification"
    )


class WorkNotification(WorkNotificationBase):
    """
    Full work notification model representing a record in the database.

    Includes all base fields plus system-managed fields like ID, code,
    tenant_id, site_id, and audit timestamps.
    """

    # System-generated identifier (UUID)
    id: UUID = Field(
        ..., description="Unique identifier for the work notification (UUID)"
    )

    # Foreign key to parent tenant
    tenant_id: UUID = Field(
        ...,
        description="Foreign key to the parent tenant for multi-tenant data isolation",
    )

    # Foreign key to parent site
    site_id: UUID = Field(
        ..., description="Foreign key to the site where this notification was submitted"
    )

    # Human-readable notification code (auto-generated, e.g., WN-001)
    code: str = Field(
        ...,
        max_length=50,
        description="Human-readable notification code for UI and reports",
    )

    # Audit timestamps
    created_at: datetime = Field(
        ..., description="Timestamp when notification was created"
    )

    updated_at: datetime = Field(..., description="Timestamp of last modification")

    # Audit user references (UUID of the user who performed the action)
    created_by: Optional[UUID] = Field(
        None,
        description="User ID who created this notification (if internal user) or NULL for external reporters",
    )

    updated_by: Optional[UUID] = Field(
        None, description="User ID who last modified this notification record"
    )

    class Config:
        """Pydantic configuration."""

        from_attributes = True  # Enable ORM mode for SQLAlchemy compatibility
