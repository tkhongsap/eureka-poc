from fastapi.testclient import TestClient

from db import Request, WorkOrder


def test_create_request(client: TestClient):
    payload = {
        "location": "Building A",
        "priority": "High",
        "description": "Leaking pipe",
        "imageIds": [],
        "assignedTo": "tech1",
        "createdBy": "user1",
        "locationData": {
            "latitude": 1.0,
            "longitude": 2.0,
            "address": "Addr",
            "googleMapsUrl": "http://maps",
        },
        "preferredDate": "2030-01-01",
    }
    resp = client.post("/api/requests", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["location"] == "Building A"
    assert data["status"] == "Open"
    assert data["preferredDate"] == "2030-01-01"


def test_list_requests(client: TestClient):
    resp = client.get("/api/requests")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_get_request_not_found(client: TestClient):
    resp = client.get("/api/requests/REQ-non-existent")
    assert resp.status_code == 404


def test_update_request(client: TestClient):
    # Create a request first
    create_resp = client.post(
        "/api/requests",
        json={
            "location": "B",
            "priority": "Low",
            "description": "Old desc",
            "imageIds": [],
        },
    )
    assert create_resp.status_code == 200
    req_id = create_resp.json()["id"]

    # Update it
    update_resp = client.put(
        f"/api/requests/{req_id}",
        json={"status": "In Progress", "priority": "Medium", "description": "New desc"},
    )
    assert update_resp.status_code == 200
    body = update_resp.json()
    assert body["status"] == "In Progress"
    assert body["priority"] == "Medium"
    assert body["description"] == "New desc"


def test_delete_request(client: TestClient):
    # Create
    create_resp = client.post(
        "/api/requests",
        json={
            "location": "C",
            "priority": "Medium",
            "description": "To delete",
            "imageIds": [],
        },
    )
    assert create_resp.status_code == 200
    req_id = create_resp.json()["id"]

    # Delete
    del_resp = client.delete(f"/api/requests/{req_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["message"] == "Request deleted"

    # Subsequent get should 404
    get_resp = client.get(f"/api/requests/{req_id}")
    assert get_resp.status_code == 404


def test_convert_request_to_workorder(client: TestClient):
    # Create a request with a preferredDate so dueDate is calculated from it
    create_resp = client.post(
        "/api/requests",
        json={
            "location": "D",
            "priority": "High",
            "description": "Convert me",
            "imageIds": ["IMG-1"],
            "preferredDate": "2030-01-10",
        },
    )
    assert create_resp.status_code == 200
    req = create_resp.json()
    req_id = req["id"]

    # Convert to work order
    conv_resp = client.post(f"/api/requests/{req_id}/convert")
    assert conv_resp.status_code == 200
    wo = conv_resp.json()
    assert wo["requestId"] == req_id
    assert wo["assetName"] == req["location"]
    assert wo["preferredDate"] == "2030-01-10"
    # dueDate should be preferredDate + 7 days
    assert wo["dueDate"] == "2030-01-17"


