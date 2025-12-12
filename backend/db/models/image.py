from db.base import Base
from sqlalchemy import Column, DateTime, String, Text
from sqlalchemy.sql import func


class Image(Base):
    __tablename__ = "images"

    id = Column(String(50), primary_key=True)
    original_name = Column(String(255), nullable=False)
    # Base64-encoded image/video data stored in DB
    base64_data = Column(Text, nullable=False)
    # Optional original filename kept for reference
    filename = Column(String(255), nullable=True)
    # Media type: 'image' or 'video' (default 'image' for backward compatibility)
    media_type = Column(String(10), nullable=False, default='image')
    # MIME content type (e.g., 'image/jpeg', 'video/mp4')
    content_type = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
