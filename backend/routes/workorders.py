from fastapi import APIRouter, HTTPException
from typing import List

from models import WorkOrderCreate, WorkOrder, WorkOrderUpdate, TechnicianUpdate
from utils import WORKORDERS_FILE, load_json, save_json, generate_id, get_current_date

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
        "technicianImages": []
    }
    
    workorders = load_json(WORKORDERS_FILE)
    workorders.insert(0, new_wo)
    save_json(WORKORDERS_FILE, workorders)
    
    return new_wo


@router.get("", response_model=List[WorkOrder])
async def list_workorders():
    """List all work orders"""
    return load_json(WORKORDERS_FILE)


@router.get("/{wo_id}", response_model=WorkOrder)
async def get_workorder(wo_id: str):
    """Get a specific work order"""
    workorders = load_json(WORKORDERS_FILE)
    wo = next((w for w in workorders if w["id"] == wo_id), None)
    
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    return wo


@router.put("/{wo_id}", response_model=WorkOrder)
async def update_workorder(wo_id: str, updates: WorkOrderUpdate):
    """Update a work order"""
    workorders = load_json(WORKORDERS_FILE)
    
    for wo in workorders:
        if wo["id"] == wo_id:
            update_data = updates.model_dump(exclude_unset=True)
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
async def technician_update_workorder(wo_id: str, technician_update: TechnicianUpdate):
    """Update work order by technician with notes and images, moves status to Pending"""
    workorders = load_json(WORKORDERS_FILE)
    
    for wo in workorders:
        if wo["id"] == wo_id:
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
