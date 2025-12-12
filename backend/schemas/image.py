from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ImageInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    originalName: str = Field(validation_alias="original_name")
    filename: str | None = Field(validation_alias="filename")
    base64Data: str = Field(validation_alias="base64_data")
    mediaType: str = Field(default="image", validation_alias="media_type")
    contentType: str | None = Field(default=None, validation_alias="content_type")
    createdAt: datetime = Field(validation_alias="created_at")
