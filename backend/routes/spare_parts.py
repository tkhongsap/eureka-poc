from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from db.session import get_db
from db.models.spare_part import SparePart as SparePartModel
from schemas.spare_parts import SparePart, SparePartCreate, SparePartUpdate

router = APIRouter(prefix="/api/spare-parts", tags=["Spare Parts"])


@router.get("", response_model=List[SparePart])
def list_spare_parts(db: Session = Depends(get_db)):
    """List all spare parts"""
    parts = db.query(SparePartModel).all()
    return parts


@router.post("", response_model=SparePart)
def create_spare_part(payload: SparePartCreate, db: Session = Depends(get_db)):
    """Create a new spare part"""
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


@router.get("/{part_id}", response_model=SparePart)
def get_spare_part(part_id: int, db: Session = Depends(get_db)):
    """Get a specific spare part by ID"""
    part = db.query(SparePartModel).filter(SparePartModel.id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="Spare part not found")
    return part


@router.put("/{part_id}", response_model=SparePart)
def update_spare_part(part_id: int, payload: SparePartUpdate, db: Session = Depends(get_db)):
    """Update a spare part"""
    part = db.query(SparePartModel).filter(SparePartModel.id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="Spare part not found")
    
    # Update fields if provided
    if payload.part_name is not None:
        part.part_name = payload.part_name
    if payload.category is not None:
        part.category = payload.category
    if payload.price_per_unit is not None:
        part.price_per_unit = payload.price_per_unit
    if payload.quantity is not None:
        part.quantity = payload.quantity
    
    db.commit()
    db.refresh(part)
    return part


@router.delete("/{part_id}")
def delete_spare_part(part_id: int, db: Session = Depends(get_db)):
    """Delete a spare part"""
    part = db.query(SparePartModel).filter(SparePartModel.id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="Spare part not found")
    
    db.delete(part)
    db.commit()
    return {"message": "Spare part deleted successfully"}
