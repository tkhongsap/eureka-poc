from pydantic import BaseModel


class ImageInfo(BaseModel):
    id: str
    originalName: str
    filename: str | None
    base64Data: str
    createdAt: str
