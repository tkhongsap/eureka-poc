from pydantic import BaseModel
from typing import List, Optional
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
    locationData: Optional[LocationData] = None
    preferredDate: Optional[str] = None  # Preferred maintenance date from request


class WorkOrder(BaseModel):
    id: str
    title: str
    description: str
    assetName: str
    location: str
    priority: str
    status: str
    assignedTo: Optional[str] = None
    dueDate: str
    createdAt: str
    imageIds: List[str] = []
    requestId: Optional[str] = None
    technicianNotes: Optional[str] = None
    technicianImages: List[str] = []
    adminReview: Optional[str] = None
    locationData: Optional[LocationData] = None
    preferredDate: Optional[str] = None  # Preferred maintenance date from request


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
