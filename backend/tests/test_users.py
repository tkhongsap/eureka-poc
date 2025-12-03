from fastapi.testclient import TestClient


def test_create_user(client: TestClient):
    """Test creating a new user"""
    payload = {
        "email": "test@example.com",
        "password_hash": "hashed_password_123",
        "name": "Test User",
        "phone": "+66-2-123-4567",
        "avatar_url": "https://example.com/avatar.jpg",
        "employee_id": "EMP001",
        "job_title": "Software Engineer",
        "role": "Senior Developer",  # Display role
        "userRole": "Admin",  # System role for permissions
    }
    resp = client.post("/api/users", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"
    assert data["userRole"] == "Admin"
    assert data["role"] == "Senior Developer"
    assert data["status"] == "active"
    assert "id" in data
    assert data["id"].startswith("USR-")


def test_create_user_with_minimal_fields(client: TestClient):
    """Test creating a user with only required fields"""
    payload = {
        "email": "minimal@example.com",
        "password_hash": "hashed_password",
        "name": "Minimal User",
        "userRole": "Technician",  # Only required field besides email, password_hash, name
    }
    resp = client.post("/api/users", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "minimal@example.com"
    assert data["name"] == "Minimal User"
    assert data["userRole"] == "Technician"
    assert data["status"] == "active"


def test_create_user_duplicate_email(client: TestClient):
    """Test that creating a user with duplicate email fails"""
    payload = {
        "email": "duplicate@example.com",
        "password_hash": "hash1",
        "name": "First User",
        "userRole": "Admin",
    }
    # Create first user
    resp1 = client.post("/api/users", json=payload)
    assert resp1.status_code == 200

    # Try to create second user with same email
    resp2 = client.post("/api/users", json=payload)
    assert resp2.status_code == 400  # Bad request - duplicate email
    assert "email already exists" in resp2.json()["detail"].lower()


def test_list_users(client: TestClient):
    """Test listing all users"""
    # Create a couple of users first
    for i in range(2):
        payload = {
            "email": f"user{i}@example.com",
            "password_hash": f"hash{i}",
            "name": f"User {i}",
            "userRole": "Technician",
        }
        client.post("/api/users", json=payload)

    resp = client.get("/api/users")
    assert resp.status_code == 200
    users = resp.json()
    assert isinstance(users, list)
    assert len(users) >= 2
    # Users should be ordered by created_at desc (newest first)
    assert users[0]["email"] == "user0@example.com"


def test_get_user(client: TestClient):
    """Test getting a specific user by ID"""
    # Create a user first
    create_resp = client.post(
        "/api/users",
        json={
            "email": "getme@example.com",
            "password_hash": "hash",
            "name": "Get Me User",
            "userRole": "Admin",
        },
    )
    assert create_resp.status_code == 200
    user_id = create_resp.json()["id"]

    # Get the user
    get_resp = client.get(f"/api/users/{user_id}")
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["id"] == user_id
    assert data["email"] == "getme@example.com"
    assert data["name"] == "Get Me User"


def test_get_user_not_found(client: TestClient):
    """Test getting a non-existent user returns 404"""
    resp = client.get("/api/users/USR-non-existent")
    assert resp.status_code == 404
    assert "User not found" in resp.json()["detail"]


def test_update_user(client: TestClient):
    """Test updating a user"""
    # Create a user first
    create_resp = client.post(
        "/api/users",
        json={
            "email": "update@example.com",
            "password_hash": "old_hash",
            "name": "Old Name",
            "phone": "old-phone",
            "avatar_url": "old-avatar.jpg",
            "job_title": "Old Title",
            "role": "Old Role",
            "userRole": "Technician",
        },
    )
    assert create_resp.status_code == 200
    user_id = create_resp.json()["id"]

    # Update the user
    update_resp = client.put(
        f"/api/users/{user_id}",
        json={
            "name": "New Name",
            "phone": "new-phone",
            "avatar_url": "new-avatar.jpg",
            "job_title": "New Title",
            "role": "New Display Role",
            "userRole": "Admin",
            "status": "suspended",
        },
    )
    assert update_resp.status_code == 200
    data = update_resp.json()
    assert data["name"] == "New Name"
    assert data["phone"] == "new-phone"
    assert data["avatar_url"] == "new-avatar.jpg"
    assert data["job_title"] == "New Title"
    assert data["role"] == "New Display Role"
    assert data["userRole"] == "Admin"
    assert data["status"] == "suspended"
    # Email should remain unchanged (not in update payload)
    assert data["email"] == "update@example.com"


def test_update_user_partial(client: TestClient):
    """Test updating only some fields of a user"""
    # Create a user
    create_resp = client.post(
        "/api/users",
        json={
            "email": "partial@example.com",
            "password_hash": "hash",
            "name": "Original Name",
            "userRole": "Technician",
        },
    )
    assert create_resp.status_code == 200
    user_id = create_resp.json()["id"]

    # Update only the name
    update_resp = client.put(
        f"/api/users/{user_id}",
        json={"name": "Updated Name Only"},
    )
    assert update_resp.status_code == 200
    data = update_resp.json()
    assert data["name"] == "Updated Name Only"
    # Other fields should remain unchanged
    assert data["email"] == "partial@example.com"
    assert data["userRole"] == "Technician"


def test_update_user_not_found(client: TestClient):
    """Test updating a non-existent user returns 404"""
    resp = client.put(
        "/api/users/USR-non-existent",
        json={"name": "New Name"},
    )
    assert resp.status_code == 404
    assert "User not found" in resp.json()["detail"]


def test_delete_user(client: TestClient):
    """Test deleting a user"""
    # Create a user first
    create_resp = client.post(
        "/api/users",
        json={
            "email": "delete@example.com",
            "password_hash": "hash",
            "name": "To Delete",
            "userRole": "Technician",
        },
    )
    assert create_resp.status_code == 200
    user_id = create_resp.json()["id"]

    # Delete the user
    del_resp = client.delete(f"/api/users/{user_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["message"] == "User deleted"

    # Verify user is deleted - subsequent get should 404
    get_resp = client.get(f"/api/users/{user_id}")
    assert get_resp.status_code == 404


def test_delete_user_not_found(client: TestClient):
    """Test deleting a non-existent user still returns success"""
    # The delete endpoint returns success even if user doesn't exist
    resp = client.delete("/api/users/USR-non-existent")
    assert resp.status_code == 200
    assert resp.json()["message"] == "User deleted"


def test_user_fields_validation(client: TestClient):
    """Test that required fields are validated"""
    # Try to create user without required fields
    incomplete_payload = {
        "email": "incomplete@example.com",
        # Missing password_hash, name, userRole
    }
    resp = client.post("/api/users", json=incomplete_payload)
    assert resp.status_code == 422  # Validation error


def test_user_optional_fields(client: TestClient):
    """Test that optional fields can be omitted and then added later"""
    # Create user without optional fields
    create_resp = client.post(
        "/api/users",
        json={
            "email": "optional@example.com",
            "password_hash": "hash",
            "name": "Optional Fields",
            "userRole": "Admin",
        },
    )
    assert create_resp.status_code == 200
    user_id = create_resp.json()["id"]
    data = create_resp.json()
    assert data["phone"] is None
    assert data["avatar_url"] is None
    assert data["employee_id"] is None
    assert data["job_title"] is None
    assert data["role"] is None

    # Update with optional fields
    update_resp = client.put(
        f"/api/users/{user_id}",
        json={
            "phone": "+66-2-999-8888",
            "avatar_url": "https://example.com/avatar.png",
            "employee_id": "EMP123",
            "job_title": "Developer",
            "role": "Senior Developer",
        },
    )
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["phone"] == "+66-2-999-8888"
    assert updated_data["avatar_url"] == "https://example.com/avatar.png"
    assert updated_data["employee_id"] == "EMP123"
    assert updated_data["job_title"] == "Developer"
    assert updated_data["role"] == "Senior Developer"
