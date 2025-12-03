from sqlalchemy import Column, String, Text, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from database import Base
import uuid
from datetime import datetime, timezone


def generate_uuid():
    return str(uuid.uuid4())


class Request(Base):
    __tablename__ = "requests"
    
    id = Column(String(50), primary_key=True)
    location = Column(String(255), nullable=False)
    priority = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="Open")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    image_ids = Column(JSON, default=list)
    assigned_to = Column(String(255), nullable=True)
    created_by = Column(String(255), nullable=True)
    location_data = Column(JSON, nullable=True)
    preferred_date = Column(String(50), nullable=True)  # Preferred maintenance date (YYYY-MM-DD)
    
    def to_dict(self):
        image_ids_list = list(self.image_ids) if self.image_ids else []
        location_data_dict = dict(self.location_data) if self.location_data else None
        
        created_at_str = None
        if self.created_at:
            created_at_str = self.created_at.isoformat()
        
        return {
            "id": self.id,
            "location": self.location,
            "priority": self.priority,
            "description": self.description,
            "status": self.status,
            "createdAt": created_at_str,
            "imageIds": image_ids_list,
            "assignedTo": self.assigned_to,
            "createdBy": self.created_by,
            "locationData": location_data_dict,
            "preferredDate": self.preferred_date
        }


class WorkOrder(Base):
    __tablename__ = "workorders"
    
    id = Column(String(50), primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    asset_name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    priority = Column(String(50), nullable=False)
    status = Column(String(50), default="Open")
    assigned_to = Column(String(255), nullable=True)
    due_date = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    image_ids = Column(JSON, default=list)
    request_id = Column(String(50), nullable=True)
    technician_notes = Column(Text, nullable=True)
    technician_images = Column(JSON, default=list)
    admin_review = Column(Text, nullable=True)
    location_data = Column(JSON, nullable=True)
    preferred_date = Column(String(50), nullable=True)  # Preferred maintenance date from request (YYYY-MM-DD)
    approved_by = Column(String(255), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejected_by = Column(String(255), nullable=True)
    rejected_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    closed_by = Column(String(255), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    
    def to_dict(self):
        image_ids_list = list(self.image_ids) if self.image_ids else []
        technician_images_list = list(self.technician_images) if self.technician_images else []
        location_data_dict = dict(self.location_data) if self.location_data else None
        
        created_at_str = self.created_at.strftime("%Y-%m-%d") if self.created_at else None
        approved_at_str = self.approved_at.isoformat() if self.approved_at else None
        rejected_at_str = self.rejected_at.isoformat() if self.rejected_at else None
        closed_at_str = self.closed_at.isoformat() if self.closed_at else None
        
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "assetName": self.asset_name,
            "location": self.location,
            "priority": self.priority,
            "status": self.status,
            "assignedTo": self.assigned_to,
            "dueDate": self.due_date,
            "createdAt": created_at_str,
            "imageIds": image_ids_list,
            "requestId": self.request_id,
            "technicianNotes": self.technician_notes,
            "technicianImages": technician_images_list,
            "adminReview": self.admin_review,
            "locationData": location_data_dict,
            "preferredDate": self.preferred_date,
            "approvedBy": self.approved_by,
            "approvedAt": approved_at_str,
            "rejectedBy": self.rejected_by,
            "rejectedAt": rejected_at_str,
            "rejectionReason": self.rejection_reason,
            "closedBy": self.closed_by,
            "closedAt": closed_at_str
        }


class Image(Base):
    __tablename__ = "images"
    
    id = Column(String(50), primary_key=True)
    original_name = Column(String(255), nullable=False)
    # Base64-encoded image data stored in DB
    base64_data = Column(Text, nullable=False)
    # Optional original filename kept for reference
    filename = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def to_dict(self):
        created_at_str = self.created_at.isoformat() if self.created_at else None
        
        return {
            "id": self.id,
            "originalName": self.original_name,
            "filename": self.filename,
            "base64Data": self.base64_data,
            "createdAt": created_at_str
        }


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String(100), primary_key=True)
    type = Column(String(50), nullable=False)
    work_order_id = Column(String(50), nullable=False)
    work_order_title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    recipient_role = Column(String(50), nullable=False)
    recipient_name = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    triggered_by = Column(String(255), nullable=False)
    
    def to_dict(self):
        created_at_str = self.created_at.isoformat() if self.created_at else None
        
        return {
            "id": self.id,
            "type": self.type,
            "workOrderId": self.work_order_id,
            "workOrderTitle": self.work_order_title,
            "message": self.message,
            "recipientRole": self.recipient_role,
            "recipientName": self.recipient_name,
            "isRead": bool(self.is_read),
            "createdAt": created_at_str,
            "triggeredBy": self.triggered_by
        }
