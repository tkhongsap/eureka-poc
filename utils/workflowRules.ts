import { Status, UserRole, WorkOrderStatusTransition, WorkOrderPermissions } from '../types';

/**
 * Work Order Workflow Rules
 * 
 * Workflow:
 * 1. Requester creates WO → status = Open
 * 2. Admin assigns technician → status = In Progress
 * 3. Technician marks job done → status = Pending
 * 4. Head Technician reviews:
 *    - Reject → status = In Progress
 *    - Approve → status = Complete
 * 5. Admin closes → status = Close
 */

// Define allowed status transitions
export const STATUS_TRANSITIONS: WorkOrderStatusTransition[] = [
  // Requester creates work order
  { from: Status.OPEN, to: Status.OPEN, allowedRoles: ['Requester', 'Admin'] },
  
  // Admin assigns technician (Open → In Progress)
  { from: Status.OPEN, to: Status.IN_PROGRESS, allowedRoles: ['Admin'] },
  
  // Technician completes work (In Progress → Pending)
  // Allow Admin to move as well
  { from: Status.IN_PROGRESS, to: Status.PENDING, allowedRoles: ['Technician', 'Admin'] },
  
  // Head Technician or Admin rejects and sends back (Pending → In Progress)
  { from: Status.PENDING, to: Status.IN_PROGRESS, allowedRoles: ['Head Technician', 'Admin'] },
  
  // Head Technician or Admin approves (Pending → Complete)
  { from: Status.PENDING, to: Status.COMPLETED, allowedRoles: ['Head Technician', 'Admin'] },
  
  // Admin closes (Complete → Close)
  { from: Status.COMPLETED, to: Status.CLOSED, allowedRoles: ['Admin'] },
  
  // Admin can move back from Complete to In Progress for corrections
  { from: Status.COMPLETED, to: Status.IN_PROGRESS, allowedRoles: ['Admin'] },

  // Admin cancels (Open → Canceled)
  { from: Status.OPEN, to: Status.CANCELED, allowedRoles: ['Admin'] },
];

/**
 * Check if a status transition is allowed for a user role
 */
export function isTransitionAllowed(
  fromStatus: Status,
  toStatus: Status,
  userRole: UserRole
): boolean {
  return STATUS_TRANSITIONS.some(
    (transition) =>
      transition.from === fromStatus &&
      transition.to === toStatus &&
      transition.allowedRoles.includes(userRole)
  );
}

/**
 * Get allowed next statuses for current status and user role
 */
export function getAllowedNextStatuses(
  currentStatus: Status,
  userRole: UserRole
): Status[] {
  return STATUS_TRANSITIONS
    .filter(
      (transition) =>
        transition.from === currentStatus &&
        transition.allowedRoles.includes(userRole)
    )
    .map((transition) => transition.to);
}

/**
 * Get permissions for a work order based on status and user role
 */
export function getWorkOrderPermissions(
  status: Status,
  userRole: UserRole,
  assignedTo?: string,
  currentUserName?: string
): WorkOrderPermissions {
  const permissions: WorkOrderPermissions = {
    canEdit: false,
    canChangeStatus: false,
    canAssign: false,
    canDelete: false,
    canView: true, // Everyone can view by default
  };

  // Admin has full control except editing closed work orders
  if (userRole === 'Admin') {
    permissions.canEdit = status !== Status.CLOSED;
    permissions.canChangeStatus = true;
    permissions.canAssign = true;
    permissions.canDelete = status === Status.OPEN; // Can only delete Open work orders
  }

  // Head Technician can review (approve/reject) pending work orders
  if (userRole === 'Head Technician') {
    permissions.canEdit = status === Status.PENDING;
    permissions.canChangeStatus = status === Status.PENDING;
    permissions.canAssign = false;
    permissions.canDelete = false;
  }

  // Requester can edit only when status is Open and they created it
  if (userRole === 'Requester') {
    permissions.canEdit = status === Status.OPEN;
    permissions.canChangeStatus = false;
    permissions.canAssign = false;
    permissions.canDelete = status === Status.OPEN;
  }

  // Technician can update only when assigned and status is In Progress
  if (userRole === 'Technician') {
    const isAssigned = assignedTo === currentUserName;
    permissions.canEdit = isAssigned && status === Status.IN_PROGRESS;
    permissions.canChangeStatus = isAssigned && status === Status.IN_PROGRESS;
    permissions.canAssign = false;
    permissions.canDelete = false;
  }

  return permissions;
}

/**
 * Get notification recipients based on workflow action
 */
export function getNotificationRecipients(
  action: 'created' | 'assigned' | 'completed' | 'rejected' | 'approved' | 'closed'
): UserRole[] {
  switch (action) {
    case 'created':
      return ['Admin']; // WO Created → Admin
    case 'assigned':
      return ['Technician']; // Admin Assign → Technician
    case 'completed':
      return ['Head Technician']; // Technician Mark Done → Head Technician for review
    case 'rejected':
      return ['Technician']; // Head Technician Reject → Technician
    case 'approved':
      return ['Requester', 'Technician']; // Head Technician Approve → Requester + Technician
    case 'closed':
      return ['Requester']; // Admin Close → Requester
    default:
      return [];
  }
}

/**
 * Validate work order status transition
 * @throws Error if transition is not allowed
 */
export function validateStatusTransition(
  fromStatus: Status,
  toStatus: Status,
  userRole: UserRole
): void {
  if (!isTransitionAllowed(fromStatus, toStatus, userRole)) {
    throw new Error(
      `Status transition from "${fromStatus}" to "${toStatus}" is not allowed for role "${userRole}"`
    );
  }
}

/**
 * Check if user can perform drag-and-drop status change
 */
export function canDragToStatus(
  currentStatus: Status,
  targetStatus: Status,
  userRole: UserRole
): boolean {
  return isTransitionAllowed(currentStatus, targetStatus, userRole);
}
