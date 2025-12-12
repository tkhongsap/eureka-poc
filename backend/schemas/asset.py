from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class AssetBase(BaseModel):
    name: str
    type: str  # Site, Line, Facility, Machine, Equipment
    status: str = "Operational"  # Operational, Downtime, Maintenance
    health_score: int = 100
    location: Optional[str] = None
    criticality: str = "Medium"  # Critical, High, Medium, Low
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    serial_number: Optional[str] = None
    install_date: Optional[str] = None
    warranty_expiry: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[str] = None
    # GIS Location
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    # QR Code
    qr_code: Optional[str] = None


class AssetCreate(AssetBase):
    id: Optional[str] = None  # Auto-generate if not provided


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    health_score: Optional[int] = None
    location: Optional[str] = None
    criticality: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    serial_number: Optional[str] = None
    install_date: Optional[str] = None
    warranty_expiry: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    qr_code: Optional[str] = None


class AssetResponse(AssetBase):
    id: str
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    children: List["AssetResponse"] = []

    class Config:
        from_attributes = True


# For tree structure response
class AssetTreeNode(BaseModel):
    id: str
    name: str
    type: str
    status: str
    health_score: int
    location: Optional[str] = None
    criticality: str
    model: Optional[str] = None
    install_date: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    qr_code: Optional[str] = None
    children: List["AssetTreeNode"] = []

    class Config:
        from_attributes = True


# ============ Downtime Schemas ============

class DowntimeBase(BaseModel):
    asset_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    reason: str
    description: Optional[str] = None
    production_loss: Optional[float] = None
    work_order_id: Optional[int] = None


class DowntimeCreate(DowntimeBase):
    reported_by: Optional[str] = None


class DowntimeUpdate(BaseModel):
    end_time: Optional[datetime] = None
    reason: Optional[str] = None
    description: Optional[str] = None
    production_loss: Optional[float] = None
    work_order_id: Optional[int] = None
    resolved_by: Optional[str] = None


class DowntimeResponse(DowntimeBase):
    id: int
    reported_by: Optional[str] = None
    resolved_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    duration_minutes: Optional[int] = None
    is_active: bool = False
    asset_name: Optional[str] = None

    class Config:
        from_attributes = True


# ============ Meter Reading Schemas ============

class MeterReadingBase(BaseModel):
    asset_id: str
    meter_type: str
    value: float
    unit: str
    reading_date: Optional[datetime] = None
    source: Optional[str] = "Manual"
    notes: Optional[str] = None


class MeterReadingCreate(MeterReadingBase):
    recorded_by: Optional[str] = None


class MeterReadingResponse(MeterReadingBase):
    id: int
    previous_value: Optional[float] = None
    recorded_by: Optional[str] = None
    created_at: datetime
    delta: Optional[float] = None
    asset_name: Optional[str] = None

    class Config:
        from_attributes = True


class MeterTypeInfo(BaseModel):
    type: str
    unit: str


# ============ Asset Statistics ============

class AssetStatistics(BaseModel):
    total_assets: int
    by_type: dict
    by_status: dict
    by_criticality: dict
    total_downtime_hours: float
    active_downtimes: int
    avg_health_score: float


# ============ Asset Map Data ============

class AssetMapPoint(BaseModel):
    id: str
    name: str
    type: str
    status: str
    criticality: str
    latitude: float
    longitude: float
    health_score: int


# Update forward references
AssetResponse.model_rebuild()
AssetTreeNode.model_rebuild()
