from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from db.models.spare_part import SparePart as SparePartModel
from schemas.spare_parts import SparePart, SparePartCreate

router = APIRouter(prefix="/api/spare-parts", tags=["Spare Parts"])


@router.post("", response_model=SparePart)
def create_spare_part(payload: SparePartCreate, db: Session = Depends(get_db)):
    part = SparePartModel(
        part_name=payload.part_name,
        category=payload.category,
        price_per_unit=payload.price_per_unit,
        quantity=payload.quantity,
    )
    db.add(part)
    db.commit()
    db.refresh(part)
    return part
