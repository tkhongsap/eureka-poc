from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_serializer

from .request import LocationData


class WorkOrderCreate(BaseModel):
    title: str
    description: str
    assetName: str
    location: str
    priority: str
    status: str = "Open"
    assignedTo: Optional[str] = None
    dueDate: str
    imageIds: List[str] = []
    requestId: Optional[str] = None
    createdBy: Optional[str] = None  # Name of the requester who created this WO
    locationData: Optional[LocationData] = None
    preferredDate: Optional[str] = None  # Preferred maintenance date from request


class WorkOrder(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: str
    assetName: str = Field(validation_alias="asset_name")
    location: str
    priority: str
    status: str
    assignedTo: Optional[str] = Field(default=None, validation_alias="assigned_to")
    dueDate: Optional[str] = Field(default=None, validation_alias="due_date")
    createdAt: Optional[datetime] = Field(default=None, validation_alias="created_at")
    imageIds: List[str] = Field(default_factory=list, validation_alias="image_ids")
    requestId: Optional[str] = Field(default=None, validation_alias="request_id")
    createdBy: Optional[str] = Field(default=None, validation_alias="created_by")
    technicianNotes: Optional[str] = Field(
        default=None, validation_alias="technician_notes"
    )
    technicianImages: List[str] = Field(
        default_factory=list, validation_alias="technician_images"
    )
    adminReview: Optional[str] = Field(default=None, validation_alias="admin_review")
    locationData: Optional[LocationData] = Field(
        default=None, validation_alias="location_data"
    )
    preferredDate: Optional[str] = Field(
        default=None, validation_alias="preferred_date"
    )
    approvedBy: Optional[str] = Field(default=None, validation_alias="approved_by")
    approvedAt: Optional[datetime] = Field(default=None, validation_alias="approved_at")
    rejectedBy: Optional[str] = Field(default=None, validation_alias="rejected_by")
    rejectedAt: Optional[datetime] = Field(default=None, validation_alias="rejected_at")
    rejectionReason: Optional[str] = Field(
        default=None, validation_alias="rejection_reason"
    )
    closedBy: Optional[str] = Field(default=None, validation_alias="closed_by")
    closedAt: Optional[datetime] = Field(default=None, validation_alias="closed_at")

    @field_serializer("createdAt")
    def serialize_created_at(self, value: Optional[datetime]) -> Optional[str]:
        """Match legacy to_dict() behavior: date-only YYYY-MM-DD."""
        if value is None:
            return None
        return value.strftime("%Y-%m-%d")


class WorkOrderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assetName: Optional[str] = None
    location: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assignedTo: Optional[str] = None
    dueDate: Optional[str] = None
    imageIds: Optional[List[str]] = None
    adminReview: Optional[str] = None
    locationData: Optional[LocationData] = None
    preferredDate: Optional[str] = None  # Preferred maintenance date


class TechnicianUpdate(BaseModel):
    technicianNotes: str
    technicianImages: List[str] = []
    status: str = "Pending"  # Default to Pending when technician submits update
