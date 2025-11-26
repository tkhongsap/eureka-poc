from pydantic import BaseModel


class ImageInfo(BaseModel):
    id: str
    originalName: str
    filename: str
    createdAt: str
