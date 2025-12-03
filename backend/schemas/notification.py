from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class NotificationCreate(BaseModel):
    type: str
    workOrderId: str
    workOrderTitle: str
    message: str
    recipientRole: str
    recipientName: Optional[str] = None
    isRead: bool = False
    triggeredBy: str


class Notification(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    type: str
    workOrderId: str = Field(validation_alias="work_order_id")
    workOrderTitle: str = Field(validation_alias="work_order_title")
    message: str
    recipientRole: str = Field(validation_alias="recipient_role")
    recipientName: Optional[str] = Field(
        default=None, validation_alias="recipient_name"
    )
    isRead: bool = Field(validation_alias="is_read")
    createdAt: datetime = Field(validation_alias="created_at")
    triggeredBy: str = Field(validation_alias="triggered_by")
