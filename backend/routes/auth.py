import secrets
from datetime import datetime, timedelta
from urllib.parse import urlencode
from typing import Optional

import httpx
import jwt
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from sqlalchemy.orm import Session

from config import (
    SESSION_SECRET, SESSION_COOKIE_NAME, SESSION_MAX_AGE,
    ISSUER_URL, REPL_ID, IS_PRODUCTION
)
from db import get_db
from db.models import User as UserModel, OAuth as OAuthModel
from utils import generate_id

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

PKCE_VERIFIERS = {}
JWKS_CACHE = {"keys": None, "fetched_at": None}

session_serializer = URLSafeTimedSerializer(SESSION_SECRET)


def generate_pkce_pair():
    """Generate PKCE code verifier and challenge"""
    code_verifier = secrets.token_urlsafe(64)
    import hashlib
    import base64
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).rstrip(b'=').decode()
    return code_verifier, code_challenge


async def get_jwks():
    """Fetch and cache JWKS from Replit OIDC provider"""
    global JWKS_CACHE
    
    if JWKS_CACHE["keys"] and JWKS_CACHE["fetched_at"]:
        age = (datetime.now() - JWKS_CACHE["fetched_at"]).seconds
        if age < 3600:
            return JWKS_CACHE["keys"]
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{ISSUER_URL}/.well-known/jwks.json")
            if response.status_code == 200:
                JWKS_CACHE["keys"] = response.json().get("keys", [])
                JWKS_CACHE["fetched_at"] = datetime.now()
                return JWKS_CACHE["keys"]
        except Exception:
            pass
    
    return JWKS_CACHE.get("keys", [])


async def verify_id_token(id_token: str, expected_nonce: str = None) -> dict:
    """Verify ID token signature and claims"""
    try:
        unverified_header = jwt.get_unverified_header(id_token)
        kid = unverified_header.get("kid")
        
        jwks = await get_jwks()
        public_key = None
        
        for key in jwks:
            if key.get("kid") == kid:
                from jwt.algorithms import RSAAlgorithm
                public_key = RSAAlgorithm.from_jwk(key)
                break
        
        if not public_key:
            raise ValueError("Unable to find matching key in JWKS")
        
        claims = jwt.decode(
            id_token,
            public_key,
            algorithms=["RS256"],
            audience=REPL_ID,
            issuer=ISSUER_URL,
            options={
                "verify_signature": True,
                "verify_aud": True,
                "verify_iss": True,
                "verify_exp": True,
            }
        )
        
        if expected_nonce and claims.get("nonce") != expected_nonce:
            raise ValueError("Nonce mismatch")
        
        return claims
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidAudienceError:
        raise ValueError("Invalid audience")
    except jwt.InvalidIssuerError:
        raise ValueError("Invalid issuer")
    except Exception as e:
        raise ValueError(f"Token verification failed: {str(e)}")


def create_session_token(user_id: str, user_data: dict) -> str:
    """Create a signed session token"""
    session_data = {
        "user_id": user_id,
        "user_data": user_data,
        "created_at": datetime.now().isoformat(),
    }
    return session_serializer.dumps(session_data)


def verify_session_token(token: str) -> Optional[dict]:
    """Verify and decode a session token"""
    try:
        session_data = session_serializer.loads(token, max_age=SESSION_MAX_AGE)
        return session_data
    except (BadSignature, SignatureExpired):
        return None


@router.get("/login")
async def login(request: Request):
    """Initiate Replit OAuth login flow"""
    if not REPL_ID:
        raise HTTPException(status_code=500, detail="REPL_ID environment variable not set")
    
    state = secrets.token_urlsafe(32)
    nonce = secrets.token_urlsafe(32)
    code_verifier, code_challenge = generate_pkce_pair()
    
    PKCE_VERIFIERS[state] = {
        "verifier": code_verifier,
        "nonce": nonce,
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
        "nonce": nonce,
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
    
    pkce_data = PKCE_VERIFIERS.pop(state)
    code_verifier = pkce_data["verifier"]
    expected_nonce = pkce_data["nonce"]
    
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
        if not id_token:
            return RedirectResponse(url="/login?error=no_id_token")
        
        claims = await verify_id_token(id_token, expected_nonce)
            
    except ValueError as e:
        print(f"Token verification failed: {e}")
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
    
    user_data = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "user_role": user.user_role,
        "role": user.role,
    }
    session_token = create_session_token(user.id, user_data)
    
    response = RedirectResponse(url="/auth-success")
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        max_age=SESSION_MAX_AGE,
        path="/",
    )
    
    return response


@router.get("/me")
async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get current authenticated user info from session"""
    session_token = request.cookies.get(SESSION_COOKIE_NAME)
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_data = verify_session_token(session_token)
    if not session_data:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    
    user = db.query(UserModel).filter(UserModel.id == session_data["user_id"]).first()
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
    """Logout user, clear session, and revoke tokens"""
    session_token = request.cookies.get(SESSION_COOKIE_NAME)
    
    if session_token:
        session_data = verify_session_token(session_token)
        if session_data:
            user_id = session_data["user_id"]
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
    
    response = JSONResponse({
        "message": "Logged out successfully",
        "redirect_url": f"{end_session_url}?{urlencode(params)}"
    })
    
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
    )
    
    return response
