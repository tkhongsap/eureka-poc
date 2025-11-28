"""
Notification Routes for CMMS System
Handles notification CRUD operations and workflow notifications
"""

from fastapi import APIRouter, HTTPException, Header
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import json
import os

router = APIRouter(prefix="/api", tags=["Notifications"])

# Path to notifications storage
STORAGE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'storage', 'information', 'notifications.json')

# Ensure storage directory exists
os.makedirs(os.path.dirname(STORAGE_PATH), exist_ok=True)

# Initialize storage file if it doesn't exist
if not os.path.exists(STORAGE_PATH):
    with open(STORAGE_PATH, 'w') as f:
        json.dump([], f)


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


def load_notifications() -> List[dict]:
    """Load notifications from JSON storage"""
    try:
        with open(STORAGE_PATH, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def save_notifications(notifications: List[dict]):
    """Save notifications to JSON storage"""
    with open(STORAGE_PATH, 'w') as f:
        json.dump(notifications, f, indent=2)


@router.get("/notifications", response_model=List[Notification])
async def get_notifications(
    x_user_role: Optional[str] = Header(None),
    x_user_name: Optional[str] = Header(None)
):
    """
    Get all notifications
    Can be filtered by user role and name on the frontend
    """
    notifications = load_notifications()
    return notifications


@router.post("/notifications", response_model=Notification)
async def create_notification(
    notification: NotificationCreate,
    x_user_role: Optional[str] = Header(None),
    x_user_name: Optional[str] = Header(None)
):
    """
    Create a new notification
    """
    notifications = load_notifications()
    
    # Generate unique ID
    notification_id = f"notif-{int(datetime.now().timestamp() * 1000)}"
    
    # Create notification object
    new_notification = {
        "id": notification_id,
        "type": notification.type,
        "workOrderId": notification.workOrderId,
        "workOrderTitle": notification.workOrderTitle,
        "message": notification.message,
        "recipientRole": notification.recipientRole,
        "recipientName": notification.recipientName,
        "isRead": notification.isRead,
        "createdAt": datetime.now().isoformat(),
        "triggeredBy": notification.triggeredBy
    }
    
    # Add to list
    notifications.append(new_notification)
    
    # Save
    save_notifications(notifications)
    
    return new_notification


@router.patch("/notifications/{notification_id}/read", response_model=Notification)
async def mark_notification_as_read(
    notification_id: str,
    x_user_role: Optional[str] = Header(None),
    x_user_name: Optional[str] = Header(None)
):
    """
    Mark a specific notification as read
    """
    notifications = load_notifications()
    
    # Find notification
    notification = next((n for n in notifications if n["id"] == notification_id), None)
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Mark as read
    notification["isRead"] = True
    
    # Save
    save_notifications(notifications)
    
    return notification


@router.patch("/notifications/read-all")
async def mark_all_notifications_as_read(
    x_user_role: Optional[str] = Header(None),
    x_user_name: Optional[str] = Header(None)
):
    """
    Mark all notifications as read for the current user
    Frontend should filter which notifications to mark based on user
    For now, we'll mark all as read
    """
    notifications = load_notifications()
    
    # Mark all as read
    for notification in notifications:
        # Could add filtering by recipientRole/recipientName here if needed
        notification["isRead"] = True
    
    # Save
    save_notifications(notifications)
    
    return {"message": "All notifications marked as read"}


@router.delete("/notifications/read")
async def delete_all_read_notifications(
    x_user_role: Optional[str] = Header(None),
    x_user_name: Optional[str] = Header(None)
):
    """
    Delete all notifications that have been read
    Only deletes read notifications, unread ones are kept
    """
    notifications = load_notifications()
    
    # Keep only unread notifications
    unread_notifications = [n for n in notifications if not n.get("isRead", False)]
    deleted_count = len(notifications) - len(unread_notifications)
    
    # Save
    save_notifications(unread_notifications)
    
    return {"message": f"{deleted_count} read notifications deleted"}


@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    x_user_role: Optional[str] = Header(None),
    x_user_name: Optional[str] = Header(None)
):
    """
    Delete a specific notification
    """
    notifications = load_notifications()
    
    # Find and remove notification
    notifications = [n for n in notifications if n["id"] != notification_id]
    
    # Save
    save_notifications(notifications)
    
    return {"message": "Notification deleted"}
