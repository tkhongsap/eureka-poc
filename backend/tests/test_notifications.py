from datetime import datetime, timedelta

from fastapi.testclient import TestClient

from db import Notification, WorkOrder


def _create_workorder_for_notifications(db_session, days_until_preferred: int = 7, days_until_due: int = 7):
    """Helper to insert a work order directly into the DB for reminder tests."""
    today = datetime.now().date()
    preferred_date = (today + timedelta(days=days_until_preferred)).strftime("%Y-%m-%d")
    due_date = (today + timedelta(days=days_until_due)).strftime("%Y-%m-%d")

    wo = WorkOrder(
        id="WO-test-notif",
        title="WO for notifications",
        description="desc",
        asset_name="Asset",
        location="Loc",
        priority="High",
        status="Open",
        assigned_to="tech1",
        due_date=due_date,
        preferred_date=preferred_date,
    )
    db_session.add(wo)
    db_session.commit()


def test_create_and_get_notifications(client: TestClient):
    # Initially no notifications
    resp = client.get("/api/notifications")
    assert resp.status_code == 200
    assert resp.json() == []

    # Create a notification
    payload = {
        "type": "manual",
        "workOrderId": "WO-1",
        "workOrderTitle": "Test WO",
        "message": "Test notification",
        "recipientRole": "Technician",
        "recipientName": "tech1",
        "isRead": False,
        "triggeredBy": "Tester",
    }
    create_resp = client.post(
        "/api/notifications",
        json=payload,
        headers={"X-User-Role": "Admin", "X-User-Name": "admin"},
    )
    assert create_resp.status_code == 200
    data = create_resp.json()
    assert data["type"] == "manual"
    assert data["recipientRole"] == "Technician"
    assert data["isRead"] is False

    # Now list should return at least this one
    list_resp = client.get("/api/notifications")
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert len(items) >= 1


def test_mark_notification_as_read(client: TestClient):
    # Create a notification
    payload = {
        "type": "mark_read",
        "workOrderId": "WO-2",
        "workOrderTitle": "WO 2",
        "message": "Mark read",
        "recipientRole": "Technician",
        "recipientName": "tech1",
        "isRead": False,
        "triggeredBy": "Tester",
    }
    create_resp = client.post("/api/notifications", json=payload)
    assert create_resp.status_code == 200
    notif_id = create_resp.json()["id"]

    # Mark as read
    patch_resp = client.patch(f"/api/notifications/{notif_id}/read")
    assert patch_resp.status_code == 200
    assert patch_resp.json()["isRead"] is True


def test_mark_all_notifications_as_read_for_user(client: TestClient):
    # Create notifications for different users
    for name in ["tech1", "tech2"]:
        payload = {
            "type": "bulk",
            "workOrderId": f"WO-{name}",
            "workOrderTitle": "Bulk",
            "message": "Bulk read",
            "recipientRole": "Technician",
            "recipientName": name,
            "isRead": False,
            "triggeredBy": "Tester",
        }
        resp = client.post("/api/notifications", json=payload)
        assert resp.status_code == 200

    # Mark all as read for tech1 only
    resp = client.patch(
        "/api/notifications/read-all",
        headers={"x_user_role": "Technician", "x_user_name": "tech1"},
    )
    assert resp.status_code == 200
    assert "notifications marked as read" in resp.json()["message"]


def test_delete_all_read_notifications_for_user(client: TestClient):
    # Create a read and unread notification for tech1
    payload_read = {
        "type": "cleanup",
        "workOrderId": "WO-clean",
        "workOrderTitle": "Cleanup",
        "message": "Read notif",
        "recipientRole": "Technician",
        "recipientName": "tech1",
        "isRead": True,
        "triggeredBy": "Tester",
    }
    payload_unread = {**payload_read, "isRead": False}

    resp1 = client.post("/api/notifications", json=payload_read)
    resp2 = client.post("/api/notifications", json=payload_unread)
    assert resp1.status_code == 200
    assert resp2.status_code == 200

    # Delete read notifications for tech1
    del_resp = client.delete(
        "/api/notifications/read",
        headers={"x_user_role": "Technician", "x_user_name": "tech1"},
    )
    assert del_resp.status_code == 200
    msg = del_resp.json()["message"]
    assert "read notifications deleted" in msg


def test_delete_single_notification(client: TestClient):
    payload = {
        "type": "single_delete",
        "workOrderId": "WO-del",
        "workOrderTitle": "Delete one",
        "message": "To delete",
        "recipientRole": "Technician",
        "recipientName": "tech1",
        "isRead": False,
        "triggeredBy": "Tester",
    }
    create_resp = client.post("/api/notifications", json=payload)
    assert create_resp.status_code == 200
    notif_id = create_resp.json()["id"]

    del_resp = client.delete(f"/api/notifications/{notif_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["message"] == "Notification deleted"


def test_check_and_create_reminders(client: TestClient):
    """
    Verify that reminder notifications are created for work orders
    with preferredDate and due_date thresholds.
    """
    # Access the overridden DB session via a short-lived dependency call
    from tests.conftest import TestingSessionLocal

    db = TestingSessionLocal()
    try:
        _create_workorder_for_notifications(db, days_until_preferred=7, days_until_due=7)
    finally:
        db.close()

    resp = client.post("/api/notifications/check-reminders")
    assert resp.status_code == 200
    body = resp.json()
    assert "Created" in body["message"]
    assert isinstance(body["notifications"], list)
    assert len(body["notifications"]) >= 1


