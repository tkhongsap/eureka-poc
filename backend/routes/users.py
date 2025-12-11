from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm.attributes import flag_modified

from schemas import UserCreate, User, UserUpdate, RoleUpdateRequest
from schemas.user import NotificationPreferences, ProfileUpdate
from db import get_db
from db.models import User as UserModel
from db.models import AuditLog
from utils import generate_id
from utils.auth import require_admin, get_current_user
from utils.workflow_rules import UserRole

router = APIRouter(prefix="/api/users", tags=["Users"])

VALID_ROLES = {role.value for role in UserRole}


# ============== Profile API ==============

@router.get("/me", response_model=User)
async def get_my_profile(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Get current user's profile"""
    return current_user


@router.put("/me", response_model=User)
async def update_my_profile(
    profile: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Update current user's profile"""
    # Only update fields that were provided
    if profile.name is not None:
        current_user.name = profile.name
    if profile.phone is not None:
        current_user.phone = profile.phone
    if profile.avatar_url is not None:
        current_user.avatar_url = profile.avatar_url
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


# ============== Preferences API ==============

@router.get("/me/preferences", response_model=NotificationPreferences)
async def get_my_preferences(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Get current user's notification preferences"""
    settings = current_user.settings or {}
    notifications = settings.get("notifications", {})
    
    # Return with defaults
    return NotificationPreferences(
        wo_assigned=notifications.get("wo_assigned", True),
        wo_status_changed=notifications.get("wo_status_changed", True),
        wo_overdue=notifications.get("wo_overdue", True),
        wo_due_soon=notifications.get("wo_due_soon", True),
        email_digest=notifications.get("email_digest", False),
    )


@router.put("/me/preferences", response_model=NotificationPreferences)
async def update_my_preferences(
    preferences: NotificationPreferences,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Update current user's notification preferences"""
    # Get existing settings or create empty dict
    settings = dict(current_user.settings) if current_user.settings else {}
    
    # Update notifications section
    settings["notifications"] = preferences.model_dump()
    
    # Save to database - must reassign for SQLAlchemy to detect change
    current_user.settings = settings
    flag_modified(current_user, "settings")
    db.commit()
    db.refresh(current_user)
    
    return preferences


@router.post("", response_model=User)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    user_id = generate_id("USR")

    new_user = UserModel(
        id=user_id,
        email=user.email,
        password_hash=user.password_hash,
        name=user.name,
        phone=user.phone,
        avatar_url=user.avatar_url,
        employee_id=user.employee_id,
        job_title=user.job_title,
        role=user.role,
        user_role=user.userRole,
        status="active",
        settings={},
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except IntegrityError as e:
        db.rollback()
        if "email" in str(e.orig).lower() or "unique" in str(e.orig).lower():
            raise HTTPException(
                status_code=400, detail="User with this email already exists"
            )
        raise HTTPException(status_code=400, detail="Database integrity error")

    return User.model_validate(new_user)


@router.get("", response_model=List[User])
async def list_users(
    role: str = None,
    user_role: str = None,
    db: Session = Depends(get_db)
):
    """List all users, optionally filtered by role or user_role"""
    query = db.query(UserModel)
    
    if role:
        query = query.filter(UserModel.role == role)
    if user_role:
        query = query.filter(UserModel.user_role == user_role)
    
    users = query.order_by(UserModel.created_at.desc()).all()
    return [User.model_validate(u) for u in users]


@router.get("/by-role/{user_role}", response_model=List[User])
async def get_users_by_role(user_role: str, db: Session = Depends(get_db)):
    """Get all users with a specific user_role (Admin, Head Technician, Technician, Requester)"""
    users = db.query(UserModel).filter(UserModel.user_role == user_role).all()
    return [User.model_validate(u) for u in users]


@router.get("/team/{team_id}/head-technician", response_model=User)
async def get_team_head_technician(team_id: str, db: Session = Depends(get_db)):
    """Get the Head Technician for a specific team"""
    head_tech = db.query(UserModel).filter(
        UserModel.team_id == team_id,
        UserModel.user_role == "Head Technician"
    ).first()
    
    if not head_tech:
        raise HTTPException(status_code=404, detail=f"No Head Technician found for team {team_id}")
    
    return User.model_validate(head_tech)


@router.get("/team/{team_id}/members", response_model=List[User])
async def get_team_members(team_id: str, db: Session = Depends(get_db)):
    """Get all members of a specific team"""
    members = db.query(UserModel).filter(UserModel.team_id == team_id).all()
    return [User.model_validate(u) for u in members]


@router.get("/{user_id}", response_model=User)
async def get_user(user_id: str, db: Session = Depends(get_db)):
    """Get a specific user"""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return User.model_validate(user)


@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    updates: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Update user profile (role changes use /role endpoint)"""

    # Only allow self-updates unless Admin
    if user_id != current_user.id and current_user.user_role != "Admin":
        raise HTTPException(
            status_code=403, detail="You can only update your own profile"
        )

    # Route all role changes to the dedicated endpoint
    if updates.userRole is not None:
        raise HTTPException(
            status_code=400,
            detail="Use PUT /api/users/{user_id}/role to change roles",
        )

    user = db.query(UserModel).filter(UserModel.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if updates.email is not None:
        user.email = updates.email
    if updates.password_hash is not None:
        user.password_hash = updates.password_hash
    if updates.name is not None:
        user.name = updates.name
    if updates.phone is not None:
        user.phone = updates.phone
    if updates.avatar_url is not None:
        user.avatar_url = updates.avatar_url
    if updates.employee_id is not None:
        user.employee_id = updates.employee_id
    if updates.job_title is not None:
        user.job_title = updates.job_title
    if updates.role is not None:
        user.role = updates.role
    if updates.userRole is not None:
        user.user_role = updates.userRole
    if updates.teamId is not None:
        user.team_id = updates.teamId
    if updates.status is not None:
        user.status = updates.status
    if updates.settings is not None:
        user.settings = updates.settings

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError as e:
        db.rollback()
        if "email" in str(e.orig).lower() or "unique" in str(e.orig).lower():
            raise HTTPException(
                status_code=400, detail="User with this email already exists"
            )
        raise HTTPException(status_code=400, detail="Database integrity error")

    return User.model_validate(user)


@router.put("/{user_id}/role", response_model=User)
async def update_user_role(
    user_id: str,
    payload: RoleUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_admin),
):
    """Update user's permission role - Admin only"""

    if payload.userRole not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Must be one of: {', '.join(sorted(VALID_ROLES))}",
        )

    if user_id == current_user.id and payload.userRole != "Admin":
        raise HTTPException(
            status_code=400,
            detail="You cannot demote yourself. Ask another Admin to change your role.",
        )

    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_role = user.user_role
    user.user_role = payload.userRole

    audit = AuditLog(
        id=generate_id("AUD"),
        action="role_change",
        actor_id=current_user.id,
        target_user_id=user_id,
        old_value=old_role,
        new_value=payload.userRole,
        reason=payload.reason,
        ip_address=request.client.host if request.client else None,
    )
    db.add(audit)

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to update role")

    return User.model_validate(user)


@router.delete("/{user_id}")
async def delete_user(user_id: str, db: Session = Depends(get_db)):
    """Delete a user"""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()

    if user:
        db.delete(user)
        db.commit()

    return {"message": "User deleted"}
