import os
import secrets
import uuid
from datetime import datetime, timedelta
from urllib.parse import urlencode

import httpx
import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from db import get_db
from db.models import User as UserModel, OAuth as OAuthModel
from utils import generate_id

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

ISSUER_URL = os.environ.get("ISSUER_URL", "https://replit.com/oidc")
REPL_ID = os.environ.get("REPL_ID", "")

PKCE_VERIFIERS = {}


def generate_pkce_pair():
    """Generate PKCE code verifier and challenge"""
    code_verifier = secrets.token_urlsafe(64)
    import hashlib
    import base64
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).rstrip(b'=').decode()
    return code_verifier, code_challenge


@router.get("/login")
async def login(request: Request):
    """Initiate Replit OAuth login flow"""
    if not REPL_ID:
        raise HTTPException(status_code=500, detail="REPL_ID environment variable not set")
    
    state = secrets.token_urlsafe(32)
    code_verifier, code_challenge = generate_pkce_pair()
    
    PKCE_VERIFIERS[state] = {
        "verifier": code_verifier,
        "created_at": datetime.now()
    }
    
    for old_state in list(PKCE_VERIFIERS.keys()):
        if (datetime.now() - PKCE_VERIFIERS[old_state]["created_at"]).seconds > 600:
            del PKCE_VERIFIERS[old_state]
    
    host = request.headers.get("host", "")
    protocol = "https" if "replit" in host or request.headers.get("x-forwarded-proto") == "https" else "http"
    redirect_uri = f"{protocol}://{host}/api/auth/callback"
    
    params = {
        "client_id": REPL_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid profile email offline_access",
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "prompt": "login consent",
    }
    
    auth_url = f"{ISSUER_URL}/auth?{urlencode(params)}"
    return RedirectResponse(url=auth_url)


@router.get("/callback")
async def callback(
    request: Request,
    code: str = None,
    state: str = None,
    error: str = None,
    db: Session = Depends(get_db)
):
    """Handle OAuth callback from Replit"""
    if error:
        return RedirectResponse(url=f"/login?error={error}")
    
    if not code or not state:
        return RedirectResponse(url="/login?error=missing_params")
    
    if state not in PKCE_VERIFIERS:
        return RedirectResponse(url="/login?error=invalid_state")
    
    code_verifier = PKCE_VERIFIERS.pop(state)["verifier"]
    
    host = request.headers.get("host", "")
    protocol = "https" if "replit" in host or request.headers.get("x-forwarded-proto") == "https" else "http"
    redirect_uri = f"{protocol}://{host}/api/auth/callback"
    
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "client_id": REPL_ID,
        "code_verifier": code_verifier,
    }
    
    async with httpx.AsyncClient() as client:
        try:
            token_response = await client.post(
                f"{ISSUER_URL}/token",
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if token_response.status_code != 200:
                return RedirectResponse(url=f"/login?error=token_exchange_failed")
            
            tokens = token_response.json()
        except Exception as e:
            return RedirectResponse(url=f"/login?error=token_error")
    
    try:
        id_token = tokens.get("id_token")
        claims = jwt.decode(id_token, options={"verify_signature": False})
    except Exception as e:
        return RedirectResponse(url=f"/login?error=invalid_token")
    
    replit_user_id = claims.get("sub")
    email = claims.get("email")
    first_name = claims.get("first_name")
    last_name = claims.get("last_name")
    profile_image_url = claims.get("profile_image_url")
    
    name = f"{first_name or ''} {last_name or ''}".strip() or email or f"User {replit_user_id}"
    
    user = db.query(UserModel).filter(UserModel.replit_user_id == replit_user_id).first()
    
    if not user:
        user = db.query(UserModel).filter(UserModel.email == email).first()
        if user:
            user.replit_user_id = replit_user_id
            user.first_name = first_name
            user.last_name = last_name
            if profile_image_url:
                user.avatar_url = profile_image_url
        else:
            user = UserModel(
                id=generate_id("USR"),
                replit_user_id=replit_user_id,
                email=email,
                name=name,
                first_name=first_name,
                last_name=last_name,
                avatar_url=profile_image_url,
                user_role="Requester",
                status="active",
                settings={},
            )
            db.add(user)
    
    user.last_login_at = datetime.now()
    if profile_image_url and not user.avatar_url:
        user.avatar_url = profile_image_url
    
    expires_at = None
    if tokens.get("expires_in"):
        expires_at = datetime.now() + timedelta(seconds=tokens["expires_in"])
    
    oauth = db.query(OAuthModel).filter(
        OAuthModel.user_id == user.id,
        OAuthModel.provider == "replit"
    ).first()
    
    if oauth:
        oauth.access_token = tokens.get("access_token")
        oauth.refresh_token = tokens.get("refresh_token")
        oauth.token_type = tokens.get("token_type")
        oauth.expires_at = expires_at
        oauth.updated_at = datetime.now()
    else:
        oauth = OAuthModel(
            id=generate_id("OA"),
            user_id=user.id,
            provider="replit",
            access_token=tokens.get("access_token"),
            refresh_token=tokens.get("refresh_token"),
            token_type=tokens.get("token_type"),
            expires_at=expires_at,
        )
        db.add(oauth)
    
    db.commit()
    db.refresh(user)
    
    session_token = secrets.token_urlsafe(32)
    
    user_data = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "user_role": user.user_role,
        "role": user.role,
        "session_token": session_token,
    }
    
    import json
    import base64
    user_json = json.dumps(user_data)
    user_encoded = base64.urlsafe_b64encode(user_json.encode()).decode()
    
    response = RedirectResponse(url=f"/auth-success?user={user_encoded}")
    return response


@router.get("/me")
async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get current authenticated user info"""
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "user_role": user.user_role,
        "role": user.role,
        "first_name": user.first_name,
        "last_name": user.last_name,
    }


@router.post("/logout")
async def logout(request: Request, db: Session = Depends(get_db)):
    """Logout user and revoke tokens"""
    user_id = request.headers.get("X-User-Id")
    
    if user_id:
        oauth = db.query(OAuthModel).filter(
            OAuthModel.user_id == user_id,
            OAuthModel.provider == "replit"
        ).first()
        if oauth:
            db.delete(oauth)
            db.commit()
    
    end_session_url = f"{ISSUER_URL}/session/end"
    params = {
        "client_id": REPL_ID,
        "post_logout_redirect_uri": "/login",
    }
    
    return {
        "message": "Logged out successfully",
        "redirect_url": f"{end_session_url}?{urlencode(params)}"
    }
