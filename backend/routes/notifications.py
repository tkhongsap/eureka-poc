"""
Notification Routes for CMMS System
Handles notification CRUD operations and workflow notifications
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import uuid

from db import get_db
from db.models import Notification as NotificationModel, WorkOrder as WorkOrderModel
from schemas import NotificationCreate, Notification

router = APIRouter(prefix="/api", tags=["Notifications"])


@router.get("/notifications", response_model=List[Notification])
async def get_notifications(
    x_user_role: Optional[str] = Header(None),
    x_user_name: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Get all notifications"""
    notifications = (
        db.query(NotificationModel).order_by(NotificationModel.created_at.desc()).all()
    )
    return [Notification.model_validate(n) for n in notifications]


@router.post("/notifications", response_model=Notification)
async def create_notification(
    notification: NotificationCreate,
    x_user_role: Optional[str] = Header(None),
    x_user_name: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Create a new notification"""
    # Use millisecond timestamp + random suffix to avoid primary key collisions
    # when multiple notifications are created very close together.
    notification_id = (
        f"notif-{int(datetime.now().timestamp() * 1000)}-{uuid.uuid4().hex[:6]}"
    )

    new_notification = NotificationModel(
        id=notification_id,
        type=notification.type,
        work_order_id=notification.workOrderId,
        work_order_title=notification.workOrderTitle,
        message=notification.message,
        recipient_role=notification.recipientRole,
        recipient_name=notification.recipientName,
        is_read=notification.isRead,
        triggered_by=notification.triggeredBy,
    )

    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)

    return Notification.model_validate(new_notification)


@router.patch("/notifications/{notification_id}/read", response_model=Notification)
async def mark_notification_as_read(
    notification_id: str,
    x_user_role: Optional[str] = Header(None),
    x_user_name: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Mark a specific notification as read"""
    notification = (
        db.query(NotificationModel)
        .filter(NotificationModel.id == notification_id)
        .first()
    )

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()
    db.refresh(notification)

    return Notification.model_validate(notification)


def is_notification_for_user(
    notification: NotificationModel, user_role: str, user_name: str
) -> bool:
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
    db: Session = Depends(get_db),
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
    db: Session = Depends(get_db),
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
    db: Session = Depends(get_db),
):
    """Delete a specific notification"""
    notification = (
        db.query(NotificationModel)
        .filter(NotificationModel.id == notification_id)
        .first()
    )

    if notification:
        db.delete(notification)
        db.commit()

    return {"message": "Notification deleted"}


@router.post("/notifications/check-reminders")
async def check_and_create_reminders(db: Session = Depends(get_db)):
    """
    Check all work orders with preferredDate and create reminder notifications
    for technicians when:
    - 7 days before preferred date
    - 3 days before preferred date

    This should be called periodically (e.g., once per day or on app load)
    """
    today = datetime.now().date()
    created_notifications = []

    # Get all work orders with preferredDate and assignedTo that are not completed/closed
    work_orders = (
        db.query(WorkOrderModel)
        .filter(
            WorkOrderModel.preferred_date.isnot(None),
            WorkOrderModel.assigned_to.isnot(None),
            WorkOrderModel.status.notin_(["Completed", "Closed", "Canceled"]),
        )
        .all()
    )

    for wo in work_orders:
        try:
            preferred_date = datetime.strptime(wo.preferred_date, "%Y-%m-%d").date()
            days_until = (preferred_date - today).days

            # Check for 7-day reminder
            if days_until == 7:
                # Check if reminder already exists for this WO and type
                existing = (
                    db.query(NotificationModel)
                    .filter(
                        NotificationModel.work_order_id == wo.id,
                        NotificationModel.type == "wo_reminder_7_days",
                    )
                    .first()
                )

                if not existing:
                    notification_id = (
                        f"notif-{int(datetime.now().timestamp() * 1000)}-7d"
                    )
                    formatted_date = preferred_date.strftime("%d/%m/%Y")

                    new_notification = NotificationModel(
                        id=notification_id,
                        type="wo_reminder_7_days",
                        work_order_id=wo.id,
                        work_order_title=wo.title,
                        message=f'งาน "{wo.title}" มีกำหนดนัดหมายในอีก 7 วัน ({formatted_date})',
                        recipient_role="Technician",
                        recipient_name=wo.assigned_to,
                        is_read=False,
                        triggered_by="System",
                    )
                    db.add(new_notification)
                    created_notifications.append(
                        {
                            "workOrderId": wo.id,
                            "type": "wo_reminder_7_days",
                            "assignedTo": wo.assigned_to,
                        }
                    )

            # Check for 3-day reminder
            elif days_until == 3:
                # Check if reminder already exists for this WO and type
                existing = (
                    db.query(NotificationModel)
                    .filter(
                        NotificationModel.work_order_id == wo.id,
                        NotificationModel.type == "wo_reminder_3_days",
                    )
                    .first()
                )

                if not existing:
                    notification_id = (
                        f"notif-{int(datetime.now().timestamp() * 1000)}-3d"
                    )
                    formatted_date = preferred_date.strftime("%d/%m/%Y")

                    new_notification = NotificationModel(
                        id=notification_id,
                        type="wo_reminder_3_days",
                        work_order_id=wo.id,
                        work_order_title=wo.title,
                        message=f'⚠️ งาน "{wo.title}" มีกำหนดนัดหมายในอีก 3 วัน ({formatted_date}) กรุณาเตรียมตัวให้พร้อม',
                        recipient_role="Technician",
                        recipient_name=wo.assigned_to,
                        is_read=False,
                        triggered_by="System",
                    )
                    db.add(new_notification)
                    created_notifications.append(
                        {
                            "workOrderId": wo.id,
                            "type": "wo_reminder_3_days",
                            "assignedTo": wo.assigned_to,
                        }
                    )

        except (ValueError, TypeError) as e:
            # Skip work orders with invalid date format
            continue

    # ==========================================
    # Check Due Date reminders (7, 3, 1 days)
    # ==========================================
    work_orders_with_due = (
        db.query(WorkOrderModel)
        .filter(
            WorkOrderModel.due_date.isnot(None),
            WorkOrderModel.assigned_to.isnot(None),
            WorkOrderModel.status.notin_(["Completed", "Closed", "Canceled"]),
        )
        .all()
    )

    for wo in work_orders_with_due:
        try:
            due_date = datetime.strptime(wo.due_date, "%Y-%m-%d").date()
            days_until_due = (due_date - today).days
            formatted_due = due_date.strftime("%d/%m/%Y")

            # Check for 7-day due date reminder
            if days_until_due == 7:
                existing = (
                    db.query(NotificationModel)
                    .filter(
                        NotificationModel.work_order_id == wo.id,
                        NotificationModel.type == "wo_due_7_days",
                    )
                    .first()
                )

                if not existing:
                    notification_id = (
                        f"notif-{int(datetime.now().timestamp() * 1000)}-due7d"
                    )
                    new_notification = NotificationModel(
                        id=notification_id,
                        type="wo_due_7_days",
                        work_order_id=wo.id,
                        work_order_title=wo.title,
                        message=f'📅 งาน "{wo.title}" จะถึงกำหนดส่งในอีก 7 วัน ({formatted_due})',
                        recipient_role="Technician",
                        recipient_name=wo.assigned_to,
                        is_read=False,
                        triggered_by="System",
                    )
                    db.add(new_notification)
                    created_notifications.append(
                        {
                            "workOrderId": wo.id,
                            "type": "wo_due_7_days",
                            "assignedTo": wo.assigned_to,
                        }
                    )

            # Check for 3-day due date reminder
            elif days_until_due == 3:
                existing = (
                    db.query(NotificationModel)
                    .filter(
                        NotificationModel.work_order_id == wo.id,
                        NotificationModel.type == "wo_due_3_days",
                    )
                    .first()
                )

                if not existing:
                    notification_id = (
                        f"notif-{int(datetime.now().timestamp() * 1000)}-due3d"
                    )
                    new_notification = NotificationModel(
                        id=notification_id,
                        type="wo_due_3_days",
                        work_order_id=wo.id,
                        work_order_title=wo.title,
                        message=f'⚠️ งาน "{wo.title}" จะถึงกำหนดส่งในอีก 3 วัน ({formatted_due}) กรุณาเร่งดำเนินการ',
                        recipient_role="Technician",
                        recipient_name=wo.assigned_to,
                        is_read=False,
                        triggered_by="System",
                    )
                    db.add(new_notification)
                    created_notifications.append(
                        {
                            "workOrderId": wo.id,
                            "type": "wo_due_3_days",
                            "assignedTo": wo.assigned_to,
                        }
                    )

            # Check for 1-day due date reminder
            elif days_until_due == 1:
                existing = (
                    db.query(NotificationModel)
                    .filter(
                        NotificationModel.work_order_id == wo.id,
                        NotificationModel.type == "wo_due_1_day",
                    )
                    .first()
                )

                if not existing:
                    notification_id = (
                        f"notif-{int(datetime.now().timestamp() * 1000)}-due1d"
                    )
                    new_notification = NotificationModel(
                        id=notification_id,
                        type="wo_due_1_day",
                        work_order_id=wo.id,
                        work_order_title=wo.title,
                        message=f'🚨 งาน "{wo.title}" จะถึงกำหนดส่งพรุ่งนี้ ({formatted_due}) กรุณาดำเนินการให้เสร็จ!',
                        recipient_role="Technician",
                        recipient_name=wo.assigned_to,
                        is_read=False,
                        triggered_by="System",
                    )
                    db.add(new_notification)
                    created_notifications.append(
                        {
                            "workOrderId": wo.id,
                            "type": "wo_due_1_day",
                            "assignedTo": wo.assigned_to,
                        }
                    )

        except (ValueError, TypeError) as e:
            # Skip work orders with invalid date format
            continue

    db.commit()

    return {
        "message": f"Created {len(created_notifications)} reminder notifications",
        "notifications": created_notifications,
    }
