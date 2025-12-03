from sqlalchemy import Column, String, Text, DateTime, Boolean
from sqlalchemy.sql import func

from db.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(100), primary_key=True)
    type = Column(String(50), nullable=False)
    work_order_id = Column(String(50), nullable=False, index=True)
    work_order_title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    recipient_role = Column(String(50), nullable=False, index=True)
    recipient_name = Column(String(255), nullable=True, index=True)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    triggered_by = Column(String(255), nullable=False)
