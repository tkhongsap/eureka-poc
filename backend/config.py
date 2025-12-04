"""Centralized configuration for the backend application"""
import os
import secrets

# Session Configuration
SESSION_SECRET = os.environ.get("SESSION_SECRET", secrets.token_urlsafe(32))
SESSION_COOKIE_NAME = "eureka_session"
SESSION_MAX_AGE = 60 * 60 * 24 * 7  # 7 days

# OAuth Provider Selection: "google" or "replit"
# Set OAUTH_PROVIDER env var to switch between providers
OAUTH_PROVIDER = os.environ.get("OAUTH_PROVIDER", "google")

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_ISSUER_URL = "https://accounts.google.com"

# Replit OAuth Configuration (for deployment on Replit)
REPLIT_ISSUER_URL = os.environ.get("ISSUER_URL", "https://replit.com/oidc")
REPL_ID = os.environ.get("REPL_ID", "")

# Environment Detection
IS_PRODUCTION = os.environ.get("REPL_SLUG") is not None or os.environ.get("REPLIT_DEPLOYMENT") is not None

# Auto-detect provider based on environment
def get_oauth_config():
    """Get OAuth configuration based on selected provider"""
    if OAUTH_PROVIDER == "replit" or (IS_PRODUCTION and REPL_ID):
        return {
            "provider": "replit",
            "client_id": REPL_ID,
            "client_secret": None,  # Replit uses PKCE, no secret needed
            "issuer_url": REPLIT_ISSUER_URL,
            "auth_endpoint": f"{REPLIT_ISSUER_URL}/auth",
            "token_endpoint": f"{REPLIT_ISSUER_URL}/token",
            "userinfo_endpoint": f"{REPLIT_ISSUER_URL}/me",  # Replit uses /me not /userinfo
            "scopes": "openid profile email offline_access",
            "use_pkce": True,
        }
    else:
        return {
            "provider": "google",
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "issuer_url": GOOGLE_ISSUER_URL,
            "auth_endpoint": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_endpoint": "https://oauth2.googleapis.com/token",
            "userinfo_endpoint": "https://www.googleapis.com/oauth2/v3/userinfo",
            "scopes": "openid email profile",
            "use_pkce": False,
        }
