from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from schemas import UserCreate, User, UserUpdate
from db import get_db
from db.models import User as UserModel
from utils import generate_id

router = APIRouter(prefix="/api/users", tags=["Users"])


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
async def list_users(db: Session = Depends(get_db)):
    """List all users"""
    users = db.query(UserModel).order_by(UserModel.created_at.desc()).all()
    return [User.model_validate(u) for u in users]


@router.get("/{user_id}", response_model=User)
async def get_user(user_id: str, db: Session = Depends(get_db)):
    """Get a specific user"""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return User.model_validate(user)


@router.put("/{user_id}", response_model=User)
async def update_user(user_id: str, updates: UserUpdate, db: Session = Depends(get_db)):
    """Update user"""
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


@router.delete("/{user_id}")
async def delete_user(user_id: str, db: Session = Depends(get_db)):
    """Delete a user"""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()

    if user:
        db.delete(user)
        db.commit()

    return {"message": "User deleted"}
