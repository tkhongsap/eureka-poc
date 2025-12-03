from sqlalchemy import Column, String, Text, DateTime, JSON
from sqlalchemy.sql import func

from db.base import Base


class Request(Base):
    __tablename__ = "requests"

    id = Column(String(50), primary_key=True)
    location = Column(String(255), nullable=False)
    priority = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="Open", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    image_ids = Column(JSON, default=list)
    assigned_to = Column(String(255), nullable=True, index=True)
    created_by = Column(String(255), nullable=True, index=True)
    location_data = Column(JSON, nullable=True)
    preferred_date = Column(
        String(50), nullable=True, index=True
    )  # Preferred maintenance date (YYYY-MM-DD)
