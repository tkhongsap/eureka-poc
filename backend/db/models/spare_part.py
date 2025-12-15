from sqlalchemy import Column, Integer, String, Float, DateTime, func
from db.base import Base


class SparePart(Base):
    __tablename__ = "spare_parts"

    id = Column(Integer, primary_key=True, index=True)
    part_name = Column(String(255), nullable=False)
    category = Column(String(255), nullable=False)
    price_per_unit = Column(Float, nullable=False, default=0.0)
    quantity = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
