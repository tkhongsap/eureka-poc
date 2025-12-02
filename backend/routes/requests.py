from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from models import RequestCreate, RequestItem, RequestUpdate, WorkOrderCreate, WorkOrder
from database import get_db
from db_models import Request as RequestModel
from utils import generate_id, get_current_datetime

router = APIRouter(prefix="/api/requests", tags=["Requests"])


@router.post("", response_model=RequestItem)
async def create_request(request: RequestCreate, db: Session = Depends(get_db)):
    """Create a new maintenance request"""
    request_id = generate_id("REQ")
    
    new_request = RequestModel(
        id=request_id,
        location=request.location,
        priority=request.priority,
        description=request.description,
        status="Open",
        image_ids=request.imageIds,
        assigned_to=request.assignedTo,
        created_by=request.createdBy,
        location_data=request.locationData.dict() if request.locationData else None,
        preferred_date=request.preferredDate
    )
    
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    
    return new_request.to_dict()


@router.get("", response_model=List[RequestItem])
async def list_requests(db: Session = Depends(get_db)):
    """List all requests"""
    requests = db.query(RequestModel).order_by(RequestModel.created_at.desc()).all()
    return [r.to_dict() for r in requests]


@router.get("/{request_id}", response_model=RequestItem)
async def get_request(request_id: str, db: Session = Depends(get_db)):
    """Get a specific request"""
    request = db.query(RequestModel).filter(RequestModel.id == request_id).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return request.to_dict()


@router.put("/{request_id}", response_model=RequestItem)
async def update_request(request_id: str, updates: RequestUpdate, db: Session = Depends(get_db)):
    """Update request"""
    request = db.query(RequestModel).filter(RequestModel.id == request_id).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if updates.status is not None:
        request.status = updates.status
    if updates.priority is not None:
        request.priority = updates.priority
    if updates.description is not None:
        request.description = updates.description
    if updates.locationData is not None:
        request.location_data = updates.locationData.dict()
    
    db.commit()
    db.refresh(request)
    
    return request.to_dict()


@router.delete("/{request_id}")
async def delete_request(request_id: str, db: Session = Depends(get_db)):
    """Delete a request"""
    request = db.query(RequestModel).filter(RequestModel.id == request_id).first()
    
    if request:
        db.delete(request)
        db.commit()
    
    return {"message": "Request deleted"}


@router.post("/{request_id}/convert", response_model=WorkOrder)
async def convert_request_to_workorder(request_id: str, db: Session = Depends(get_db)):
    """Convert a request to a work order"""
    from routes.workorders import create_workorder_internal
    
    request = db.query(RequestModel).filter(RequestModel.id == request_id).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Calculate dueDate: if preferredDate exists, set dueDate to 1 day after preferredDate
    # Otherwise use current date
    if request.preferred_date:
        preferred = datetime.strptime(request.preferred_date, "%Y-%m-%d")
        due_date = (preferred + timedelta(days=1)).strftime("%Y-%m-%d")
    else:
        due_date = get_current_datetime().split("T")[0]
    
    wo_data = WorkOrderCreate(
        title=f"{request.description[:50]}{'...' if len(request.description) > 50 else ''}",
        description=request.description,
        assetName=request.location,
        location=request.location,
        priority=request.priority,
        dueDate=due_date,
        imageIds=request.image_ids or [],
        requestId=request_id,
        preferredDate=request.preferred_date
    )
    
    new_wo = await create_workorder_internal(wo_data, db)
    
    request.status = "Converted to WO"
    db.commit()
    
    return new_wo
