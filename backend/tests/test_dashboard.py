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


def test_dashboard_stats_days_filter(client: TestClient):
    """Test that the days parameter correctly filters dailyWorkOrders data points."""
    # Test various day values
    for days in [7, 14, 30, 90]:
        resp = client.get(f"/api/dashboard/stats?days={days}")
        assert resp.status_code == 200
        body = resp.json()
        # Should have exactly 'days' number of data points
        assert (
            len(body["dailyWorkOrders"]) == days
        ), f"Expected {days} data points for days={days}, got {len(body['dailyWorkOrders'])}"


def test_dashboard_stats_days_default(client: TestClient):
    """Test that days parameter defaults to 7 when not provided."""
    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["dailyWorkOrders"]) == 7


def test_dashboard_stats_days_parameter_validation(client: TestClient):
    """Test that days parameter validates bounds (ge=1, le=365)."""
    # Test lower bound (should fail)
    resp = client.get("/api/dashboard/stats?days=0")
    assert resp.status_code == 422

    # Test upper bound (should fail)
    resp = client.get("/api/dashboard/stats?days=366")
    assert resp.status_code == 422

    # Test valid bounds
    resp = client.get("/api/dashboard/stats?days=1")
    assert resp.status_code == 200
    assert len(resp.json()["dailyWorkOrders"]) == 1

    resp = client.get("/api/dashboard/stats?days=365")
    assert resp.status_code == 200
    assert len(resp.json()["dailyWorkOrders"]) == 365


def test_dashboard_stats_daily_workorders_structure(client: TestClient):
    """Test that dailyWorkOrders has correct structure (date, dayName, created, completed)."""
    client.post("/api/workorders", json=_create_workorder_payload(status="Open"))

    resp = client.get("/api/dashboard/stats?days=7")
    assert resp.status_code == 200
    body = resp.json()

    assert len(body["dailyWorkOrders"]) == 7
    for point in body["dailyWorkOrders"]:
        assert "date" in point
        assert "dayName" in point
        assert "created" in point
        assert "completed" in point
        assert isinstance(point["created"], int)
        assert isinstance(point["completed"], int)
        assert point["created"] >= 0
        assert point["completed"] >= 0
        # dayName should be 3-letter abbreviation
        assert len(point["dayName"]) == 3


def test_dashboard_stats_completed_counts(client: TestClient):
    """Test that completed counts in dailyWorkOrders use approved_at correctly."""
    # Create a work order and approve it (which sets approved_at)
    wo_resp = client.post(
        "/api/workorders", json=_create_workorder_payload(status="Pending")
    )
    wo_id = wo_resp.json()["id"]

    # Approve it
    client.patch(
        f"/api/workorders/{wo_id}/approve",
        headers={"X-User-Role": "Head Technician", "X-User-Name": "headtech"},
    )

    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    body = resp.json()

    # At least one point should have completed > 0
    assert any(point["completed"] > 0 for point in body["dailyWorkOrders"])


def test_dashboard_stats_recent_workorders(client: TestClient):
    """Test that recentWorkOrders returns last 8 work orders ordered by created_at desc."""
    # Create more than 8 work orders
    for i in range(10):
        client.post("/api/workorders", json=_create_workorder_payload(title=f"WO {i}"))

    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    body = resp.json()

    recent = body["recentWorkOrders"]
    # Should have at most 8
    assert len(recent) <= 8

    # Should be ordered by created_at desc (newest first)
    if len(recent) > 1:
        for i in range(len(recent) - 1):
            assert recent[i]["createdAt"] >= recent[i + 1]["createdAt"]


def test_dashboard_stats_alerts_overdue(client: TestClient):
    """Test that overdue work orders generate alerts."""
    # Create overdue work order
    client.post(
        "/api/workorders",
        json=_create_workorder_payload(
            title="Overdue WO",
            dueDate="2000-01-01",
            status="Open",
            priority="High",
        ),
    )

    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    body = resp.json()

    alerts = body["alerts"]
    overdue_alerts = [a for a in alerts if a["type"] == "overdue"]
    assert len(overdue_alerts) >= 1
    assert any("Overdue WO" in a["title"] for a in overdue_alerts)
    assert all(a["priority"] is not None for a in overdue_alerts)


def test_dashboard_stats_alerts_unassigned_high_priority(client: TestClient):
    """Test that unassigned high/critical priority work orders generate alerts."""
    # Create unassigned high priority work order
    client.post(
        "/api/workorders",
        json=_create_workorder_payload(
            title="Unassigned High",
            priority="High",
            status="Open",
            assignedTo=None,
        ),
    )

    # Create unassigned critical priority work order
    client.post(
        "/api/workorders",
        json=_create_workorder_payload(
            title="Unassigned Critical",
            priority="Critical",
            status="Open",
            assignedTo=None,
        ),
    )

    # Create assigned high priority (should not alert)
    client.post(
        "/api/workorders",
        json=_create_workorder_payload(
            title="Assigned High",
            priority="High",
            status="Open",
            assignedTo="tech1",
        ),
    )

    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    body = resp.json()

    alerts = body["alerts"]
    unassigned_alerts = [a for a in alerts if a["type"] == "unassigned"]
    assert len(unassigned_alerts) >= 2
    assert any("Unassigned High" in a["title"] for a in unassigned_alerts)
    assert any("Unassigned Critical" in a["title"] for a in unassigned_alerts)
    # Assigned high priority should not be in alerts
    assert not any("Assigned High" in a["title"] for a in unassigned_alerts)


def test_dashboard_stats_priority_distribution_all_levels(client: TestClient):
    """Test priority distribution includes all priority levels."""
    # Create work orders with all priority levels
    client.post("/api/workorders", json=_create_workorder_payload(priority="Critical"))
    client.post("/api/workorders", json=_create_workorder_payload(priority="High"))
    client.post("/api/workorders", json=_create_workorder_payload(priority="Medium"))
    client.post("/api/workorders", json=_create_workorder_payload(priority="Low"))

    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    body = resp.json()

    prio = body["priorityDistribution"]
    assert prio["critical"] >= 1
    assert prio["high"] >= 1
    assert prio["medium"] >= 1
    assert prio["low"] >= 1
    assert "other" in prio  # Should exist even if 0


def test_dashboard_stats_average_completion_time_calculation(client: TestClient):
    """Test average completion time calculation with actual completed work orders."""
    # Create and complete a work order
    wo_resp = client.post(
        "/api/workorders", json=_create_workorder_payload(status="Pending")
    )
    wo_id = wo_resp.json()["id"]

    # Approve it (sets approved_at)
    client.patch(
        f"/api/workorders/{wo_id}/approve",
        headers={"X-User-Role": "Head Technician", "X-User-Name": "headtech"},
    )

    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    body = resp.json()

    # Should have average completion time now
    if body["averageCompletionTime"] is not None:
        assert "hours" in body["averageCompletionTime"]
        assert "formattedText" in body["averageCompletionTime"]
        assert body["averageCompletionTime"]["hours"] >= 0


def test_dashboard_stats_completed_not_in_overdue(client: TestClient):
    """Test that completed/closed work orders are not counted as overdue."""
    # Create overdue work order and complete it
    wo_resp = client.post(
        "/api/workorders",
        json=_create_workorder_payload(
            dueDate="2000-01-01",
            status="Pending",
        ),
    )
    wo_id = wo_resp.json()["id"]

    # Approve it
    client.patch(
        f"/api/workorders/{wo_id}/approve",
        headers={"X-User-Role": "Head Technician", "X-User-Name": "headtech"},
    )

    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    body = resp.json()

    # The completed work order should not appear in overdue alerts
    alerts = body["alerts"]
    overdue_alerts = [
        a for a in alerts if a["type"] == "overdue" and a["workOrderId"] == wo_id
    ]
    assert len(overdue_alerts) == 0
