"""
Tests for OAuth Authentication Routes
Tests login flow, callback handling, session management, and logout
"""

from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from urllib.parse import parse_qs, urlparse

import jwt
import pytest
from config import SESSION_COOKIE_NAME
from db.models import OAuth, OAuthState, User
from fastapi.testclient import TestClient
from tests.conftest import TestingSessionLocal, create_session_token


@pytest.fixture
def mock_google_oauth_config():
    """Mock Google OAuth configuration"""
    return {
        "provider": "google",
        "client_id": "google_client_id_123",
        "client_secret": "google_secret_123",
        "issuer_url": "https://accounts.google.com",
        "auth_endpoint": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_endpoint": "https://oauth2.googleapis.com/token",
        "userinfo_endpoint": "https://www.googleapis.com/oauth2/v3/userinfo",
        "scopes": "openid email profile",
        "use_pkce": False,
        "is_deployment": False,
    }


@pytest.fixture
def mock_replit_oauth_config():
    """Mock Replit OAuth configuration"""
    return {
        "provider": "replit",
        "client_id": "replit_client_id_123",
        "client_secret": None,
        "issuer_url": "https://replit.com/oidc",
        "auth_endpoint": "https://replit.com/oidc/auth",
        "token_endpoint": "https://replit.com/oidc/token",
        "userinfo_endpoint": "https://replit.com/oidc/me",
        "scopes": "openid profile email offline_access",
        "use_pkce": True,
        "is_deployment": False,
    }


def test_get_provider_google(client: TestClient, mock_google_oauth_config):
    """Test GET /api/auth/provider returns provider info for Google"""
    with patch("routes.auth.get_oauth_config", return_value=mock_google_oauth_config):
        with patch("config.IS_REPLIT", False):
            with patch("config.IS_DEPLOYMENT", False):
                with patch("config.REPLIT_DOMAINS", None):
                    with patch("config.REPL_ID", None):
                        with patch("config.get_replit_domain", return_value=None):
                            resp = client.get("/api/auth/provider")
                            assert resp.status_code == 200
                            data = resp.json()
                            assert data["provider"] == "google"
                            assert data["configured"] is True
                            assert "auth_endpoint" in data


def test_get_provider_replit(client: TestClient, mock_replit_oauth_config):
    """Test GET /api/auth/provider returns provider info for Replit"""
    with patch("routes.auth.get_oauth_config", return_value=mock_replit_oauth_config):
        with patch("config.IS_REPLIT", True):
            with patch("config.IS_DEPLOYMENT", False):
                with patch("config.REPLIT_DOMAINS", "test.replit.app"):
                    with patch("config.REPL_ID", "replit_client_id_123"):
                        with patch(
                            "config.get_replit_domain", return_value="test.replit.app"
                        ):
                            resp = client.get("/api/auth/provider")
                            assert resp.status_code == 200
                            data = resp.json()
                            assert data["provider"] == "replit"
                            assert data["configured"] is True


def test_login_redirects_to_oauth_provider_google(
    client: TestClient, mock_google_oauth_config
):
    """Test GET /api/auth/login redirects to Google OAuth with correct parameters"""
    with patch("routes.auth.get_oauth_config", return_value=mock_google_oauth_config):
        with patch(
            "routes.auth.get_redirect_uri",
            return_value="http://localhost:5000/api/auth/callback",
        ):
            resp = client.get("/api/auth/login", follow_redirects=False)
            assert resp.status_code == 307  # Redirect
            location = resp.headers["location"]
            assert "accounts.google.com" in location
            assert "client_id=google_client_id_123" in location
            assert "response_type=code" in location
            assert "scope=openid+email+profile" in location
            assert "state=" in location
            assert "nonce=" in location
            assert "access_type=offline" in location
            assert "prompt=consent" in location


def test_login_redirects_to_oauth_provider_replit(
    client: TestClient, mock_replit_oauth_config
):
    """Test GET /api/auth/login redirects to Replit OAuth with PKCE parameters"""
    with patch("routes.auth.get_oauth_config", return_value=mock_replit_oauth_config):
        with patch(
            "routes.auth.get_redirect_uri",
            return_value="http://localhost:5000/api/auth/callback",
        ):
            resp = client.get("/api/auth/login", follow_redirects=False)
            assert resp.status_code == 307  # Redirect
            location = resp.headers["location"]
            assert "replit.com/oidc/auth" in location
            assert "client_id=replit_client_id_123" in location
            assert "code_challenge=" in location
            assert "code_challenge_method=S256" in location
            assert "state=" in location
            assert "nonce=" in location


def test_login_stores_state_in_database(client: TestClient, mock_google_oauth_config):
    """Test login stores state and nonce in database"""
    with patch("routes.auth.get_oauth_config", return_value=mock_google_oauth_config):
        with patch(
            "routes.auth.get_redirect_uri",
            return_value="http://localhost:5000/api/auth/callback",
        ):
            resp = client.get("/api/auth/login", follow_redirects=False)
            assert resp.status_code == 307

            # Extract state from redirect URL
            location = resp.headers["location"]
            parsed = urlparse(location)
            params = parse_qs(parsed.query)
            state = params["state"][0]

            # Verify state is stored in database
            db = TestingSessionLocal()
            try:
                state_record = (
                    db.query(OAuthState).filter(OAuthState.state == state).first()
                )
                assert state_record is not None
                assert state_record.nonce is not None
                assert state_record.provider == "google"
                assert state_record.expires_at > datetime.now()
            finally:
                db.close()


def test_login_stores_pkce_verifier_for_replit(
    client: TestClient, mock_replit_oauth_config
):
    """Test login stores PKCE code_verifier for Replit provider"""
    with patch("routes.auth.get_oauth_config", return_value=mock_replit_oauth_config):
        with patch(
            "routes.auth.get_redirect_uri",
            return_value="http://localhost:5000/api/auth/callback",
        ):
            resp = client.get("/api/auth/login", follow_redirects=False)
            assert resp.status_code == 307

            # Extract state from redirect URL
            location = resp.headers["location"]
            parsed = urlparse(location)
            params = parse_qs(parsed.query)
            state = params["state"][0]

            # Verify PKCE verifier is stored
            db = TestingSessionLocal()
            try:
                state_record = (
                    db.query(OAuthState).filter(OAuthState.state == state).first()
                )
                assert state_record is not None
                assert state_record.code_verifier is not None
                assert state_record.provider == "replit"
            finally:
                db.close()


def test_login_error_when_client_id_missing(client: TestClient):
    """Test login returns error when client_id is not configured"""
    no_client_id_config = {
        "provider": "google",
        "client_id": "",
        "client_secret": "secret",
        "auth_endpoint": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_endpoint": "https://oauth2.googleapis.com/token",
        "userinfo_endpoint": "https://www.googleapis.com/oauth2/v3/userinfo",
        "scopes": "openid email profile",
        "use_pkce": False,
    }
    with patch("routes.auth.get_oauth_config", return_value=no_client_id_config):
        resp = client.get("/api/auth/login")
        assert resp.status_code == 500
        assert "not configured" in resp.json()["detail"].lower()


def test_callback_with_error_redirects_to_login(client: TestClient):
    """Test callback with error parameter redirects to login"""
    resp = client.get(
        "/api/auth/callback?error=access_denied&error_description=User+cancelled",
        follow_redirects=False,
    )
    assert resp.status_code == 307
    assert "/login?error=access_denied" in resp.headers["location"]


def test_callback_missing_params_redirects_to_login(client: TestClient):
    """Test callback with missing code or state redirects to login"""
    # Missing code
    resp = client.get("/api/auth/callback?state=some_state", follow_redirects=False)
    assert resp.status_code == 307
    assert "/login?error=missing_params" in resp.headers["location"]

    # Missing state
    resp = client.get("/api/auth/callback?code=some_code", follow_redirects=False)
    assert resp.status_code == 307
    assert "/login?error=missing_params" in resp.headers["location"]


def test_callback_invalid_state_redirects_to_login(client: TestClient):
    """Test callback with invalid or expired state redirects to login"""
    resp = client.get(
        "/api/auth/callback?code=test_code&state=invalid_state",
        follow_redirects=False,
    )
    assert resp.status_code == 307
    assert "/login?error=invalid_state" in resp.headers["location"]


def test_callback_successful_google_creates_user_and_session(
    client: TestClient, mock_google_oauth_config
):
    """Test successful Google OAuth callback creates user and sets session cookie"""
    # Create state in database
    db = TestingSessionLocal()
    try:
        state = "test_state_123"
        oauth_state = OAuthState(
            state=state,
            nonce="test_nonce",
            code_verifier=None,
            provider="google",
            expires_at=datetime.now() + timedelta(minutes=10),
        )
        db.add(oauth_state)
        db.commit()
    finally:
        db.close()

    # Mock token exchange response
    mock_token_response = {
        "access_token": "test_access_token",
        "refresh_token": "test_refresh_token",
        "token_type": "Bearer",
        "expires_in": 3600,
    }

    # Mock userinfo response
    mock_userinfo = {
        "sub": "google_user_123",
        "email": "test@example.com",
        "name": "Test User",
        "given_name": "Test",
        "family_name": "User",
        "picture": "https://example.com/avatar.jpg",
    }

    with patch("routes.auth.get_oauth_config", return_value=mock_google_oauth_config):
        with patch(
            "routes.auth.get_redirect_uri",
            return_value="http://localhost:5000/api/auth/callback",
        ):
            # Mock httpx.AsyncClient as async context manager
            mock_client = AsyncMock()
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_token_response
            mock_client.post = AsyncMock(return_value=mock_response)

            mock_userinfo_response = MagicMock()
            mock_userinfo_response.status_code = 200
            mock_userinfo_response.json.return_value = mock_userinfo
            mock_client.get = AsyncMock(return_value=mock_userinfo_response)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)

            with patch("routes.auth.httpx.AsyncClient", return_value=mock_client):
                resp = client.get(
                    f"/api/auth/callback?code=test_code&state={state}",
                    follow_redirects=False,
                )
                assert resp.status_code == 307
                assert "/auth-success" in resp.headers["location"]

                # Verify session cookie is set
                assert SESSION_COOKIE_NAME in resp.cookies
                session_token = resp.cookies[SESSION_COOKIE_NAME]
                assert session_token is not None

                # Verify user was created
                db = TestingSessionLocal()
                try:
                    user = (
                        db.query(User).filter(User.email == "test@example.com").first()
                    )
                    assert user is not None
                    assert user.google_user_id == "google_user_123"
                    assert user.name == "Test User"
                    assert user.avatar_url == "https://example.com/avatar.jpg"

                    # Verify OAuth tokens stored
                    oauth = db.query(OAuth).filter(OAuth.user_id == user.id).first()
                    assert oauth is not None
                    assert oauth.access_token == "test_access_token"
                    assert oauth.refresh_token == "test_refresh_token"
                finally:
                    db.close()


def test_callback_successful_replit_creates_user_and_session(
    client: TestClient, mock_replit_oauth_config
):
    """Test successful Replit OAuth callback creates user and sets session cookie"""
    # Create state in database with PKCE verifier
    db = TestingSessionLocal()
    try:
        state = "test_state_replit"
        oauth_state = OAuthState(
            state=state,
            nonce="test_nonce",
            code_verifier="test_code_verifier_123",
            provider="replit",
            expires_at=datetime.now() + timedelta(minutes=10),
        )
        db.add(oauth_state)
        db.commit()
    finally:
        db.close()

    # Mock token exchange response with ID token
    id_token_payload = {
        "sub": "replit_user_123",
        "email": "replit@example.com",
        "username": "replituser",
        "first_name": "Replit",
        "last_name": "User",
        "profile_image_url": "https://replit.com/avatar.jpg",
    }
    id_token = jwt.encode(id_token_payload, "secret", algorithm="HS256")

    mock_token_response = {
        "access_token": "test_access_token",
        "refresh_token": "test_refresh_token",
        "token_type": "Bearer",
        "expires_in": 3600,
        "id_token": id_token,
    }

    with patch("routes.auth.get_oauth_config", return_value=mock_replit_oauth_config):
        with patch(
            "routes.auth.get_redirect_uri",
            return_value="http://localhost:5000/api/auth/callback",
        ):
            # Mock httpx.AsyncClient as async context manager
            mock_client = AsyncMock()
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_token_response
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)

            with patch("routes.auth.httpx.AsyncClient", return_value=mock_client):
                resp = client.get(
                    f"/api/auth/callback?code=test_code&state={state}",
                    follow_redirects=False,
                )
                assert resp.status_code == 307
                assert "/auth-success" in resp.headers["location"]

                # Verify session cookie is set
                assert SESSION_COOKIE_NAME in resp.cookies

                # Verify user was created
                db = TestingSessionLocal()
                try:
                    user = (
                        db.query(User)
                        .filter(User.email == "replit@example.com")
                        .first()
                    )
                    assert user is not None
                    assert user.replit_user_id == "replit_user_123"
                    assert user.name == "Replit User"
                finally:
                    db.close()


def test_callback_links_oauth_to_existing_user_by_email(
    client: TestClient, mock_google_oauth_config
):
    """Test callback links OAuth provider to existing user by email"""
    # Create existing user
    db = TestingSessionLocal()
    try:
        existing_user = User(
            id="USR-existing",
            email="existing@example.com",
            name="Existing User",
            user_role="Requester",
            status="active",
            settings={},
        )
        db.add(existing_user)
        db.commit()

        # Create state
        state = "test_state_link"
        oauth_state = OAuthState(
            state=state,
            nonce="test_nonce",
            code_verifier=None,
            provider="google",
            expires_at=datetime.now() + timedelta(minutes=10),
        )
        db.add(oauth_state)
        db.commit()
    finally:
        db.close()

    # Mock responses
    mock_token_response = {
        "access_token": "test_token",
        "token_type": "Bearer",
        "expires_in": 3600,
    }
    mock_userinfo = {
        "sub": "google_user_456",
        "email": "existing@example.com",
        "name": "Updated Name",
        "given_name": "Updated",
        "family_name": "Name",
        "picture": "https://example.com/new_avatar.jpg",
    }

    with patch("routes.auth.get_oauth_config", return_value=mock_google_oauth_config):
        with patch(
            "routes.auth.get_redirect_uri",
            return_value="http://localhost:5000/api/auth/callback",
        ):
            # Mock httpx.AsyncClient as async context manager
            mock_client = AsyncMock()
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_token_response
            mock_client.post = AsyncMock(return_value=mock_response)

            mock_userinfo_response = MagicMock()
            mock_userinfo_response.status_code = 200
            mock_userinfo_response.json.return_value = mock_userinfo
            mock_client.get = AsyncMock(return_value=mock_userinfo_response)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)

            with patch("routes.auth.httpx.AsyncClient", return_value=mock_client):
                resp = client.get(
                    f"/api/auth/callback?code=test_code&state={state}",
                    follow_redirects=False,
                )
                assert resp.status_code == 307

                # Verify user was linked
                db = TestingSessionLocal()
                try:
                    user = (
                        db.query(User)
                        .filter(User.email == "existing@example.com")
                        .first()
                    )
                    assert user is not None
                    assert user.google_user_id == "google_user_456"
                    # When linking to existing user, name is preserved but first_name/last_name are updated
                    assert (
                        user.name == "Existing User"
                    )  # Name field is not updated when linking
                    assert user.first_name == "Updated"
                    assert user.last_name == "Name"
                    assert user.avatar_url == "https://example.com/new_avatar.jpg"
                finally:
                    db.close()


def test_callback_token_exchange_failure(client: TestClient, mock_google_oauth_config):
    """Test callback handles token exchange failure"""
    # Create state
    db = TestingSessionLocal()
    try:
        state = "test_state_fail"
        oauth_state = OAuthState(
            state=state,
            nonce="test_nonce",
            code_verifier=None,
            provider="google",
            expires_at=datetime.now() + timedelta(minutes=10),
        )
        db.add(oauth_state)
        db.commit()
    finally:
        db.close()

    with patch("routes.auth.get_oauth_config", return_value=mock_google_oauth_config):
        with patch(
            "routes.auth.get_redirect_uri",
            return_value="http://localhost:5000/api/auth/callback",
        ):
            # Mock failed token exchange
            mock_client = AsyncMock()
            mock_response = MagicMock()
            mock_response.status_code = 400
            mock_response.text = "Invalid code"
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)

            with patch("routes.auth.httpx.AsyncClient", return_value=mock_client):
                resp = client.get(
                    f"/api/auth/callback?code=invalid_code&state={state}",
                    follow_redirects=False,
                )
                assert resp.status_code == 307
                assert "/login?error=token_exchange_failed" in resp.headers["location"]


def test_get_me_returns_user_when_authenticated(client: TestClient, auth_user: dict):
    """Test GET /api/auth/me returns user info when authenticated"""
    resp = client.get("/api/auth/me", cookies=auth_user["cookies"])
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == auth_user["id"]
    assert data["email"] == auth_user["email"]
    assert data["name"] == auth_user["name"]
    assert "user_role" in data
    assert "role" in data


def test_get_me_returns_401_when_no_session(client: TestClient):
    """Test GET /api/auth/me returns 401 when no session cookie"""
    # TestClient may maintain cookies from previous requests.
    # Set cookie to empty string to ensure it's treated as "not present"
    # Empty string is falsy, so `if not session_token:` should catch it
    resp = client.get("/api/auth/me", cookies={SESSION_COOKIE_NAME: ""})
    assert resp.status_code == 401
    assert "Not authenticated" in resp.json()["detail"]


def test_get_me_returns_401_when_session_invalid(client: TestClient):
    """Test GET /api/auth/me returns 401 when session is invalid"""
    resp = client.get(
        "/api/auth/me", cookies={SESSION_COOKIE_NAME: "invalid_token_123"}
    )
    assert resp.status_code == 401
    assert "expired or invalid" in resp.json()["detail"]


def test_logout_clears_session_cookie(client: TestClient, auth_user: dict):
    """Test POST /api/auth/logout clears session cookie"""
    resp = client.post("/api/auth/logout", cookies=auth_user["cookies"])
    assert resp.status_code == 200
    data = resp.json()
    assert "message" in data
    assert "Logged out successfully" in data["message"]

    # Verify cookie deletion is set in response headers
    # The logout endpoint calls response.delete_cookie() which sets Set-Cookie header
    # with Max-Age=0 to delete the cookie
    set_cookie_header = resp.headers.get("set-cookie", "")
    assert SESSION_COOKIE_NAME in set_cookie_header.lower()
    assert "max-age=0" in set_cookie_header.lower()

    # Note: The session token itself remains valid (it's stateless and signed),
    # but the cookie deletion instruction is sent to the client. In a real browser,
    # the cookie would be deleted and the session would no longer be accessible.
    # TestClient maintains cookies in its jar, so if we explicitly pass the cookie,
    # it will still work because the token is valid. This is expected behavior -
    # logout deletes the cookie, but doesn't invalidate the token itself.


def test_logout_deletes_oauth_tokens(client: TestClient, mock_google_oauth_config):
    """Test logout deletes OAuth tokens from database"""
    # Create user with OAuth tokens
    user_id = "USR-logout-test"
    db = TestingSessionLocal()
    try:
        user = User(
            id=user_id,
            email="logout@example.com",
            name="Logout User",
            user_role="Requester",
            status="active",
            settings={},
        )
        db.add(user)
        db.commit()

        oauth = OAuth(
            id="OA-test",
            user_id=user_id,
            provider="google",
            access_token="test_token",
            refresh_token="test_refresh",
            token_type="Bearer",
        )
        db.add(oauth)
        db.commit()
    finally:
        db.close()

    token = create_session_token(user_id)

    with patch("routes.auth.get_oauth_config", return_value=mock_google_oauth_config):
        resp = client.post("/api/auth/logout", cookies={SESSION_COOKIE_NAME: token})
        assert resp.status_code == 200

        # Verify OAuth tokens deleted
        db = TestingSessionLocal()
        try:
            oauth_record = db.query(OAuth).filter(OAuth.user_id == user_id).first()
            assert oauth_record is None
        finally:
            db.close()


def test_logout_without_session_still_succeeds(
    client: TestClient, mock_google_oauth_config
):
    """Test logout without session still succeeds"""
    with patch("routes.auth.get_oauth_config", return_value=mock_google_oauth_config):
        resp = client.post("/api/auth/logout")
        assert resp.status_code == 200
        data = resp.json()
        assert "message" in data
        assert "Logged out successfully" in data["message"]


def test_logout_returns_redirect_url_for_replit(
    client: TestClient, mock_replit_oauth_config
):
    """Test logout returns redirect URL for Replit provider"""
    with patch("routes.auth.get_oauth_config", return_value=mock_replit_oauth_config):
        resp = client.post("/api/auth/logout")
        assert resp.status_code == 200
        data = resp.json()
        assert "redirect_url" in data
        assert "replit.com" in data["redirect_url"]


def test_logout_returns_redirect_url_for_google(
    client: TestClient, mock_google_oauth_config
):
    """Test logout returns redirect URL for Google provider"""
    with patch("routes.auth.get_oauth_config", return_value=mock_google_oauth_config):
        resp = client.post("/api/auth/logout")
        assert resp.status_code == 200
        data = resp.json()
        assert "redirect_url" in data
        assert data["redirect_url"] == "/login"
