from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List
from datetime import datetime
from sqlalchemy.orm import Session
import os
import uuid
import aiofiles
import base64

from models import ImageInfo
from database import get_db
from db_models import Image as ImageModel
from utils import PICTURES_DIR

router = APIRouter(prefix="/api/images", tags=["Images"])


@router.post("/upload", response_model=ImageInfo)
async def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload an image file, convert to base64, and store in DB"""
    image_id = f"IMG-{int(datetime.now().timestamp() * 1000)}-{uuid.uuid4().hex[:8]}"
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{image_id}{ext}"

    # Read file content and convert to base64
    content = await file.read()
    b64 = base64.b64encode(content).decode('utf-8')
    
    new_image = ImageModel(
        id=image_id,
        original_name=file.filename,
        filename=filename,
        base64_data=b64
    )
    
    db.add(new_image)
    db.commit()
    db.refresh(new_image)
    
    return new_image.to_dict()


@router.post("/upload-base64", response_model=ImageInfo)
async def upload_image_base64(payload: dict, db: Session = Depends(get_db)):
    """Upload an image provided as base64 in JSON { originalName, base64Data }"""
    original_name = payload.get("originalName")
    base64_data = payload.get("base64Data")
    if not original_name or not base64_data:
        raise HTTPException(status_code=400, detail="originalName and base64Data are required")
    
    image_id = f"IMG-{int(datetime.now().timestamp() * 1000)}-{uuid.uuid4().hex[:8]}"
    ext = os.path.splitext(original_name)[1] or ".jpg"
    filename = f"{image_id}{ext}"

    # Basic validation that it's valid base64
    try:
        base64.b64decode(base64_data, validate=True)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64Data")

    new_image = ImageModel(
        id=image_id,
        original_name=original_name,
        filename=filename,
        base64_data=base64_data
    )

    db.add(new_image)
    db.commit()
    db.refresh(new_image)

    return new_image.to_dict()


@router.get("/{image_id}")
async def get_image(image_id: str, db: Session = Depends(get_db)):
    """Get image base64 by ID"""
    image = db.query(ImageModel).filter(ImageModel.id == image_id).first()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    return JSONResponse(content=image.to_dict())


@router.get("", response_model=List[ImageInfo])
async def list_images(db: Session = Depends(get_db)):
    """List all images"""
    images = db.query(ImageModel).order_by(ImageModel.created_at.desc()).all()
    return [img.to_dict() for img in images]


@router.delete("/{image_id}")
async def delete_image(image_id: str, db: Session = Depends(get_db)):
    """Delete an image"""
    image = db.query(ImageModel).filter(ImageModel.id == image_id).first()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    filepath = os.path.join(PICTURES_DIR, image.filename)
    if os.path.exists(filepath):
        os.remove(filepath)
    
    db.delete(image)
    db.commit()
    
    return {"message": "Image deleted"}
