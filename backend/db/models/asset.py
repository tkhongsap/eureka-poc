from sqlalchemy import Column, String, Text, DateTime, Integer, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from db.base import Base


class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(50), primary_key=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # Site, Line, Facility, Machine, Equipment
    status = Column(String(50), default="Operational")  # Operational, Downtime, Maintenance
    health_score = Column(Integer, default=100)  # 0-100
    location = Column(String(255), nullable=True)
    criticality = Column(String(50), default="Medium")  # Critical, High, Medium, Low
    model = Column(String(255), nullable=True)
    manufacturer = Column(String(255), nullable=True)
    serial_number = Column(String(255), nullable=True)
    install_date = Column(String(50), nullable=True)  # YYYY-MM-DD
    warranty_expiry = Column(String(50), nullable=True)  # YYYY-MM-DD
    description = Column(Text, nullable=True)
    
    # GIS Location for Asset Map
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # QR Code
    qr_code = Column(String(255), nullable=True)  # QR code data/URL
    
    # Hierarchy
    parent_id = Column(String(50), ForeignKey("assets.id"), nullable=True, index=True)
    
    # Tracking
    created_by = Column(String(255), nullable=True)
    updated_by = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Self-referential relationship for hierarchy
    parent = relationship("Asset", remote_side=[id], backref="children", lazy="select")
    
    # Relationships to downtime and meter readings
    downtimes = relationship("AssetDowntime", back_populates="asset", cascade="all, delete-orphan")
    meter_readings = relationship("MeterReading", back_populates="asset", cascade="all, delete-orphan")
