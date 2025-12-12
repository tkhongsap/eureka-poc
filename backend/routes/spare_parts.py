from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from db.models.spare_part import SparePart as SparePartModel
from schemas.spare_parts import SparePart, SparePartCreate, SparePartUpdate


router = APIRouter(prefix="/api/spare-parts", tags=["Spare Parts"])


@router.get("/", response_model=List[SparePart])
def list_spare_parts(db: Session = Depends(get_db)):
    items = db.query(SparePartModel).order_by(SparePartModel.id.desc()).all()
    return items


@router.post("/", response_model=SparePart)
def create_spare_part(payload: SparePartCreate, db: Session = Depends(get_db)):
    item = SparePartModel(
        part_name=payload.part_name,
        category=payload.category,
        price_per_unit=payload.price_per_unit,
        quantity=payload.quantity,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{part_id}", response_model=SparePart)
def update_spare_part(part_id: int, payload: SparePartUpdate, db: Session = Depends(get_db)):
    item = db.query(SparePartModel).filter(SparePartModel.id == part_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Spare part not found")

    if payload.part_name is not None:
        item.part_name = payload.part_name
    if payload.category is not None:
        item.category = payload.category
    if payload.price_per_unit is not None:
        item.price_per_unit = payload.price_per_unit
    if payload.quantity is not None:
        item.quantity = payload.quantity

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{part_id}")
def delete_spare_part(part_id: int, db: Session = Depends(get_db)):
    item = db.query(SparePartModel).filter(SparePartModel.id == part_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Spare part not found")
    db.delete(item)
    db.commit()
    return {"status": "deleted", "id": part_id}
