from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from typing import List
from datetime import datetime
import os
import uuid
import aiofiles

from models import ImageInfo
from utils import PICTURES_DIR, IMAGES_FILE, load_json, save_json

router = APIRouter(prefix="/api/images", tags=["Images"])


@router.post("/upload", response_model=ImageInfo)
async def upload_image(file: UploadFile = File(...)):
    """Upload an image and return its ID"""
    # Generate unique ID and filename
    image_id = f"IMG-{int(datetime.now().timestamp() * 1000)}-{uuid.uuid4().hex[:8]}"
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{image_id}{ext}"
    filepath = os.path.join(PICTURES_DIR, filename)
    
    # Save file
    async with aiofiles.open(filepath, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Save image info
    image_info = {
        "id": image_id,
        "originalName": file.filename,
        "filename": filename,
        "createdAt": datetime.now().isoformat()
    }
    
    images = load_json(IMAGES_FILE)
    images.append(image_info)
    save_json(IMAGES_FILE, images)
    
    return image_info


@router.get("/{image_id}")
async def get_image(image_id: str):
    """Get image file by ID"""
    images = load_json(IMAGES_FILE)
    image = next((img for img in images if img["id"] == image_id), None)
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    filepath = os.path.join(PICTURES_DIR, image["filename"])
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Image file not found")
    
    return FileResponse(filepath)


@router.get("", response_model=List[ImageInfo])
async def list_images():
    """List all images"""
    return load_json(IMAGES_FILE)


@router.delete("/{image_id}")
async def delete_image(image_id: str):
    """Delete an image"""
    images = load_json(IMAGES_FILE)
    image = next((img for img in images if img["id"] == image_id), None)
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Delete file
    filepath = os.path.join(PICTURES_DIR, image["filename"])
    if os.path.exists(filepath):
        os.remove(filepath)
    
    # Remove from list
    images = [img for img in images if img["id"] != image_id]
    save_json(IMAGES_FILE, images)
    
    return {"message": "Image deleted"}
