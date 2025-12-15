from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import uuid
from datetime import datetime

from db.session import get_db
from db.models.asset import Asset
from db.models.asset_downtime import AssetDowntime, DOWNTIME_REASONS
from db.models.meter_reading import MeterReading, METER_TYPES
from schemas.asset import (
    AssetCreate, AssetUpdate, AssetResponse, AssetTreeNode,
    DowntimeCreate, DowntimeUpdate, DowntimeResponse,
    MeterReadingCreate, MeterReadingResponse, MeterTypeInfo,
    AssetStatistics, AssetMapPoint
)

router = APIRouter(prefix="/api/assets", tags=["assets"])


def generate_asset_id(asset_type: str) -> str:
    """Generate unique asset ID based on type"""
    prefix_map = {
        "Site": "SITE",
        "Line": "LINE",
        "Facility": "FAC",
        "Machine": "MCH",
        "Equipment": "EQP",
    }
    prefix = prefix_map.get(asset_type, "AST")
    unique_part = uuid.uuid4().hex[:6].upper()
    return f"{prefix}-{unique_part}"


def build_asset_tree(assets: List[Asset], parent_id: Optional[str] = None) -> List[dict]:
    """Build hierarchical tree structure from flat asset list"""
    tree = []
    for asset in assets:
        if asset.parent_id == parent_id:
            children = build_asset_tree(assets, asset.id)
            node = {
                "id": asset.id,
                "name": asset.name,
                "type": asset.type,
                "status": asset.status,
                "healthScore": asset.health_score,
                "location": asset.location,
                "criticality": asset.criticality,
                "model": asset.model,
                "installDate": asset.install_date,
                "children": children,
            }
            tree.append(node)
    return tree


@router.get("", response_model=List[AssetResponse])
def get_assets(
    type: Optional[str] = Query(None, description="Filter by asset type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    criticality: Optional[str] = Query(None, description="Filter by criticality"),
    parent_id: Optional[str] = Query(None, description="Filter by parent ID"),
    search: Optional[str] = Query(None, description="Search in name, location, model"),
    db: Session = Depends(get_db),
):
    """Get all assets with optional filters"""
    query = db.query(Asset)

    if type:
        query = query.filter(Asset.type == type)
    if status:
        query = query.filter(Asset.status == status)
    if criticality:
        query = query.filter(Asset.criticality == criticality)
    if parent_id:
        query = query.filter(Asset.parent_id == parent_id)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Asset.name.ilike(search_term))
            | (Asset.location.ilike(search_term))
            | (Asset.model.ilike(search_term))
            | (Asset.id.ilike(search_term))
        )

    assets = query.order_by(Asset.name).all()

    # Convert to response format
    result = []
    for asset in assets:
        result.append(
            {
                "id": asset.id,
                "name": asset.name,
                "type": asset.type,
                "status": asset.status,
                "health_score": asset.health_score,
                "location": asset.location,
                "criticality": asset.criticality,
                "model": asset.model,
                "manufacturer": asset.manufacturer,
                "serial_number": asset.serial_number,
                "install_date": asset.install_date,
                "warranty_expiry": asset.warranty_expiry,
                "description": asset.description,
                "parent_id": asset.parent_id,
                "created_by": asset.created_by,
                "updated_by": asset.updated_by,
                "created_at": asset.created_at,
                "updated_at": asset.updated_at,
                "children": [],
            }
        )

    return result


@router.get("/tree")
def get_asset_tree(db: Session = Depends(get_db)):
    """Get assets as hierarchical tree structure"""
    assets = db.query(Asset).all()
    tree = build_asset_tree(assets, None)
    return tree


# ============ DOWNTIME ENDPOINTS ============
# NOTE: These must be defined BEFORE /{asset_id} route to avoid path matching issues

@router.get("/downtimes/reasons")
def get_downtime_reasons():
    """Get list of available downtime reasons"""
    return {"reasons": DOWNTIME_REASONS}


@router.get("/downtimes")
def get_downtimes(
    asset_id: Optional[str] = Query(None, description="Filter by asset ID"),
    active_only: bool = Query(False, description="Only show active (ongoing) downtimes"),
    limit: int = Query(100, description="Maximum records to return"),
    db: Session = Depends(get_db),
):
    """Get downtime records with optional filters"""
    query = db.query(AssetDowntime).outerjoin(Asset)
    
    if asset_id:
        query = query.filter(AssetDowntime.asset_id == asset_id)
    
    if active_only:
        query = query.filter(AssetDowntime.end_time.is_(None))
    
    downtimes = query.order_by(AssetDowntime.start_time.desc()).limit(limit).all()
    
    result = []
    for dt in downtimes:
        result.append({
            "id": dt.id,
            "asset_id": dt.asset_id,
            "start_time": dt.start_time,
            "end_time": dt.end_time,
            "reason": dt.reason,
            "description": dt.description,
            "production_loss": dt.production_loss,
            "work_order_id": dt.work_order_id,
            "reported_by": dt.reported_by,
            "resolved_by": dt.resolved_by,
            "created_at": dt.created_at,
            "updated_at": dt.updated_at,
            "duration_minutes": dt.duration_minutes,
            "is_active": dt.is_active,
            "asset_name": dt.asset.name if dt.asset else None,
        })
    
    return result


@router.post("/downtimes")
def create_downtime(
    downtime_data: DowntimeCreate,
    db: Session = Depends(get_db),
):
    """Record new downtime event"""
    downtime = AssetDowntime(
        asset_id=downtime_data.asset_id,
        start_time=downtime_data.start_time,
        end_time=downtime_data.end_time,
        reason=downtime_data.reason,
        description=downtime_data.description,
        production_loss=downtime_data.production_loss,
        work_order_id=downtime_data.work_order_id,
        reported_by=downtime_data.reported_by,
    )
    
    db.add(downtime)
    db.commit()
    db.refresh(downtime)
    
    return {
        "id": downtime.id,
        "asset_id": downtime.asset_id,
        "start_time": downtime.start_time,
        "end_time": downtime.end_time,
        "reason": downtime.reason,
        "description": downtime.description,
        "production_loss": downtime.production_loss,
        "work_order_id": downtime.work_order_id,
        "reported_by": downtime.reported_by,
        "resolved_by": downtime.resolved_by,
        "created_at": downtime.created_at,
        "updated_at": downtime.updated_at,
        "duration_minutes": downtime.duration_minutes,
        "is_active": downtime.is_active,
        "asset_name": None,
    }


@router.put("/downtimes/{downtime_id}")
def update_downtime(
    downtime_id: int,
    downtime_data: DowntimeUpdate,
    db: Session = Depends(get_db),
):
    """Update downtime record (e.g., to close it by setting end_time)"""
    downtime = db.query(AssetDowntime).filter(AssetDowntime.id == downtime_id).first()
    if not downtime:
        raise HTTPException(status_code=404, detail="Downtime record not found")
    
    update_data = downtime_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(downtime, field, value)
    
    db.commit()
    db.refresh(downtime)
    
    return {
        "id": downtime.id,
        "asset_id": downtime.asset_id,
        "start_time": downtime.start_time,
        "end_time": downtime.end_time,
        "reason": downtime.reason,
        "description": downtime.description,
        "production_loss": downtime.production_loss,
        "work_order_id": downtime.work_order_id,
        "reported_by": downtime.reported_by,
        "resolved_by": downtime.resolved_by,
        "created_at": downtime.created_at,
        "updated_at": downtime.updated_at,
        "duration_minutes": downtime.duration_minutes,
        "is_active": downtime.is_active,
        "asset_name": downtime.asset.name if downtime.asset else None,
    }


@router.delete("/downtimes/{downtime_id}")
def delete_downtime(downtime_id: int, db: Session = Depends(get_db)):
    """Delete downtime record"""
    downtime = db.query(AssetDowntime).filter(AssetDowntime.id == downtime_id).first()
    if not downtime:
        raise HTTPException(status_code=404, detail="Downtime record not found")
    
    db.delete(downtime)
    db.commit()
    
    return {"message": "Downtime record deleted", "id": downtime_id}


# ============ METER READING ENDPOINTS ============
# NOTE: These must be defined BEFORE /{asset_id} route to avoid path matching issues

@router.get("/meters/types")
def get_meter_types():
    """Get list of available meter types with default units"""
    return {"types": METER_TYPES}


@router.get("/meters")
def get_meter_readings(
    asset_id: Optional[str] = Query(None, description="Filter by asset ID"),
    meter_type: Optional[str] = Query(None, description="Filter by meter type"),
    limit: int = Query(100, description="Maximum records to return"),
    db: Session = Depends(get_db),
):
    """Get meter readings with optional filters"""
    query = db.query(MeterReading).outerjoin(Asset)
    
    if asset_id:
        query = query.filter(MeterReading.asset_id == asset_id)
    if meter_type:
        query = query.filter(MeterReading.meter_type == meter_type)
    
    readings = query.order_by(MeterReading.reading_date.desc()).limit(limit).all()
    
    result = []
    for reading in readings:
        result.append({
            "id": reading.id,
            "asset_id": reading.asset_id,
            "meter_type": reading.meter_type,
            "value": reading.value,
            "unit": reading.unit,
            "previous_value": reading.previous_value,
            "reading_date": reading.reading_date,
            "source": reading.source,
            "notes": reading.notes,
            "recorded_by": reading.recorded_by,
            "created_at": reading.created_at,
            "delta": reading.delta,
            "asset_name": reading.asset.name if reading.asset else None,
        })
    
    return result


@router.post("/meters")
def create_meter_reading(
    reading_data: MeterReadingCreate,
    db: Session = Depends(get_db),
):
    """Record new meter reading"""
    # Get previous reading to calculate delta
    previous = db.query(MeterReading).filter(
        MeterReading.asset_id == reading_data.asset_id,
        MeterReading.meter_type == reading_data.meter_type
    ).order_by(MeterReading.reading_date.desc()).first()
    
    reading = MeterReading(
        asset_id=reading_data.asset_id,
        meter_type=reading_data.meter_type,
        value=reading_data.value,
        unit=reading_data.unit,
        previous_value=previous.value if previous else None,
        reading_date=reading_data.reading_date or datetime.utcnow(),
        source=reading_data.source,
        notes=reading_data.notes,
        recorded_by=reading_data.recorded_by,
    )
    
    db.add(reading)
    db.commit()
    db.refresh(reading)
    
    return {
        "id": reading.id,
        "asset_id": reading.asset_id,
        "meter_type": reading.meter_type,
        "value": reading.value,
        "unit": reading.unit,
        "previous_value": reading.previous_value,
        "reading_date": reading.reading_date,
        "source": reading.source,
        "notes": reading.notes,
        "recorded_by": reading.recorded_by,
        "created_at": reading.created_at,
        "delta": reading.delta,
        "asset_name": None,
    }


@router.delete("/meters/{reading_id}")
def delete_meter_reading(reading_id: int, db: Session = Depends(get_db)):
    """Delete meter reading record"""
    reading = db.query(MeterReading).filter(MeterReading.id == reading_id).first()
    if not reading:
        raise HTTPException(status_code=404, detail="Meter reading not found")
    
    db.delete(reading)
    db.commit()
    
    return {"message": "Meter reading deleted", "id": reading_id}


# ============ STATISTICS ============

@router.get("/statistics/summary")
def get_asset_statistics(db: Session = Depends(get_db)):
    """Get asset statistics summary"""
    total = db.query(Asset).count()
    operational = db.query(Asset).filter(Asset.status == "Operational").count()
    maintenance = db.query(Asset).filter(Asset.status == "Maintenance").count()
    downtime_count = db.query(Asset).filter(Asset.status == "Downtime").count()
    
    active_downtimes = db.query(AssetDowntime).filter(AssetDowntime.end_time.is_(None)).count()
    
    # Calculate total downtime hours
    completed_downtimes = db.query(AssetDowntime).filter(AssetDowntime.end_time.isnot(None)).all()
    total_hours = sum(
        (dt.end_time - dt.start_time).total_seconds() / 3600
        for dt in completed_downtimes
        if dt.start_time and dt.end_time
    )
    
    avg_health = db.query(func.avg(Asset.health_score)).scalar() or 0
    
    return {
        "total_assets": total,
        "operational": operational,
        "maintenance": maintenance,
        "downtime": downtime_count,
        "active_downtimes": active_downtimes,
        "total_downtime_hours": round(total_hours, 1),
        "avg_health_score": round(float(avg_health), 1),
    }


# ============ SINGLE ASSET ENDPOINTS ============
# NOTE: These must be AFTER all specific path routes like /downtimes, /meters, /statistics

@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(asset_id: str, db: Session = Depends(get_db)):
    """Get single asset by ID"""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    return {
        "id": asset.id,
        "name": asset.name,
        "type": asset.type,
        "status": asset.status,
        "health_score": asset.health_score,
        "location": asset.location,
        "criticality": asset.criticality,
        "model": asset.model,
        "manufacturer": asset.manufacturer,
        "serial_number": asset.serial_number,
        "install_date": asset.install_date,
        "warranty_expiry": asset.warranty_expiry,
        "description": asset.description,
        "parent_id": asset.parent_id,
        "created_by": asset.created_by,
        "updated_by": asset.updated_by,
        "created_at": asset.created_at,
        "updated_at": asset.updated_at,
        "children": [],
    }


@router.post("", response_model=AssetResponse)
def create_asset(
    asset_data: AssetCreate,
    created_by: Optional[str] = Query(None, description="User creating the asset"),
    db: Session = Depends(get_db),
):
    """Create new asset (Admin, Head Technician only)"""
    # Generate ID if not provided
    asset_id = asset_data.id if asset_data.id else generate_asset_id(asset_data.type)

    # Check if ID already exists
    existing = db.query(Asset).filter(Asset.id == asset_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Asset ID already exists")

    # Validate parent exists if provided
    if asset_data.parent_id:
        parent = db.query(Asset).filter(Asset.id == asset_data.parent_id).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Parent asset not found")

    asset = Asset(
        id=asset_id,
        name=asset_data.name,
        type=asset_data.type,
        status=asset_data.status,
        health_score=asset_data.health_score,
        location=asset_data.location,
        criticality=asset_data.criticality,
        model=asset_data.model,
        manufacturer=asset_data.manufacturer,
        serial_number=asset_data.serial_number,
        install_date=asset_data.install_date,
        warranty_expiry=asset_data.warranty_expiry,
        description=asset_data.description,
        parent_id=asset_data.parent_id,
        created_by=created_by,
    )

    db.add(asset)
    db.commit()
    db.refresh(asset)

    return {
        "id": asset.id,
        "name": asset.name,
        "type": asset.type,
        "status": asset.status,
        "health_score": asset.health_score,
        "location": asset.location,
        "criticality": asset.criticality,
        "model": asset.model,
        "manufacturer": asset.manufacturer,
        "serial_number": asset.serial_number,
        "install_date": asset.install_date,
        "warranty_expiry": asset.warranty_expiry,
        "description": asset.description,
        "parent_id": asset.parent_id,
        "created_by": asset.created_by,
        "updated_by": asset.updated_by,
        "created_at": asset.created_at,
        "updated_at": asset.updated_at,
        "children": [],
    }


@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: str,
    asset_data: AssetUpdate,
    updated_by: Optional[str] = Query(None, description="User updating the asset"),
    db: Session = Depends(get_db),
):
    """Update asset (Admin, Head Technician only)"""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Validate parent if changing
    if asset_data.parent_id is not None and asset_data.parent_id != asset.parent_id:
        if asset_data.parent_id:
            # Check parent exists
            parent = db.query(Asset).filter(Asset.id == asset_data.parent_id).first()
            if not parent:
                raise HTTPException(status_code=400, detail="Parent asset not found")
            # Prevent circular reference
            if asset_data.parent_id == asset_id:
                raise HTTPException(
                    status_code=400, detail="Asset cannot be its own parent"
                )

    # Update fields
    update_data = asset_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "health_score":
            setattr(asset, "health_score", value)
        elif field == "parent_id":
            setattr(asset, "parent_id", value)
        elif field == "install_date":
            setattr(asset, "install_date", value)
        elif field == "warranty_expiry":
            setattr(asset, "warranty_expiry", value)
        elif field == "serial_number":
            setattr(asset, "serial_number", value)
        else:
            setattr(asset, field, value)

    asset.updated_by = updated_by

    db.commit()
    db.refresh(asset)

    return {
        "id": asset.id,
        "name": asset.name,
        "type": asset.type,
        "status": asset.status,
        "health_score": asset.health_score,
        "location": asset.location,
        "criticality": asset.criticality,
        "model": asset.model,
        "manufacturer": asset.manufacturer,
        "serial_number": asset.serial_number,
        "install_date": asset.install_date,
        "warranty_expiry": asset.warranty_expiry,
        "description": asset.description,
        "parent_id": asset.parent_id,
        "created_by": asset.created_by,
        "updated_by": asset.updated_by,
        "created_at": asset.created_at,
        "updated_at": asset.updated_at,
        "children": [],
    }


@router.delete("/{asset_id}")
def delete_asset(asset_id: str, db: Session = Depends(get_db)):
    """Delete asset (Admin only). Children will become orphans (parent_id = null)"""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Update children to have no parent
    db.query(Asset).filter(Asset.parent_id == asset_id).update({"parent_id": None})

    db.delete(asset)
    db.commit()

    return {"message": "Asset deleted successfully", "id": asset_id}


@router.post("/seed")
def seed_assets(db: Session = Depends(get_db)):
    """Seed initial asset data for demo purposes"""
    # Check if assets already exist
    existing = db.query(Asset).first()
    if existing:
        return {"message": "Assets already seeded", "count": db.query(Asset).count()}

    # Seed data
    assets_data = [
        # Site
        {
            "id": "PLANT-A",
            "name": "Plant A - Main Assembly",
            "type": "Site",
            "status": "Operational",
            "health_score": 92,
            "location": "Bangkok",
            "criticality": "High",
            "parent_id": None,
            "created_by": "System",
        },
        # Production Line 1
        {
            "id": "LINE-1",
            "name": "Production Line 1",
            "type": "Line",
            "status": "Operational",
            "health_score": 88,
            "location": "Hall A",
            "criticality": "High",
            "parent_id": "PLANT-A",
            "created_by": "System",
        },
        # Machines under Line 1
        {
            "id": "CV-101",
            "name": "Main Conveyor Belt",
            "type": "Machine",
            "status": "Maintenance",
            "health_score": 65,
            "location": "Line 1 Start",
            "criticality": "Medium",
            "model": "Siemens CV-2000",
            "install_date": "2021-05-15",
            "parent_id": "LINE-1",
            "created_by": "System",
        },
        {
            "id": "RB-202",
            "name": "Assembly Robot Arm",
            "type": "Machine",
            "status": "Operational",
            "health_score": 98,
            "location": "Line 1 Station 2",
            "criticality": "Critical",
            "model": "Kuka KR-16",
            "install_date": "2022-01-10",
            "parent_id": "LINE-1",
            "created_by": "System",
        },
        # HVAC System
        {
            "id": "FAC-HVAC",
            "name": "HVAC System",
            "type": "Facility",
            "status": "Downtime",
            "health_score": 45,
            "location": "Roof",
            "criticality": "Medium",
            "parent_id": "PLANT-A",
            "created_by": "System",
        },
        # Chiller under HVAC
        {
            "id": "CH-01",
            "name": "Chiller Unit 1",
            "type": "Equipment",
            "status": "Downtime",
            "health_score": 20,
            "location": "Roof West",
            "criticality": "High",
            "model": "Trane CVHE",
            "install_date": "2019-11-20",
            "parent_id": "FAC-HVAC",
            "created_by": "System",
        },
        # Production Line 2
        {
            "id": "LINE-2",
            "name": "Production Line 2",
            "type": "Line",
            "status": "Operational",
            "health_score": 95,
            "location": "Hall B",
            "criticality": "High",
            "parent_id": "PLANT-A",
            "created_by": "System",
        },
        {
            "id": "CNC-301",
            "name": "CNC Milling Machine",
            "type": "Machine",
            "status": "Operational",
            "health_score": 90,
            "location": "Line 2 Station 1",
            "criticality": "High",
            "model": "Haas VF-2",
            "manufacturer": "Haas Automation",
            "install_date": "2020-03-15",
            "parent_id": "LINE-2",
            "created_by": "System",
        },
        {
            "id": "PRESS-302",
            "name": "Hydraulic Press",
            "type": "Machine",
            "status": "Operational",
            "health_score": 85,
            "location": "Line 2 Station 2",
            "criticality": "Medium",
            "model": "Schuler PME-200",
            "manufacturer": "Schuler",
            "install_date": "2019-08-20",
            "parent_id": "LINE-2",
            "created_by": "System",
        },
    ]

    for asset_data in assets_data:
        asset = Asset(**asset_data)
        db.add(asset)

    db.commit()

    return {"message": "Assets seeded successfully", "count": len(assets_data)}


# ============ ASSET MAP ENDPOINTS ============

@router.get("/map", response_model=List[AssetMapPoint])
def get_assets_for_map(
    type: Optional[str] = Query(None, description="Filter by asset type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
):
    """Get assets that have GPS coordinates for map display"""
    query = db.query(Asset).filter(
        Asset.latitude.isnot(None),
        Asset.longitude.isnot(None)
    )
    
    if type:
        query = query.filter(Asset.type == type)
    if status:
        query = query.filter(Asset.status == status)
    
    assets = query.all()
    
    return [
        {
            "id": asset.id,
            "name": asset.name,
            "type": asset.type,
            "status": asset.status,
            "criticality": asset.criticality,
            "latitude": asset.latitude,
            "longitude": asset.longitude,
            "health_score": asset.health_score,
        }
        for asset in assets
    ]


@router.put("/{asset_id}/location")
def update_asset_location(
    asset_id: str,
    latitude: float = Query(..., description="GPS latitude"),
    longitude: float = Query(..., description="GPS longitude"),
    db: Session = Depends(get_db),
):
    """Update asset GPS coordinates"""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    asset.latitude = latitude
    asset.longitude = longitude
    db.commit()
    
    return {"message": "Location updated", "id": asset_id, "latitude": latitude, "longitude": longitude}


# ============ QR CODE ENDPOINTS ============

@router.get("/{asset_id}/qr")
def get_asset_qr(asset_id: str, db: Session = Depends(get_db)):
    """Get or generate QR code data for asset"""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Generate QR code data URL if not exists
    if not asset.qr_code:
        asset.qr_code = f"eureka://asset/{asset_id}"
        db.commit()
    
    return {
        "asset_id": asset_id,
        "qr_data": asset.qr_code,
        "asset_name": asset.name,
        "asset_type": asset.type,
    }


@router.get("/lookup/qr/{qr_data:path}")
def lookup_by_qr(qr_data: str, db: Session = Depends(get_db)):
    """Lookup asset by QR code data"""
    # Try to find by qr_code field
    asset = db.query(Asset).filter(Asset.qr_code == qr_data).first()
    
    # Try to extract asset ID from eureka:// URL
    if not asset and qr_data.startswith("eureka://asset/"):
        asset_id = qr_data.replace("eureka://asset/", "")
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
    
    # Try direct ID lookup
    if not asset:
        asset = db.query(Asset).filter(Asset.id == qr_data).first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found for QR code")
    
    return {
        "id": asset.id,
        "name": asset.name,
        "type": asset.type,
        "status": asset.status,
        "health_score": asset.health_score,
        "location": asset.location,
        "criticality": asset.criticality,
        "model": asset.model,
        "manufacturer": asset.manufacturer,
        "serial_number": asset.serial_number,
    }


# ============ SEED WITH GIS DATA ============

@router.post("/seed-with-gis")
def seed_assets_with_gis(db: Session = Depends(get_db)):
    """Seed assets with GPS coordinates for map demo"""
    # Update existing assets with GPS coordinates (Bangkok area)
    updates = [
        ("PLANT-A", 13.7563, 100.5018),  # Bangkok center
        ("LINE-1", 13.7570, 100.5025),
        ("LINE-2", 13.7555, 100.5010),
        ("CV-101", 13.7572, 100.5028),
        ("RB-202", 13.7568, 100.5022),
        ("FAC-HVAC", 13.7580, 100.5000),
        ("CH-01", 13.7582, 100.4998),
        ("CNC-301", 13.7552, 100.5008),
        ("PRESS-302", 13.7550, 100.5012),
    ]
    
    updated = 0
    for asset_id, lat, lng in updates:
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
        if asset:
            asset.latitude = lat
            asset.longitude = lng
            asset.qr_code = f"eureka://asset/{asset_id}"
            updated += 1
    
    db.commit()
    
    return {"message": f"Updated {updated} assets with GPS coordinates"}
