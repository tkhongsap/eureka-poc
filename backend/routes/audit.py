from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db import get_db
from db.models import AuditLog
from db.models import User as UserModel
from utils.auth import require_admin


router = APIRouter(prefix="/api/audit", tags=["Audit"])


@router.get("/logs")
async def list_audit_logs(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_admin),
):
    """List recent audit logs (Admin only)"""
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(200).all()
    return [
        {
            "id": log.id,
            "action": log.action,
            "actor_id": log.actor_id,
            "target_user_id": log.target_user_id,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "reason": log.reason,
            "ip_address": log.ip_address,
            "created_at": log.created_at,
        }
        for log in logs
    ]
