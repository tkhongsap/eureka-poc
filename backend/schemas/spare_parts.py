from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class SparePartBase(BaseModel):
    part_name: str
    category: str
    price_per_unit: float
    quantity: int



class SparePartCreate(SparePartBase):
    pass


class SparePartUpdate(BaseModel):
    part_name: Optional[str] = None
    category: Optional[str] = None
    price_per_unit: Optional[float] = None
    quantity: Optional[int] = None


class SparePart(SparePartBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
