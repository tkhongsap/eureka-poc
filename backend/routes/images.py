import base64
import os
import uuid
from datetime import datetime
from typing import List

from db import get_db
from db.models import Image as ImageModel
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from schemas import ImageInfo
from sqlalchemy.orm import Session

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
    b64 = base64.b64encode(content).decode("utf-8")

    new_image = ImageModel(
        id=image_id, original_name=file.filename, filename=filename, base64_data=b64
    )

    db.add(new_image)
    db.commit()
    db.refresh(new_image)

    return ImageInfo.model_validate(new_image)


@router.post("/upload-base64", response_model=ImageInfo)
async def upload_image_base64(payload: dict, db: Session = Depends(get_db)):
    """Upload an image provided as base64 in JSON { originalName, base64Data }"""
    original_name = payload.get("originalName")
    base64_data = payload.get("base64Data")
    if not original_name or not base64_data:
        raise HTTPException(
            status_code=400, detail="originalName and base64Data are required"
        )

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
        base64_data=base64_data,
    )

    db.add(new_image)
    db.commit()
    db.refresh(new_image)

    return ImageInfo.model_validate(new_image)


@router.get("/{image_id}")
async def get_image(image_id: str, db: Session = Depends(get_db)):
    """Get image base64 by ID"""
    image = db.query(ImageModel).filter(ImageModel.id == image_id).first()

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    image_info = ImageInfo.model_validate(image).model_dump()
    image_info["createdAt"] = image_info["createdAt"].isoformat()

    return JSONResponse(content=image_info)


@router.get("/{image_id}/raw")
async def get_image_raw(image_id: str, db: Session = Depends(get_db)):
    """Get image as binary data for direct display in img src"""
    from fastapi.responses import Response
    
    image = db.query(ImageModel).filter(ImageModel.id == image_id).first()

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    # Decode base64 to binary
    image_bytes = base64.b64decode(image.base64_data)
    
    # Determine content type from filename
    ext = os.path.splitext(image.filename)[1].lower()
    content_types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
    }
    content_type = content_types.get(ext, 'image/jpeg')
    
    return Response(content=image_bytes, media_type=content_type)


@router.get("", response_model=List[ImageInfo])
async def list_images(db: Session = Depends(get_db)):
    """List all images"""
    images = db.query(ImageModel).order_by(ImageModel.created_at.desc()).all()
    return [ImageInfo.model_validate(img) for img in images]


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
