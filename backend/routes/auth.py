"""
OAuth Authentication Routes
Supports both Google OAuth (for local dev) and Replit OAuth (for deployment)
Switch between providers by setting OAUTH_PROVIDER env var to "google" or "replit"
"""
import secrets
import hashlib
import base64
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
    IS_PRODUCTION, get_oauth_config
)
from db import get_db
from db.models import User as UserModel, OAuth as OAuthModel, OAuthState as OAuthStateModel
from utils import generate_id

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

session_serializer = URLSafeTimedSerializer(SESSION_SECRET)


def generate_pkce_pair():
    """Generate PKCE code verifier and challenge"""
    code_verifier = secrets.token_urlsafe(64)
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).rstrip(b'=').decode()
    return code_verifier, code_challenge


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


def cleanup_old_states(db: Session):
    """Clean up expired OAuth states from database"""
    try:
        db.query(OAuthStateModel).filter(
            OAuthStateModel.expires_at < datetime.now()
        ).delete()
        db.commit()
    except Exception as e:
        print(f"[Auth] Failed to cleanup old states: {e}")
        db.rollback()


def get_redirect_uri(request: Request) -> str:
    """Build the OAuth callback URI based on request
    
    For Replit deployments, we MUST use the correct public domain because:
    1. The Host header might be an internal .sisko.replit.dev domain
    2. Replit OIDC validates redirect_uri against registered domains
    3. The .replit.app domain is the public domain that OIDC accepts
    
    Priority order:
    1. OAUTH_REDIRECT_DOMAIN env var (manual override)
    2. .replit.app domain from REPLIT_DOMAINS
    3. REPLIT_DEV_DOMAIN (for dev environment)
    4. Host header (fallback)
    """
    from config import IS_REPLIT, IS_DEPLOYMENT, REPLIT_DOMAINS, REPLIT_DEV_DOMAIN, OAUTH_REDIRECT_DOMAIN
    
    host = request.headers.get("host", "localhost:8000")
    forwarded_proto = request.headers.get("x-forwarded-proto", "https")
    
    # On Replit, determine the correct domain for OAuth redirect
    if IS_REPLIT:
        replit_host = None
        
        # Priority 1: Manual override via OAUTH_REDIRECT_DOMAIN
        if OAUTH_REDIRECT_DOMAIN:
            replit_host = OAUTH_REDIRECT_DOMAIN
            print(f"[Auth] Using OAUTH_REDIRECT_DOMAIN: {replit_host}")
        
        # Priority 2: Find .replit.app domain from REPLIT_DOMAINS
        if not replit_host and REPLIT_DOMAINS:
            domains = [d.strip() for d in REPLIT_DOMAINS.split(",") if d.strip()]
            for domain in domains:
                if ".replit.app" in domain:
                    replit_host = domain
                    print(f"[Auth] Found .replit.app domain: {replit_host}")
                    break
            # Fallback to first domain
            if not replit_host and domains:
                replit_host = domains[0]
                print(f"[Auth] Using first domain from REPLIT_DOMAINS: {replit_host}")
        
        # Priority 3: Use REPLIT_DEV_DOMAIN for dev
        if not replit_host and REPLIT_DEV_DOMAIN:
            replit_host = REPLIT_DEV_DOMAIN
            print(f"[Auth] Using REPLIT_DEV_DOMAIN: {replit_host}")
            
        if replit_host:
            redirect_uri = f"https://{replit_host}/api/auth/callback"
            print(f"[Auth] Final Redirect URI: {redirect_uri}")
            return redirect_uri
        else:
            print(f"[Auth] Warning: No Replit domain found! Host header: {host}")
            print(f"[Auth] REPLIT_DOMAINS={REPLIT_DOMAINS}, REPLIT_DEV_DOMAIN={REPLIT_DEV_DOMAIN}")
    
    # Determine protocol for non-Replit environments
    if forwarded_proto:
        protocol = forwarded_proto
    elif "localhost" in host:
        protocol = "http"
    else:
        protocol = "https"
    
    # For local development, use frontend port for callback
    if "localhost:8000" in host:
        host = "localhost:5000"
    
    return f"{protocol}://{host}/api/auth/callback"


@router.get("/login")
async def login(request: Request, db: Session = Depends(get_db)):
    """Initiate OAuth login flow (Google or Replit based on config)"""
    oauth_config = get_oauth_config()
    
    print(f"[Auth] Starting OAuth login with provider: {oauth_config['provider']}")
    print(f"[Auth] Client ID: {oauth_config['client_id'][:20]}..." if oauth_config['client_id'] else "[Auth] Client ID: NOT SET")
    
    if not oauth_config["client_id"]:
        raise HTTPException(
            status_code=500, 
            detail=f"{oauth_config['provider'].upper()}_CLIENT_ID not configured. "
                   f"Please set the environment variable."
        )
    
    # Generate state and nonce for security
    state = secrets.token_urlsafe(32)
    nonce = secrets.token_urlsafe(32)
    code_verifier = None
    code_challenge = None
    
    # Generate PKCE if required (Replit uses PKCE)
    if oauth_config["use_pkce"]:
        code_verifier, code_challenge = generate_pkce_pair()
    
    # Store state in database (survives autoscale instances)
    oauth_state = OAuthStateModel(
        state=state,
        nonce=nonce,
        code_verifier=code_verifier,
        provider=oauth_config["provider"],
        expires_at=datetime.now() + timedelta(minutes=10)
    )
    db.add(oauth_state)
    db.commit()
    
    # Cleanup old states periodically
    cleanup_old_states(db)
    
    redirect_uri = get_redirect_uri(request)
    print(f"[Auth] Redirect URI: {redirect_uri}")
    
    # Build authorization URL
    params = {
        "client_id": oauth_config["client_id"],
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": oauth_config["scopes"],
        "state": state,
        "nonce": nonce,
    }
    
    # Add PKCE challenge if required
    if oauth_config["use_pkce"]:
        params["code_challenge"] = code_challenge
        params["code_challenge_method"] = "S256"
    
    # Provider-specific parameters
    if oauth_config["provider"] == "google":
        params["access_type"] = "offline"  # Get refresh token
        params["prompt"] = "consent"
    else:
        params["prompt"] = "login consent"
    
    auth_url = f"{oauth_config['auth_endpoint']}?{urlencode(params)}"
    print(f"[Auth] Authorization URL: {auth_url[:100]}...")
    return RedirectResponse(url=auth_url)


@router.get("/callback")
async def callback(
    request: Request,
    code: str = None,
    state: str = None,
    error: str = None,
    error_description: str = None,
    db: Session = Depends(get_db)
):
    """Handle OAuth callback from provider"""
    print(f"[Auth Callback] Received callback - code: {bool(code)}, state: {bool(state)}, error: {error}")
    
    if error:
        print(f"[Auth Callback] OAuth error: {error} - {error_description}")
        return RedirectResponse(url=f"/login?error={error}")
    
    if not code or not state:
        print(f"[Auth Callback] Missing params - code: {bool(code)}, state: {bool(state)}")
        return RedirectResponse(url="/login?error=missing_params")
    
    # Look up state from database (works across autoscale instances)
    state_record = db.query(OAuthStateModel).filter(
        OAuthStateModel.state == state,
        OAuthStateModel.expires_at > datetime.now()
    ).first()
    
    if not state_record:
        print(f"[Auth Callback] Invalid state - state not found in database or expired")
        return RedirectResponse(url="/login?error=invalid_state")
    
    # Extract state data and delete the record
    code_verifier = state_record.code_verifier
    provider = state_record.provider
    db.delete(state_record)
    db.commit()
    
    oauth_config = get_oauth_config()
    
    redirect_uri = get_redirect_uri(request)
    print(f"[Auth Callback] Using redirect_uri: {redirect_uri}")
    
    # Exchange code for tokens
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "client_id": oauth_config["client_id"],
    }
    
    # Add client secret for Google (Replit uses PKCE instead)
    if oauth_config["client_secret"]:
        token_data["client_secret"] = oauth_config["client_secret"]
    
    # Add PKCE verifier if used
    if oauth_config["use_pkce"] and code_verifier:
        token_data["code_verifier"] = code_verifier
        print(f"[Auth Callback] Using PKCE verifier")
    
    print(f"[Auth Callback] Exchanging code for tokens at: {oauth_config['token_endpoint']}")
    
    async with httpx.AsyncClient() as client:
        try:
            token_response = await client.post(
                oauth_config["token_endpoint"],
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            print(f"[Auth Callback] Token response status: {token_response.status_code}")
            
            if token_response.status_code != 200:
                print(f"[Auth Callback] Token exchange failed: {token_response.text}")
                return RedirectResponse(url="/login?error=token_exchange_failed")
            
            tokens = token_response.json()
            print(f"[Auth Callback] Received tokens: {list(tokens.keys())}")
        except Exception as e:
            print(f"[Auth Callback] Token request error: {e}")
            return RedirectResponse(url="/login?error=token_error")
    
    # Get user info
    access_token = tokens.get("access_token")
    if not access_token:
        print("[Auth Callback] No access token in response")
        return RedirectResponse(url="/login?error=no_access_token")
    
    # For Replit, extract user claims from ID token directly (not userinfo endpoint)
    provider = oauth_config["provider"]
    
    if provider == "replit":
        id_token = tokens.get("id_token")
        if not id_token:
            print("[Auth Callback] No ID token in response")
            return RedirectResponse(url="/login?error=no_id_token")
        
        try:
            # Decode ID token without signature verification (already validated by OAuth flow)
            userinfo = jwt.decode(id_token, options={"verify_signature": False})
            print(f"[Auth Callback] Replit user claims: {userinfo}")
        except Exception as e:
            print(f"[Auth Callback] ID token decode error: {e}")
            return RedirectResponse(url="/login?error=token_decode_error")
    else:
        # For Google, use userinfo endpoint
        async with httpx.AsyncClient() as client:
            try:
                userinfo_response = await client.get(
                    oauth_config["userinfo_endpoint"],
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                
                if userinfo_response.status_code != 200:
                    print(f"Userinfo failed: {userinfo_response.text}")
                    return RedirectResponse(url="/login?error=userinfo_failed")
                
                userinfo = userinfo_response.json()
            except Exception as e:
                print(f"Userinfo request error: {e}")
                return RedirectResponse(url="/login?error=userinfo_error")
    
    # Extract user data (handle differences between Google and Replit)
    if provider == "google":
        oauth_user_id = userinfo.get("sub")
        email = userinfo.get("email")
        first_name = userinfo.get("given_name")
        last_name = userinfo.get("family_name")
        profile_image_url = userinfo.get("picture")
        name = userinfo.get("name") or f"{first_name or ''} {last_name or ''}".strip()
    else:  # replit
        # Replit OIDC claims: sub, username, first_name, last_name, profile_image_url, email
        oauth_user_id = userinfo.get("sub")
        email = userinfo.get("email")
        first_name = userinfo.get("first_name")
        last_name = userinfo.get("last_name")
        profile_image_url = userinfo.get("profile_image_url")
        username = userinfo.get("username")
        # Build name from first_name + last_name, fallback to username
        name = f"{first_name or ''} {last_name or ''}".strip()
        if not name:
            name = username
    
    print(f"[Auth Callback] Extracted user data - id: {oauth_user_id}, email: {email}, name: {name}")
    
    if not name:
        name = email or f"User {oauth_user_id}"
    
    # Find or create user
    # First try to find by OAuth provider ID
    if provider == "google":
        user = db.query(UserModel).filter(UserModel.google_user_id == oauth_user_id).first()
    else:
        user = db.query(UserModel).filter(UserModel.replit_user_id == oauth_user_id).first()
    
    if not user:
        # Try to find by email
        user = db.query(UserModel).filter(UserModel.email == email).first()
        if user:
            # Link OAuth provider to existing user
            if provider == "google":
                user.google_user_id = oauth_user_id
            else:
                user.replit_user_id = oauth_user_id
            user.first_name = first_name
            user.last_name = last_name
            if profile_image_url:
                user.avatar_url = profile_image_url
        else:
            # Create new user
            user = UserModel(
                id=generate_id("USR"),
                email=email,
                name=name,
                first_name=first_name,
                last_name=last_name,
                avatar_url=profile_image_url,
                user_role="Requester",  # Default role for new users
                status="active",
                settings={},
            )
            if provider == "google":
                user.google_user_id = oauth_user_id
            else:
                user.replit_user_id = oauth_user_id
            db.add(user)
    
    # Update last login
    user.last_login_at = datetime.now()
    if profile_image_url and not user.avatar_url:
        user.avatar_url = profile_image_url
    
    # Store OAuth tokens
    expires_at = None
    if tokens.get("expires_in"):
        expires_at = datetime.now() + timedelta(seconds=tokens["expires_in"])
    
    oauth = db.query(OAuthModel).filter(
        OAuthModel.user_id == user.id,
        OAuthModel.provider == provider
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
            provider=provider,
            access_token=tokens.get("access_token"),
            refresh_token=tokens.get("refresh_token"),
            token_type=tokens.get("token_type"),
            expires_at=expires_at,
        )
        db.add(oauth)
    
    db.commit()
    db.refresh(user)
    
    # Create session
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
    """Logout user and clear session"""
    session_token = request.cookies.get(SESSION_COOKIE_NAME)
    oauth_config = get_oauth_config()
    
    if session_token:
        session_data = verify_session_token(session_token)
        if session_data:
            user_id = session_data["user_id"]
            # Delete OAuth tokens for this provider
            oauth = db.query(OAuthModel).filter(
                OAuthModel.user_id == user_id,
                OAuthModel.provider == oauth_config["provider"]
            ).first()
            if oauth:
                db.delete(oauth)
                db.commit()
    
    # Build logout response
    response_data = {"message": "Logged out successfully"}
    
    # Provider-specific logout
    if oauth_config["provider"] == "replit":
        end_session_url = f"{oauth_config['issuer_url']}/session/end"
        params = {
            "client_id": oauth_config["client_id"],
            "post_logout_redirect_uri": "/login",
        }
        response_data["redirect_url"] = f"{end_session_url}?{urlencode(params)}"
    else:
        # Google doesn't have a standard logout endpoint
        response_data["redirect_url"] = "/login"
    
    response = JSONResponse(response_data)
    response.delete_cookie(key=SESSION_COOKIE_NAME, path="/")
    
    return response


@router.get("/provider")
async def get_provider():
    """Get current OAuth provider configuration"""
    oauth_config = get_oauth_config()
    from config import IS_REPLIT, IS_DEPLOYMENT, REPLIT_DOMAINS, REPL_ID, get_replit_domain
    
    return {
        "provider": oauth_config["provider"],
        "configured": bool(oauth_config["client_id"]),
        "is_replit": IS_REPLIT,
        "is_deployment": IS_DEPLOYMENT,
        "client_id": REPL_ID[:20] + "..." if REPL_ID and len(REPL_ID) > 20 else REPL_ID,
        "replit_domains": REPLIT_DOMAINS,
        "redirect_domain": get_replit_domain(),
        "auth_endpoint": oauth_config["auth_endpoint"],
    }
