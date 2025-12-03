from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class LocationData(BaseModel):
    latitude: float
    longitude: float
    address: str
    googleMapsUrl: str


class RequestCreate(BaseModel):
    location: str
    priority: str
    description: str
    imageIds: List[str] = []
    assignedTo: Optional[str] = None  # Technician assigned to this request
    createdBy: Optional[str] = None  # User who created this request
    locationData: Optional[LocationData] = None  # GPS location data
    preferredDate: Optional[str] = (
        None  # Preferred date for maintenance visit (YYYY-MM-DD)
    )


class RequestItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    location: str
    priority: str
    description: str
    status: str
    createdAt: datetime = Field(validation_alias="created_at")
    imageIds: List[str] = Field(default_factory=list, validation_alias="image_ids")
    assignedTo: Optional[str] = Field(default=None, validation_alias="assigned_to")
    createdBy: Optional[str] = Field(default=None, validation_alias="created_by")
    locationData: Optional[LocationData] = Field(
        default=None, validation_alias="location_data"
    )
    preferredDate: Optional[str] = Field(
        default=None, validation_alias="preferred_date"
    )


class RequestUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    description: Optional[str] = None
    assignedTo: Optional[str] = None
    locationData: Optional[LocationData] = None
    preferredDate: Optional[str] = None  # Preferred date for maintenance visit
