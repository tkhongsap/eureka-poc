from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from typing import List
from datetime import datetime
from sqlalchemy.orm import Session
import os
import uuid
import aiofiles

from models import ImageInfo
from database import get_db
from db_models import Image as ImageModel
from utils import PICTURES_DIR

router = APIRouter(prefix="/api/images", tags=["Images"])


@router.post("/upload", response_model=ImageInfo)
async def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload an image and return its ID"""
    image_id = f"IMG-{int(datetime.now().timestamp() * 1000)}-{uuid.uuid4().hex[:8]}"
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{image_id}{ext}"
    filepath = os.path.join(PICTURES_DIR, filename)
    
    async with aiofiles.open(filepath, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    new_image = ImageModel(
        id=image_id,
        original_name=file.filename,
        filename=filename
    )
    
    db.add(new_image)
    db.commit()
    db.refresh(new_image)
    
    return new_image.to_dict()


@router.get("/{image_id}")
async def get_image(image_id: str, db: Session = Depends(get_db)):
    """Get image file by ID"""
    image = db.query(ImageModel).filter(ImageModel.id == image_id).first()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    filepath = os.path.join(PICTURES_DIR, image.filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Image file not found")
    
    return FileResponse(filepath)


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
