"""Authentication utilities and dependencies for FastAPI routes"""
from typing import Optional

from fastapi import Depends, HTTPException, Request
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from sqlalchemy.orm import Session

from config import SESSION_SECRET, SESSION_COOKIE_NAME, SESSION_MAX_AGE
from db import get_db
from db.models import User as UserModel

session_serializer = URLSafeTimedSerializer(SESSION_SECRET)


def verify_session_token(token: str) -> Optional[dict]:
    """Verify and decode a session token"""
    try:
        session_data = session_serializer.loads(token, max_age=SESSION_MAX_AGE)
        return session_data
    except (BadSignature, SignatureExpired):
        return None


def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[UserModel]:
    """Get current user from session cookie (optional - returns None if not authenticated)"""
    session_token = request.cookies.get(SESSION_COOKIE_NAME)
    if not session_token:
        return None
    
    session_data = verify_session_token(session_token)
    if not session_data:
        return None
    
    user = db.query(UserModel).filter(UserModel.id == session_data["user_id"]).first()
    return user


def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> UserModel:
    """Get current user from session cookie (required - raises 401 if not authenticated)"""
    user = get_current_user_optional(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def require_role(*allowed_roles: str):
    """Dependency factory that requires specific roles"""
    def dependency(
        current_user: UserModel = Depends(get_current_user)
    ) -> UserModel:
        user_role = str(current_user.user_role) if current_user.user_role else ""
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return dependency


def require_admin(current_user: UserModel = Depends(get_current_user)) -> UserModel:
    """Require Admin role"""
    user_role = str(current_user.user_role) if current_user.user_role else ""
    if user_role != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def require_technician_or_above(current_user: UserModel = Depends(get_current_user)) -> UserModel:
    """Require Technician, Head Technician, or Admin role"""
    user_role = str(current_user.user_role) if current_user.user_role else ""
    if user_role not in ["Technician", "Head Technician", "Admin"]:
        raise HTTPException(status_code=403, detail="Technician or higher access required")
    return current_user
