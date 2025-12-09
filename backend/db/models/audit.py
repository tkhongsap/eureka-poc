from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.sql import func

from db.base import Base


class AuditLog(Base):
    """Audit log for sensitive actions such as role changes."""

    __tablename__ = "audit_logs"

    id = Column(String(50), primary_key=True)
    action = Column(String(50), nullable=False)  # e.g., role_change, user_delete
    actor_id = Column(String(50), nullable=False, index=True)
    target_user_id = Column(String(50), nullable=True, index=True)
    old_value = Column(String(255), nullable=True)
    new_value = Column(String(255), nullable=True)
    reason = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv4/IPv6
    created_at = Column(DateTime(timezone=True), server_default=func.now())
