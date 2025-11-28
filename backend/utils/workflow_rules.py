"""
Work Order Workflow Rules

Workflow:
1. Requester creates WO → status = Open
2. Admin assigns technician → status = In Progress
3. Technician marks job done → status = Pending
4. Head Technician reviews:
   - Reject → status = In Progress
   - Approve → status = Completed
5. Admin closes → status = Closed
"""

from typing import List, Dict, Set, Tuple
from enum import Enum


class Status(str, Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    PENDING = "Pending"
    COMPLETED = "Completed"
    CLOSED = "Closed"
    CANCELED = "Canceled"


class UserRole(str, Enum):
    REQUESTER = "Requester"
    TECHNICIAN = "Technician"
    ADMIN = "Admin"
    HEAD_TECHNICIAN = "Head Technician"


# Define allowed status transitions: (from_status, to_status): allowed_roles
STATUS_TRANSITIONS: Dict[Tuple[str, str], Set[str]] = {
    # Requester creates work order (stays in Open)
    (Status.OPEN, Status.OPEN): {UserRole.REQUESTER, UserRole.ADMIN},
    
    # Admin assigns technician (Open → In Progress)
    (Status.OPEN, Status.IN_PROGRESS): {UserRole.ADMIN},
    
    # Technician completes work (In Progress → Pending) — allow Admin to move as well
    (Status.IN_PROGRESS, Status.PENDING): {UserRole.TECHNICIAN, UserRole.ADMIN},
    
    # Head Technician rejects and sends back (Pending → In Progress) - Only Head Tech
    (Status.PENDING, Status.IN_PROGRESS): {UserRole.HEAD_TECHNICIAN},
    
    # Head Technician approves (Pending → Completed) - Only Head Tech
    (Status.PENDING, Status.COMPLETED): {UserRole.HEAD_TECHNICIAN},
    
    # Admin closes (Completed → Closed)
    (Status.COMPLETED, Status.CLOSED): {UserRole.ADMIN},
    
    # Admin can move back from Completed to In Progress for corrections
    (Status.COMPLETED, Status.IN_PROGRESS): {UserRole.ADMIN},

    # Admin cancels (Open → Canceled)
    (Status.OPEN, Status.CANCELED): {UserRole.ADMIN},
}


class WorkOrderPermissions:
    """Work order permissions for a specific user role and status"""
    def __init__(
        self,
        can_edit: bool = False,
        can_change_status: bool = False,
        can_assign: bool = False,
        can_delete: bool = False,
        can_view: bool = True
    ):
        self.can_edit = can_edit
        self.can_change_status = can_change_status
        self.can_assign = can_assign
        self.can_delete = can_delete
        self.can_view = can_view


def is_transition_allowed(
    from_status: str,
    to_status: str,
    user_role: str
) -> bool:
    """
    Check if a status transition is allowed for a user role
    
    Args:
        from_status: Current work order status
        to_status: Desired work order status
        user_role: User's role (Requester, Technician, Admin, Head Technician)
    
    Returns:
        True if transition is allowed, False otherwise
    """
    transition_key = (from_status, to_status)
    allowed_roles = STATUS_TRANSITIONS.get(transition_key, set())
    # Compare string user_role with enum values
    return any(role.value == user_role for role in allowed_roles)


def get_allowed_next_statuses(
    current_status: str,
    user_role: str
) -> List[str]:
    """
    Get allowed next statuses for current status and user role
    
    Args:
        current_status: Current work order status
        user_role: User's role
    
    Returns:
        List of allowed next statuses
    """
    allowed_statuses = []
    for (from_status, to_status), allowed_roles in STATUS_TRANSITIONS.items():
        if from_status == current_status and user_role in allowed_roles:
            allowed_statuses.append(to_status)
    return allowed_statuses


def get_work_order_permissions(
    status: str,
    user_role: str,
    assigned_to: str = None,
    current_user_name: str = None
) -> WorkOrderPermissions:
    """
    Get permissions for a work order based on status and user role
    
    Args:
        status: Work order status
        user_role: User's role
        assigned_to: Name of assigned technician
        current_user_name: Name of current user
    
    Returns:
        WorkOrderPermissions object
    """
    permissions = WorkOrderPermissions()
    
    # Admin has full control except editing closed work orders
    if user_role == UserRole.ADMIN.value:
        permissions.can_edit = status not in (Status.CLOSED, Status.CANCELED)
        permissions.can_change_status = True
        permissions.can_assign = True
        permissions.can_delete = status == Status.OPEN
    
    # Head Technician can review (approve/reject) pending work orders
    elif user_role == UserRole.HEAD_TECHNICIAN.value:
        permissions.can_edit = status == Status.PENDING
        permissions.can_change_status = status == Status.PENDING
        permissions.can_assign = False
        permissions.can_delete = False
    
    # Requester can edit only when status is Open
    elif user_role == UserRole.REQUESTER.value:
        permissions.can_edit = status == Status.OPEN
        permissions.can_change_status = False
        permissions.can_assign = False
        permissions.can_delete = status == Status.OPEN
    
    # Technician can update only when assigned and status is In Progress
    elif user_role == UserRole.TECHNICIAN.value:
        is_assigned = assigned_to == current_user_name
        permissions.can_edit = is_assigned and status == Status.IN_PROGRESS
        permissions.can_change_status = is_assigned and status == Status.IN_PROGRESS
        permissions.can_assign = False
        permissions.can_delete = False
    
    return permissions


def get_notification_recipients(action: str) -> List[str]:
    """
    Get notification recipients based on workflow action
    
    Args:
        action: Workflow action (created, assigned, completed, rejected, approved, closed)
    
    Returns:
        List of user roles that should receive notifications
    """
    notification_map = {
        'created': [UserRole.ADMIN],
        'assigned': [UserRole.TECHNICIAN],
        'completed': [UserRole.HEAD_TECHNICIAN],  # Notify Head Technician for review
        'rejected': [UserRole.TECHNICIAN],
        'approved': [UserRole.REQUESTER, UserRole.TECHNICIAN],
        'closed': [UserRole.REQUESTER],
    }
    return notification_map.get(action, [])


def validate_status_transition(
    from_status: str,
    to_status: str,
    user_role: str
) -> None:
    """
    Validate work order status transition
    
    Args:
        from_status: Current status
        to_status: Desired status
        user_role: User's role
    
    Raises:
        ValueError: If transition is not allowed
    """
    if not is_transition_allowed(from_status, to_status, user_role):
        raise ValueError(
            f"Status transition from '{from_status}' to '{to_status}' "
            f"is not allowed for role '{user_role}'"
        )
