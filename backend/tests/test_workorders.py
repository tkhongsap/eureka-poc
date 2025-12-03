from datetime import datetime

from fastapi.testclient import TestClient


def _create_workorder_payload(**overrides):
    base = {
        "title": "Test WO",
        "description": "Desc",
        "assetName": "Asset",
        "location": "Loc",
        "priority": "High",
        "status": "Open",
        "assignedTo": "tech1",
        "dueDate": "2030-01-01",
        "imageIds": [],
        "requestId": None,
        "locationData": None,
        "preferredDate": None,
    }
    base.update(overrides)
    return base


def test_create_and_get_workorder(client: TestClient):
    payload = _create_workorder_payload()
    create_resp = client.post("/api/workorders", json=payload)
    assert create_resp.status_code == 200
    wo = create_resp.json()
    wo_id = wo["id"]
    assert wo["title"] == "Test WO"

    get_resp = client.get(f"/api/workorders/{wo_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == wo_id


def test_list_workorders_with_filters(client: TestClient):
    # Ensure at least one work order exists
    payload = _create_workorder_payload(title="Searchable WO", description="Something")
    client.post("/api/workorders", json=payload)

    resp = client.get("/api/workorders", params={"search": "Searchable"})
    assert resp.status_code == 200
    body = resp.json()
    assert any("Searchable WO" == wo["title"] for wo in body)


def test_update_workorder_success(client: TestClient):
    payload = _create_workorder_payload()
    create_resp = client.post("/api/workorders", json=payload)
    wo_id = create_resp.json()["id"]

    update_resp = client.put(
        f"/api/workorders/{wo_id}",
        json={"title": "Updated", "priority": "Low"},
        headers={"X-User-Role": "Admin", "X-User-Name": "admin"},
    )
    assert update_resp.status_code == 200
    wo = update_resp.json()
    assert wo["title"] == "Updated"
    assert wo["priority"] == "Low"


def test_update_workorder_forbidden_when_no_permission(client: TestClient):
    payload = _create_workorder_payload(status="Completed", assignedTo="tech1")
    create_resp = client.post("/api/workorders", json=payload)
    wo_id = create_resp.json()["id"]

    # Technician should not be able to edit Completed (per workflow rules)
    update_resp = client.put(
        f"/api/workorders/{wo_id}",
        json={"description": "Try change"},
        headers={"X-User-Role": "Technician", "X-User-Name": "tech1"},
    )
    assert update_resp.status_code in (403, 422)


def test_delete_workorder(client: TestClient):
    payload = _create_workorder_payload()
    create_resp = client.post("/api/workorders", json=payload)
    wo_id = create_resp.json()["id"]

    del_resp = client.delete(f"/api/workorders/{wo_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["message"] == "Work order deleted"

    get_resp = client.get(f"/api/workorders/{wo_id}")
    assert get_resp.status_code == 404


def test_technician_update_moves_to_pending(client: TestClient):
    # Create WO in In Progress assigned to tech1
    payload = _create_workorder_payload(status="In Progress", assignedTo="tech1")
    create_resp = client.post("/api/workorders", json=payload)
    wo_id = create_resp.json()["id"]

    tech_resp = client.patch(
        f"/api/workorders/{wo_id}/technician-update",
        json={
            "technicianNotes": "Done",
            "technicianImages": ["IMG-1"],
            "status": "Pending",
        },
        headers={"X-User-Role": "Technician", "X-User-Name": "tech1"},
    )
    assert tech_resp.status_code == 200
    wo = tech_resp.json()
    assert wo["status"] == "Pending"
    assert wo["technicianNotes"] == "Done"
    assert wo["technicianImages"] == ["IMG-1"]


def test_technician_update_forbidden_if_not_in_progress(client: TestClient):
    payload = _create_workorder_payload(status="Open", assignedTo="tech1")
    create_resp = client.post("/api/workorders", json=payload)
    wo_id = create_resp.json()["id"]

    tech_resp = client.patch(
        f"/api/workorders/{wo_id}/technician-update",
        json={"technicianNotes": "Note", "technicianImages": []},
        headers={"X-User-Role": "Technician", "X-User-Name": "tech1"},
    )
    assert tech_resp.status_code == 403


def test_admin_approve_workorder(client: TestClient):
    # Create WO in Pending
    payload = _create_workorder_payload(status="Pending", assignedTo="tech1")
    create_resp = client.post("/api/workorders", json=payload)
    wo_id = create_resp.json()["id"]

    resp = client.patch(
        f"/api/workorders/{wo_id}/approve",
        headers={"X-User-Role": "Head Technician", "X-User-Name": "headtech"},
    )
    assert resp.status_code == 200
    wo = resp.json()
    assert wo["status"] == "Completed"
    assert wo["approvedBy"] == "headtech"


def test_admin_reject_workorder(client: TestClient):
    payload = _create_workorder_payload(status="Pending", assignedTo="tech1")
    create_resp = client.post("/api/workorders", json=payload)
    wo_id = create_resp.json()["id"]

    resp = client.patch(
        f"/api/workorders/{wo_id}/reject",
        json={"rejectionReason": "Not good enough"},
        headers={"X-User-Role": "Head Technician", "X-User-Name": "headtech"},
    )
    assert resp.status_code == 200
    wo = resp.json()
    assert wo["status"] == "In Progress"
    assert wo["rejectionReason"] == "Not good enough"
    assert wo["rejectedBy"] == "headtech"


def test_admin_close_workorder(client: TestClient):
    payload = _create_workorder_payload(status="Completed", assignedTo="tech1")
    create_resp = client.post("/api/workorders", json=payload)
    wo_id = create_resp.json()["id"]

    resp = client.patch(
        f"/api/workorders/{wo_id}/close",
        headers={"X-User-Role": "Admin", "X-User-Name": "admin"},
    )
    assert resp.status_code == 200
    wo = resp.json()
    assert wo["status"] == "Closed"
    assert wo["closedBy"] == "admin"


def test_admin_close_workorder_forbidden_wrong_status(client: TestClient):
    payload = _create_workorder_payload(status="Open")
    create_resp = client.post("/api/workorders", json=payload)
    wo_id = create_resp.json()["id"]

    resp = client.patch(
        f"/api/workorders/{wo_id}/close",
        headers={"X-User-Role": "Admin", "X-User-Name": "admin"},
    )
    assert resp.status_code == 403
