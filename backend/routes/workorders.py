from fastapi import APIRouter, HTTPException, Query, Header, Depends
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from models import WorkOrderCreate, WorkOrder, WorkOrderUpdate, TechnicianUpdate
from database import get_db
from db_models import WorkOrder as WorkOrderModel
from utils import generate_id, get_current_date
from utils.workflow_rules import (
    validate_status_transition,
    get_work_order_permissions,
    is_transition_allowed
)


class AdminRejectData(BaseModel):
    rejectionReason: str


router = APIRouter(prefix="/api/workorders", tags=["Work Orders"])


async def create_workorder_internal(wo: WorkOrderCreate, db: Session) -> dict:
    """Internal function to create work order, used by both POST endpoint and request conversion"""
    wo_id = generate_id("WO")
    
    new_wo = WorkOrderModel(
        id=wo_id,
        title=wo.title,
        description=wo.description,
        asset_name=wo.assetName,
        location=wo.location,
        priority=wo.priority,
        status=wo.status,
        assigned_to=wo.assignedTo,
        due_date=wo.dueDate,
        image_ids=wo.imageIds,
        request_id=wo.requestId,
        location_data=wo.locationData.dict() if wo.locationData else None
    )
    
    db.add(new_wo)
    db.commit()
    db.refresh(new_wo)
    
    return new_wo.to_dict()


@router.post("", response_model=WorkOrder)
async def create_workorder(wo: WorkOrderCreate, db: Session = Depends(get_db)):
    """Create a new work order"""
    return await create_workorder_internal(wo, db)


@router.get("", response_model=List[WorkOrder])
async def list_workorders(
    search: Optional[str] = Query(default=None, description="Search by title or description"),
    startDate: Optional[str] = Query(default=None, description="Filter by createdAt >= startDate (YYYY-MM-DD)"),
    endDate: Optional[str] = Query(default=None, description="Filter by createdAt <= endDate (YYYY-MM-DD)"),
    assignedTo: Optional[str] = Query(default=None, description="Filter by assigned technician name"),
    db: Session = Depends(get_db)
):
    """List work orders with optional filtering and search"""
    query = db.query(WorkOrderModel)
    
    if search:
        s = f"%{search.lower()}%"
        query = query.filter(
            (WorkOrderModel.title.ilike(s)) | 
            (WorkOrderModel.description.ilike(s))
        )
    
    if assignedTo:
        query = query.filter(WorkOrderModel.assigned_to == assignedTo)
    
    if startDate:
        start_dt = datetime.strptime(startDate, "%Y-%m-%d")
        query = query.filter(WorkOrderModel.created_at >= start_dt)
    
    if endDate:
        end_dt = datetime.strptime(endDate, "%Y-%m-%d")
        query = query.filter(WorkOrderModel.created_at <= end_dt)
    
    workorders = query.order_by(WorkOrderModel.created_at.desc()).all()
    return [wo.to_dict() for wo in workorders]


@router.get("/{wo_id}", response_model=WorkOrder)
async def get_workorder(wo_id: str, db: Session = Depends(get_db)):
    """Get a specific work order"""
    wo = db.query(WorkOrderModel).filter(WorkOrderModel.id == wo_id).first()
    
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    return wo.to_dict()


@router.put("/{wo_id}", response_model=WorkOrder)
async def update_workorder(
    wo_id: str,
    updates: WorkOrderUpdate,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name"),
    db: Session = Depends(get_db)
):
    """Update a work order with workflow validation"""
    user_role = x_user_role or "Admin"
    user_name = x_user_name or "Unknown"
    
    wo = db.query(WorkOrderModel).filter(WorkOrderModel.id == wo_id).first()
    
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    
    if "status" in update_data:
        new_status = update_data["status"]
        current_status = wo.status
        
        try:
            validate_status_transition(current_status, new_status, user_role)
        except ValueError as e:
            raise HTTPException(status_code=403, detail=str(e))
    
    permissions = get_work_order_permissions(
        wo.status,
        user_role,
        wo.assigned_to,
        user_name
    )
    
    if not permissions.can_edit:
        raise HTTPException(
            status_code=403,
            detail=f"User with role '{user_role}' cannot edit work order with status '{wo.status}'"
        )
    
    field_mapping = {
        "title": "title",
        "description": "description",
        "assetName": "asset_name",
        "location": "location",
        "priority": "priority",
        "status": "status",
        "assignedTo": "assigned_to",
        "dueDate": "due_date",
        "imageIds": "image_ids",
        "adminReview": "admin_review",
        "locationData": "location_data"
    }
    
    for api_key, db_key in field_mapping.items():
        if api_key in update_data:
            value = update_data[api_key]
            if api_key == "locationData" and value is not None:
                value = value.dict() if hasattr(value, 'dict') else value
            setattr(wo, db_key, value)
    
    db.commit()
    db.refresh(wo)
    
    return wo.to_dict()


@router.delete("/{wo_id}")
async def delete_workorder(wo_id: str, db: Session = Depends(get_db)):
    """Delete a work order"""
    wo = db.query(WorkOrderModel).filter(WorkOrderModel.id == wo_id).first()
    
    if wo:
        db.delete(wo)
        db.commit()
    
    return {"message": "Work order deleted"}


@router.patch("/{wo_id}/technician-update", response_model=WorkOrder)
async def technician_update_workorder(
    wo_id: str,
    technician_update: TechnicianUpdate,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name"),
    db: Session = Depends(get_db)
):
    """Update work order by technician with notes and images, moves status to Pending"""
    user_role = x_user_role or "Technician"
    user_name = x_user_name or "Unknown"
    
    wo = db.query(WorkOrderModel).filter(WorkOrderModel.id == wo_id).first()
    
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    current_status = wo.status
    
    if current_status != "In Progress":
        raise HTTPException(
            status_code=403,
            detail=f"Technician updates only allowed when status is 'In Progress', current status: '{current_status}'"
        )
    
    if wo.assigned_to != user_name and user_role == "Technician":
        raise HTTPException(
            status_code=403,
            detail="Technician can only update work orders assigned to them"
        )
    
    try:
        validate_status_transition(current_status, "Pending", user_role)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    
    wo.technician_notes = technician_update.technicianNotes
    wo.technician_images = technician_update.technicianImages
    wo.status = "Pending"
    
    # Keep original request images separate from technician images
    # Do NOT merge technicianImages into image_ids
    
    db.commit()
    db.refresh(wo)
    
    return wo.to_dict()


@router.patch("/{wo_id}/approve", response_model=WorkOrder)
async def admin_approve_workorder(
    wo_id: str,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name"),
    db: Session = Depends(get_db)
):
    """Head Technician approves work order, changes status from Pending to Completed"""
    user_role = x_user_role or "Head Technician"
    user_name = x_user_name or "Unknown"
    
    if user_role != "Head Technician":
        raise HTTPException(status_code=403, detail="Only Head Technician can approve work orders")
    
    wo = db.query(WorkOrderModel).filter(WorkOrderModel.id == wo_id).first()
    
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    current_status = wo.status
    
    if current_status != "Pending":
        raise HTTPException(
            status_code=403,
            detail=f"Can only approve work orders in 'Pending' status, current: '{current_status}'"
        )
    
    try:
        validate_status_transition(current_status, "Completed", user_role)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    
    wo.status = "Completed"
    wo.approved_by = user_name
    wo.approved_at = datetime.now()
    
    db.commit()
    db.refresh(wo)
    
    return wo.to_dict()


@router.patch("/{wo_id}/reject", response_model=WorkOrder)
async def admin_reject_workorder(
    wo_id: str,
    reject_data: AdminRejectData,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name"),
    db: Session = Depends(get_db)
):
    """Head Technician rejects work order with reason, changes status from Pending to In Progress"""
    user_role = x_user_role or "Head Technician"
    user_name = x_user_name or "Unknown"
    
    if user_role != "Head Technician":
        raise HTTPException(status_code=403, detail="Only Head Technician can reject work orders")
    
    wo = db.query(WorkOrderModel).filter(WorkOrderModel.id == wo_id).first()
    
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    current_status = wo.status
    
    if current_status != "Pending":
        raise HTTPException(
            status_code=403,
            detail=f"Can only reject work orders in 'Pending' status, current: '{current_status}'"
        )
    
    try:
        validate_status_transition(current_status, "In Progress", user_role)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    
    wo.status = "In Progress"
    wo.rejection_reason = reject_data.rejectionReason
    wo.rejected_by = user_name
    wo.rejected_at = datetime.now()
    
    db.commit()
    db.refresh(wo)
    
    return wo.to_dict()


@router.patch("/{wo_id}/close", response_model=WorkOrder)
async def admin_close_workorder(
    wo_id: str,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name"),
    db: Session = Depends(get_db)
):
    """Admin closes work order, changes status from Completed to Closed"""
    user_role = x_user_role or "Admin"
    user_name = x_user_name or "Unknown"
    
    if user_role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can close work orders")
    
    wo = db.query(WorkOrderModel).filter(WorkOrderModel.id == wo_id).first()
    
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    current_status = wo.status
    
    if current_status != "Completed":
        raise HTTPException(
            status_code=403,
            detail=f"Can only close work orders in 'Completed' status, current: '{current_status}'"
        )
    
    try:
        validate_status_transition(current_status, "Closed", user_role)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    
    wo.status = "Closed"
    wo.closed_by = user_name
    wo.closed_at = datetime.now()
    
    db.commit()
    db.refresh(wo)
    
    return wo.to_dict()
