from sqlalchemy import Column, String, Text, DateTime, JSON, Boolean
from sqlalchemy.sql import func

from db.base import Base


class WorkOrder(Base):
    __tablename__ = "workorders"

    id = Column(String(50), primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    asset_name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    priority = Column(String(50), nullable=False, index=True)
    status = Column(String(50), default="Open", index=True)
    assigned_to = Column(String(255), nullable=True, index=True)
    due_date = Column(String(50), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    image_ids = Column(JSON, default=list)
    request_id = Column(String(50), nullable=True)
    created_by = Column(String(255), nullable=True)  # Name of the requester who created this WO
    technician_notes = Column(Text, nullable=True)
    technician_images = Column(JSON, default=list)
    admin_review = Column(Text, nullable=True)
    location_data = Column(JSON, nullable=True)
    preferred_date = Column(
        String(50), nullable=True
    )  # Preferred maintenance date from request (YYYY-MM-DD)
    approved_by = Column(String(255), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejected_by = Column(String(255), nullable=True)
    rejected_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    closed_by = Column(String(255), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
