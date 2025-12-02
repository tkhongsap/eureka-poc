from pydantic import BaseModel
from typing import List, Optional


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
    preferredDate: Optional[str] = None  # Preferred date for maintenance visit (YYYY-MM-DD)


class RequestItem(BaseModel):
    id: str
    location: str
    priority: str
    description: str
    status: str
    createdAt: str
    imageIds: List[str] = []
    assignedTo: Optional[str] = None
    createdBy: Optional[str] = None
    locationData: Optional[LocationData] = None  # GPS location data
    preferredDate: Optional[str] = None  # Preferred date for maintenance visit


class RequestUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    description: Optional[str] = None
    assignedTo: Optional[str] = None
    locationData: Optional[LocationData] = None
    preferredDate: Optional[str] = None  # Preferred date for maintenance visit
