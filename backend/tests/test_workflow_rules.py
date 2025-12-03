import pytest

from utils.workflow_rules import (
    Status,
    UserRole,
    is_transition_allowed,
    get_allowed_next_statuses,
    get_work_order_permissions,
    get_notification_recipients,
    validate_status_transition,
)


def test_is_transition_allowed_valid_transitions():
    # Open -> In Progress allowed for Admin
    assert is_transition_allowed(Status.OPEN, Status.IN_PROGRESS, UserRole.ADMIN.value)

    # In Progress -> Pending allowed for Technician and Admin
    assert is_transition_allowed(
        Status.IN_PROGRESS, Status.PENDING, UserRole.TECHNICIAN.value
    )
    assert is_transition_allowed(
        Status.IN_PROGRESS, Status.PENDING, UserRole.ADMIN.value
    )

    # Pending -> Completed allowed for Head Technician
    assert is_transition_allowed(
        Status.PENDING, Status.COMPLETED, UserRole.HEAD_TECHNICIAN.value
    )


def test_is_transition_allowed_invalid_transition():
    # Requester cannot move from Open -> In Progress
    assert not is_transition_allowed(
        Status.OPEN, Status.IN_PROGRESS, UserRole.REQUESTER.value
    )

    # Technician cannot close a work order
    assert not is_transition_allowed(
        Status.COMPLETED, Status.CLOSED, UserRole.TECHNICIAN.value
    )


def test_get_allowed_next_statuses_respects_role():
    # Admin from Open can move to In Progress and Canceled and stay in Open
    admin_next = get_allowed_next_statuses(Status.OPEN, UserRole.ADMIN.value)
    assert Status.IN_PROGRESS in admin_next
    assert Status.CANCELED in admin_next
    assert Status.OPEN in admin_next

    # Requester from Open can only stay in Open (create/update)
    requester_next = get_allowed_next_statuses(Status.OPEN, UserRole.REQUESTER.value)
    assert requester_next == [Status.OPEN]

    # Head Technician from Pending can move to Completed or In Progress
    head_next = get_allowed_next_statuses(
        Status.PENDING, UserRole.HEAD_TECHNICIAN.value
    )
    assert set(head_next) == {Status.COMPLETED, Status.IN_PROGRESS}


def test_get_work_order_permissions_admin():
    perms_open = get_work_order_permissions(Status.OPEN, UserRole.ADMIN.value)
    assert perms_open.can_edit is True
    assert perms_open.can_change_status is True
    assert perms_open.can_assign is True
    assert perms_open.can_delete is True

    perms_closed = get_work_order_permissions(Status.CLOSED, UserRole.ADMIN.value)
    assert perms_closed.can_edit is False
    assert perms_closed.can_change_status is True
    assert perms_closed.can_assign is True
    assert perms_closed.can_delete is False


def test_get_work_order_permissions_requester():
    perms_open = get_work_order_permissions(Status.OPEN, UserRole.REQUESTER.value)
    assert perms_open.can_edit is True
    assert perms_open.can_change_status is False
    assert perms_open.can_assign is False
    assert perms_open.can_delete is True

    perms_in_progress = get_work_order_permissions(
        Status.IN_PROGRESS, UserRole.REQUESTER.value
    )
    assert perms_in_progress.can_edit is False
    assert perms_in_progress.can_delete is False


def test_get_work_order_permissions_head_technician():
    perms_pending = get_work_order_permissions(
        Status.PENDING, UserRole.HEAD_TECHNICIAN.value
    )
    assert perms_pending.can_edit is True
    assert perms_pending.can_change_status is True
    assert perms_pending.can_assign is False
    assert perms_pending.can_delete is False

    perms_open = get_work_order_permissions(Status.OPEN, UserRole.HEAD_TECHNICIAN.value)
    assert perms_open.can_edit is False
    assert perms_open.can_change_status is False


def test_get_work_order_permissions_technician_assignment_logic():
    # Technician assigned to this work order and status In Progress
    perms_assigned = get_work_order_permissions(
        Status.IN_PROGRESS,
        UserRole.TECHNICIAN.value,
        assigned_to="tech1",
        current_user_name="tech1",
    )
    assert perms_assigned.can_edit is True
    assert perms_assigned.can_change_status is True
    assert perms_assigned.can_assign is False
    assert perms_assigned.can_delete is False

    # Technician not assigned should not have edit/change permissions
    perms_not_assigned = get_work_order_permissions(
        Status.IN_PROGRESS,
        UserRole.TECHNICIAN.value,
        assigned_to="tech2",
        current_user_name="tech1",
    )
    assert perms_not_assigned.can_edit is False
    assert perms_not_assigned.can_change_status is False


def test_get_notification_recipients_mapping():
    assert get_notification_recipients("created") == [UserRole.ADMIN]
    assert get_notification_recipients("assigned") == [UserRole.TECHNICIAN]
    assert get_notification_recipients("completed") == [UserRole.HEAD_TECHNICIAN]
    assert get_notification_recipients("rejected") == [UserRole.TECHNICIAN]
    assert get_notification_recipients("approved") == [
        UserRole.REQUESTER,
        UserRole.TECHNICIAN,
    ]
    assert get_notification_recipients("closed") == [UserRole.REQUESTER]

    # Unknown action returns empty list
    assert get_notification_recipients("unknown-action") == []


def test_validate_status_transition_allows_valid_and_raises_for_invalid():
    # Valid transition should not raise
    validate_status_transition(
        Status.OPEN,
        Status.IN_PROGRESS,
        UserRole.ADMIN.value,
    )

    # Invalid transition should raise ValueError
    with pytest.raises(ValueError):
        validate_status_transition(
            Status.OPEN,
            Status.CLOSED,
            UserRole.REQUESTER.value,
        )
