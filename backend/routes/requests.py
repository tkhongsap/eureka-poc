from fastapi import APIRouter, HTTPException
from typing import List

from models import RequestCreate, RequestItem, RequestUpdate, WorkOrderCreate, WorkOrder
from utils import REQUESTS_FILE, load_json, save_json, generate_id, get_current_datetime
from routes.workorders import create_workorder

router = APIRouter(prefix="/api/requests", tags=["Requests"])


@router.post("", response_model=RequestItem)
async def create_request(request: RequestCreate):
    """Create a new maintenance request"""
    request_id = generate_id("REQ")
    
    new_request = {
        "id": request_id,
        "location": request.location,
        "priority": request.priority,
        "description": request.description,
        "status": "Open",
        "createdAt": get_current_datetime(),
        "imageIds": request.imageIds,
        "assignedTo": request.assignedTo,
        "createdBy": request.createdBy
    }
    
    requests = load_json(REQUESTS_FILE)
    requests.insert(0, new_request)
    save_json(REQUESTS_FILE, requests)
    
    return new_request


@router.get("", response_model=List[RequestItem])
async def list_requests():
    """List all requests"""
    return load_json(REQUESTS_FILE)


@router.get("/{request_id}", response_model=RequestItem)
async def get_request(request_id: str):
    """Get a specific request"""
    requests = load_json(REQUESTS_FILE)
    request = next((r for r in requests if r["id"] == request_id), None)
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return request


@router.put("/{request_id}", response_model=RequestItem)
async def update_request(request_id: str, updates: RequestUpdate):
    """Update request"""
    requests = load_json(REQUESTS_FILE)
    
    for req in requests:
        if req["id"] == request_id:
            if updates.status is not None:
                req["status"] = updates.status
            if updates.priority is not None:
                req["priority"] = updates.priority
            if updates.description is not None:
                req["description"] = updates.description
            save_json(REQUESTS_FILE, requests)
            return req
    
    raise HTTPException(status_code=404, detail="Request not found")


@router.delete("/{request_id}")
async def delete_request(request_id: str):
    """Delete a request"""
    requests = load_json(REQUESTS_FILE)
    requests = [r for r in requests if r["id"] != request_id]
    save_json(REQUESTS_FILE, requests)
    return {"message": "Request deleted"}


@router.post("/{request_id}/convert", response_model=WorkOrder)
async def convert_request_to_workorder(request_id: str):
    """Convert a request to a work order"""
    requests = load_json(REQUESTS_FILE)
    request = next((r for r in requests if r["id"] == request_id), None)
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Create work order from request
    wo_data = WorkOrderCreate(
        title=f"{request['description'][:50]}{'...' if len(request['description']) > 50 else ''}",
        description=request["description"],
        assetName=request["location"],
        location=request["location"],
        priority=request["priority"],
        dueDate=get_current_datetime().split("T")[0],
        imageIds=request.get("imageIds", []),
        requestId=request_id
    )
    
    new_wo = await create_workorder(wo_data)
    
    # Update request status
    for req in requests:
        if req["id"] == request_id:
            req["status"] = "Converted to WO"
            break
    save_json(REQUESTS_FILE, requests)
    
    return new_wo
