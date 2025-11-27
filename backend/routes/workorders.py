from fastapi import APIRouter, HTTPException, Query, Header
from typing import List, Optional
from pydantic import BaseModel
import httpx

from models import WorkOrderCreate, WorkOrder, WorkOrderUpdate, TechnicianUpdate
from utils import WORKORDERS_FILE, load_json, save_json, generate_id, get_current_date
from utils.workflow_rules import (
    validate_status_transition,
    get_work_order_permissions,
    is_transition_allowed
)

# Models for admin actions
class AdminRejectData(BaseModel):
    rejectionReason: str

router = APIRouter(prefix="/api/workorders", tags=["Work Orders"])


@router.post("", response_model=WorkOrder)
async def create_workorder(wo: WorkOrderCreate):
    """Create a new work order"""
    wo_id = generate_id("WO")
    
    new_wo = {
        "id": wo_id,
        "title": wo.title,
        "description": wo.description,
        "assetName": wo.assetName,
        "location": wo.location,
        "priority": wo.priority,
        "status": wo.status,
        "assignedTo": wo.assignedTo,
        "dueDate": wo.dueDate,
        "createdAt": get_current_date(),
        "imageIds": wo.imageIds,
        "requestId": wo.requestId,
        "technicianNotes": None,
        "technicianImages": [],
        "adminReview": None
    }
    
    workorders = load_json(WORKORDERS_FILE)
    workorders.insert(0, new_wo)
    save_json(WORKORDERS_FILE, workorders)
    
    return new_wo


@router.get("", response_model=List[WorkOrder])
async def list_workorders(
    search: Optional[str] = Query(default=None, description="Search by title or description"),
    startDate: Optional[str] = Query(default=None, description="Filter by createdAt >= startDate (YYYY-MM-DD)"),
    endDate: Optional[str] = Query(default=None, description="Filter by createdAt <= endDate (YYYY-MM-DD)"),
    assignedTo: Optional[str] = Query(default=None, description="Filter by assigned technician name"),
):
    """List work orders with optional filtering and search"""
    workorders = load_json(WORKORDERS_FILE)

    # Text search on title + description
    if search:
        s = search.lower()
        workorders = [
            w
            for w in workorders
            if s in str(w.get("title", "")).lower()
            or s in str(w.get("description", "")).lower()
        ]

    # Filter by assigned technician
    if assignedTo:
        workorders = [w for w in workorders if w.get("assignedTo") == assignedTo]

    # Date range filter on createdAt (expects ISO-like date string prefix match)
    if startDate:
        workorders = [
            w
            for w in workorders
            if str(w.get("createdAt", "")) >= startDate
        ]
    if endDate:
        workorders = [
            w
            for w in workorders
            if str(w.get("createdAt", "")) <= endDate
        ]

    return workorders


@router.get("/{wo_id}", response_model=WorkOrder)
async def get_workorder(wo_id: str):
    """Get a specific work order"""
    workorders = load_json(WORKORDERS_FILE)
    wo = next((w for w in workorders if w["id"] == wo_id), None)
    
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    return wo


@router.put("/{wo_id}", response_model=WorkOrder)
async def update_workorder(
    wo_id: str,
    updates: WorkOrderUpdate,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name")
):
    """Update a work order with workflow validation"""
    workorders = load_json(WORKORDERS_FILE)
    
    # Default to Admin if no role provided (for backward compatibility)
    user_role = x_user_role or "Admin"
    user_name = x_user_name or "Unknown"
    
    for wo in workorders:
        if wo["id"] == wo_id:
            # Check if status is being changed
            update_data = updates.model_dump(exclude_unset=True)
            
            if "status" in update_data:
                new_status = update_data["status"]
                current_status = wo["status"]
                
                # Validate status transition
                try:
                    validate_status_transition(current_status, new_status, user_role)
                except ValueError as e:
                    raise HTTPException(status_code=403, detail=str(e))
            
            # Check permissions for editing
            permissions = get_work_order_permissions(
                wo["status"],
                user_role,
                wo.get("assignedTo"),
                user_name
            )
            
            if not permissions.can_edit:
                raise HTTPException(
                    status_code=403,
                    detail=f"User with role '{user_role}' cannot edit work order with status '{wo['status']}'"
                )
            
            # Apply updates
            wo.update(update_data)
            save_json(WORKORDERS_FILE, workorders)
            return wo
    
    raise HTTPException(status_code=404, detail="Work order not found")


@router.delete("/{wo_id}")
async def delete_workorder(wo_id: str):
    """Delete a work order"""
    workorders = load_json(WORKORDERS_FILE)
    workorders = [w for w in workorders if w["id"] != wo_id]
    save_json(WORKORDERS_FILE, workorders)
    return {"message": "Work order deleted"}


@router.patch("/{wo_id}/technician-update", response_model=WorkOrder)
async def technician_update_workorder(
    wo_id: str,
    technician_update: TechnicianUpdate,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name")
):
    """Update work order by technician with notes and images, moves status to Pending"""
    workorders = load_json(WORKORDERS_FILE)
    
    user_role = x_user_role or "Technician"
    user_name = x_user_name or "Unknown"
    
    for wo in workorders:
        if wo["id"] == wo_id:
            current_status = wo["status"]
            
            # Validate technician can update (must be In Progress)
            if current_status != "In Progress":
                raise HTTPException(
                    status_code=403,
                    detail=f"Technician updates only allowed when status is 'In Progress', current status: '{current_status}'"
                )
            
            # Validate technician is assigned
            if wo.get("assignedTo") != user_name and user_role == "Technician":
                raise HTTPException(
                    status_code=403,
                    detail="Technician can only update work orders assigned to them"
                )
            
            # Validate status transition (In Progress → Pending)
            try:
                validate_status_transition(current_status, "Pending", user_role)
            except ValueError as e:
                raise HTTPException(status_code=403, detail=str(e))
            
            # Update technician-specific fields
            wo["technicianNotes"] = technician_update.technicianNotes
            wo["technicianImages"] = technician_update.technicianImages
            wo["status"] = "Pending"  # Always move to Pending when technician submits
            
            # Merge technician images with existing images (preserve original images)
            existing_images = wo.get("imageIds", [])
            all_images = existing_images + technician_update.technicianImages
            wo["imageIds"] = all_images
            
            save_json(WORKORDERS_FILE, workorders)
            return wo
    
    raise HTTPException(status_code=404, detail="Work order not found")


@router.patch("/{wo_id}/approve", response_model=WorkOrder)
async def admin_approve_workorder(
    wo_id: str,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name")
):
    """Admin approves work order, changes status from Pending to Completed"""
    workorders = load_json(WORKORDERS_FILE)
    
    user_role = x_user_role or "Admin"
    user_name = x_user_name or "Unknown"
    
    # Only Admin can approve
    if user_role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can approve work orders")
    
    for wo in workorders:
        if wo["id"] == wo_id:
            current_status = wo["status"]
            
            # Must be in Pending status
            if current_status != "Pending":
                raise HTTPException(
                    status_code=403,
                    detail=f"Can only approve work orders in 'Pending' status, current: '{current_status}'"
                )
            
            # Validate transition
            try:
                validate_status_transition(current_status, "Completed", user_role)
            except ValueError as e:
                raise HTTPException(status_code=403, detail=str(e))
            
            # Approve
            wo["status"] = "Completed"
            wo["approvedBy"] = user_name
            wo["approvedAt"] = get_current_date()
            
            save_json(WORKORDERS_FILE, workorders)
            return wo
    
    raise HTTPException(status_code=404, detail="Work order not found")


@router.patch("/{wo_id}/reject", response_model=WorkOrder)
async def admin_reject_workorder(
    wo_id: str,
    reject_data: AdminRejectData,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name")
):
    """Admin rejects work order with reason, changes status from Pending to In Progress"""
    workorders = load_json(WORKORDERS_FILE)
    
    user_role = x_user_role or "Admin"
    user_name = x_user_name or "Unknown"
    
    # Only Admin can reject
    if user_role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can reject work orders")
    
    for wo in workorders:
        if wo["id"] == wo_id:
            current_status = wo["status"]
            
            # Must be in Pending status
            if current_status != "Pending":
                raise HTTPException(
                    status_code=403,
                    detail=f"Can only reject work orders in 'Pending' status, current: '{current_status}'"
                )
            
            # Validate transition (back to In Progress)
            try:
                validate_status_transition(current_status, "In Progress", user_role)
            except ValueError as e:
                raise HTTPException(status_code=403, detail=str(e))
            
            # Get technician name for notification
            technician_name = wo.get("assignedTo", "Unknown")
            
            # Reject and send back
            wo["status"] = "In Progress"
            wo["rejectionReason"] = reject_data.rejectionReason
            wo["rejectedBy"] = user_name
            wo["rejectedAt"] = get_current_date()
            
            save_json(WORKORDERS_FILE, workorders)
            
            # Send notification to Technician with rejection reason
            try:
                async with httpx.AsyncClient() as client:
                    notification_data = {
                        "type": "wo_rejected",
                        "workOrderId": wo["id"],
                        "workOrderTitle": wo.get("title", "Work Order"),
                        "message": f'Work order "{wo.get("title", "Work Order")}" needs revision. Reason: {reject_data.rejectionReason}',
                        "recipientRole": "Technician",
                        "recipientName": technician_name,
                        "isRead": False,
                        "triggeredBy": user_name
                    }
                    await client.post(
                        "http://localhost:8000/api/notifications",
                        json=notification_data
                    )
            except Exception as e:
                # Log error but don't fail the request
                print(f"Failed to send notification: {e}")
            
            return wo
    
    raise HTTPException(status_code=404, detail="Work order not found")


@router.patch("/{wo_id}/close", response_model=WorkOrder)
async def admin_close_workorder(
    wo_id: str,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name")
):
    """Admin closes work order, changes status from Completed to Closed"""
    workorders = load_json(WORKORDERS_FILE)
    
    user_role = x_user_role or "Admin"
    user_name = x_user_name or "Unknown"
    
    # Only Admin can close
    if user_role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can close work orders")
    
    for wo in workorders:
        if wo["id"] == wo_id:
            current_status = wo["status"]
            
            # Must be in Completed status
            if current_status != "Completed":
                raise HTTPException(
                    status_code=403,
                    detail=f"Can only close work orders in 'Completed' status, current: '{current_status}'"
                )
            
            # Validate transition
            try:
                validate_status_transition(current_status, "Closed", user_role)
            except ValueError as e:
                raise HTTPException(status_code=403, detail=str(e))
            
            # Close
            wo["status"] = "Closed"
            wo["closedBy"] = user_name
            wo["closedAt"] = get_current_date()
            
            save_json(WORKORDERS_FILE, workorders)
            return wo
    
    raise HTTPException(status_code=404, detail="Work order not found")
