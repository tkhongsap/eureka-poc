from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from db.base import Base


class SparePart(Base):
    __tablename__ = "spare_parts"

    id = Column(Integer, primary_key=True, index=True)
    part_name = Column(String(255), nullable=False, index=True)
    category = Column(String(255), nullable=False, index=True)
    price_per_unit = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
