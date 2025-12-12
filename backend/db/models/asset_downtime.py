"""Asset Downtime model for tracking equipment downtime periods."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from ..base import Base


class AssetDowntime(Base):
    """Model for recording asset downtime events."""
    
    __tablename__ = "asset_downtimes"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String(50), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Downtime period
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)  # NULL means still down
    
    # Downtime details
    reason = Column(String(100), nullable=False)  # Breakdown, Planned Maintenance, Setup, etc.
    description = Column(Text, nullable=True)
    
    # Impact
    production_loss = Column(Float, nullable=True)  # Units or hours lost
    
    # Related work order (if any)
    work_order_id = Column(Integer, nullable=True)
    
    # Audit fields
    reported_by = Column(String(100), nullable=True)
    resolved_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    asset = relationship("Asset", back_populates="downtimes")
    
    @property
    def duration_minutes(self) -> int | None:
        """Calculate downtime duration in minutes."""
        if self.end_time and self.start_time:
            delta = self.end_time - self.start_time
            return int(delta.total_seconds() / 60)
        return None
    
    @property
    def is_active(self) -> bool:
        """Check if downtime is still ongoing."""
        return self.end_time is None


# Downtime reason constants
DOWNTIME_REASONS = [
    "Breakdown",
    "Planned Maintenance",
    "Setup/Changeover",
    "Material Shortage",
    "Operator Unavailable",
    "Quality Issue",
    "External Factor",
    "Other"
]
