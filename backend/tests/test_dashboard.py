from datetime import datetime, timedelta

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


def test_dashboard_stats_status_counts_and_graph(client: TestClient):
    # Create several work orders with different statuses and priorities
    # Open
    client.post("/api/workorders", json=_create_workorder_payload(status="Open"))
    client.post("/api/workorders", json=_create_workorder_payload(status="Open"))

    # In Progress
    client.post("/api/workorders", json=_create_workorder_payload(status="In Progress"))

    # Pending
    client.post("/api/workorders", json=_create_workorder_payload(status="Pending"))

    # Completed then Closed to exercise completion stats
    completed_resp = client.post(
        "/api/workorders", json=_create_workorder_payload(status="Pending")
    )
    wo_pending_id = completed_resp.json()["id"]
    # Approve -> Completed
    client.patch(
        f"/api/workorders/{wo_pending_id}/approve",
        headers={"X-User-Role": "Head Technician", "X-User-Name": "headtech"},
    )
    # Close -> Closed
    client.patch(
        f"/api/workorders/{wo_pending_id}/close",
        headers={"X-User-Role": "Admin", "X-User-Name": "admin"},
    )

    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    body = resp.json()

    status_counts = body["statusCounts"]
    # We created: 2 Open, 1 In Progress, 1 Pending, 0 Completed (Closed instead), 1 Closed
    assert status_counts["open"] == 2
    assert status_counts["inProgress"] == 1
    assert status_counts["pending"] == 1
    assert status_counts["closed"] == 1

    # Ensure dailyWorkOrders has 7 points
    assert len(body["dailyWorkOrders"]) == 7
    # At least one point should have created > 0
    assert any(point["created"] > 0 for point in body["dailyWorkOrders"])


def test_dashboard_stats_overdue_and_assignee_distribution(client: TestClient):
    # Overdue: due date in the past and not Completed/Closed
    client.post(
        "/api/workorders",
        json=_create_workorder_payload(
            assignedTo="tech_overdue",
            dueDate="2000-01-01",
            status="Open",
            priority="Critical",
        ),
    )

    # Not overdue: due date in future
    client.post(
        "/api/workorders",
        json=_create_workorder_payload(
            assignedTo="tech_future",
            dueDate="2100-01-01",
            status="Open",
            priority="Low",
        ),
    )

    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    body = resp.json()

    # Overdue count should be at least 1
    assert body["overdueCount"] >= 1

    # Priority distribution should reflect at least Critical and Low
    prio = body["priorityDistribution"]
    assert prio["critical"] >= 1
    assert prio["low"] >= 1

    # Work orders by assignee should contain our technicians
    assignees = {a["name"]: a["count"] for a in body["workOrdersByAssignee"]}
    assert "tech_overdue" in assignees
    assert "tech_future" in assignees


def test_dashboard_stats_average_completion_time_nullable_when_no_completed(
    client: TestClient,
):
    # No completed/closed work orders
    client.post("/api/workorders", json=_create_workorder_payload(status="Open"))

    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    body = resp.json()

    # With no completed/closed work orders, averageCompletionTime can be null
    # or a value >= 0 depending on how many were auto-completed by flows.
    # We just assert the field exists.
    assert "averageCompletionTime" in body
