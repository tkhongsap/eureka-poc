"""Meter Reading model for tracking asset meter values."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from ..base import Base


class MeterReading(Base):
    """Model for recording meter readings from assets."""
    
    __tablename__ = "meter_readings"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String(50), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Meter details
    meter_type = Column(String(50), nullable=False)  # Runtime Hours, Cycle Count, Temperature, etc.
    value = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)  # hours, cycles, °C, psi, etc.
    
    # Previous reading for delta calculation
    previous_value = Column(Float, nullable=True)
    
    # Reading metadata
    reading_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    source = Column(String(50), nullable=True)  # Manual, IoT, SCADA, etc.
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Audit fields
    recorded_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    asset = relationship("Asset", back_populates="meter_readings")
    
    @property
    def delta(self) -> float | None:
        """Calculate change from previous reading."""
        if self.previous_value is not None:
            return self.value - self.previous_value
        return None


# Common meter types
METER_TYPES = [
    {"type": "Runtime Hours", "unit": "hours"},
    {"type": "Cycle Count", "unit": "cycles"},
    {"type": "Production Count", "unit": "units"},
    {"type": "Temperature", "unit": "°C"},
    {"type": "Pressure", "unit": "bar"},
    {"type": "Vibration", "unit": "mm/s"},
    {"type": "Energy Consumption", "unit": "kWh"},
    {"type": "Fuel Level", "unit": "liters"},
    {"type": "Odometer", "unit": "km"},
    {"type": "Other", "unit": "-"}
]
