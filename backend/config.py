"""Centralized configuration for the backend application"""
import os
import secrets

SESSION_SECRET = os.environ.get("SESSION_SECRET", secrets.token_urlsafe(32))
SESSION_COOKIE_NAME = "eureka_session"
SESSION_MAX_AGE = 60 * 60 * 24 * 7  # 7 days

ISSUER_URL = os.environ.get("ISSUER_URL", "https://replit.com/oidc")
REPL_ID = os.environ.get("REPL_ID", "")

IS_PRODUCTION = os.environ.get("REPL_SLUG") is not None or os.environ.get("REPLIT_DEPLOYMENT") is not None
