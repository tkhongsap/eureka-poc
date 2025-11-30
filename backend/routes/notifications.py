"""
Notification Routes for CMMS System
Handles notification CRUD operations and workflow notifications
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import Session

from database import get_db
from db_models import Notification as NotificationModel

router = APIRouter(prefix="/api", tags=["Notifications"])


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
    id: str
    type: str
    workOrderId: str
    workOrderTitle: str
    message: str
    recipientRole: str
    recipientName: Optional[str] = None
    isRead: bool
    createdAt: str
    triggeredBy: str


@router.get("/notifications", response_model=List[Notification])
async def get_notifications(
    x_user_role: Optional[str] = Header(None),
    x_user_name: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Get all notifications"""
    notifications = db.query(NotificationModel).order_by(NotificationModel.created_at.desc()).all()
    return [n.to_dict() for n in notifications]


@router.post("/notifications", response_model=Notification)
async def create_notification(
    notification: NotificationCreate,
    x_user_role: Optional[str] = Header(None),
    x_user_name: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Create a new notification"""
    notification_id = f"notif-{int(datetime.now().timestamp() * 1000)}"
    
    new_notification = NotificationModel(
        id=notification_id,
        type=notification.type,
        work_order_id=notification.workOrderId,
        work_order_title=notification.workOrderTitle,
        message=notification.message,
        recipient_role=notification.recipientRole,
        recipient_name=notification.recipientName,
        is_read=notification.isRead,
        triggered_by=notification.triggeredBy
    )
    
    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)
    
    return new_notification.to_dict()


@router.patch("/notifications/{notification_id}/read", response_model=Notification)
async def mark_notification_as_read(
    notification_id: str,
    x_user_role: Optional[str] = Header(None),
    x_user_name: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Mark a specific notification as read"""
    notification = db.query(NotificationModel).filter(NotificationModel.id == notification_id).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    
    return notification.to_dict()


def is_notification_for_user(notification: NotificationModel, user_role: str, user_name: str) -> bool:
    """Check if notification belongs to a specific user"""
    if notification.recipient_role != user_role:
        return False
    
    recipient_name = notification.recipient_name
    if recipient_name and recipient_name != user_name:
        return False
    
    return True


@router.patch("/notifications/read-all")
async def mark_all_notifications_as_read(
    x_user_role: Optional[str] = Header(None),
    x_user_name: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for the current user only"""
    notifications = db.query(NotificationModel).all()
    
    marked_count = 0
    for notification in notifications:
        if is_notification_for_user(notification, x_user_role or "", x_user_name or ""):
            if not notification.is_read:
                notification.is_read = True
                marked_count += 1
    
    db.commit()
    
    return {"message": f"{marked_count} notifications marked as read"}


@router.delete("/notifications/read")
async def delete_all_read_notifications(
    x_user_role: Optional[str] = Header(None),
    x_user_name: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Delete read notifications for the current user only"""
    notifications = db.query(NotificationModel).all()
    
    deleted_count = 0
    for notification in notifications:
        if is_notification_for_user(notification, x_user_role or "", x_user_name or ""):
            if notification.is_read:
                db.delete(notification)
                deleted_count += 1
    
    db.commit()
    
    return {"message": f"{deleted_count} read notifications deleted"}


@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    x_user_role: Optional[str] = Header(None),
    x_user_name: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Delete a specific notification"""
    notification = db.query(NotificationModel).filter(NotificationModel.id == notification_id).first()
    
    if notification:
        db.delete(notification)
        db.commit()
    
    return {"message": "Notification deleted"}
