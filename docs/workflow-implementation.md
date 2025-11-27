# Work Order Workflow Implementation - Phase 1

## Overview
This document describes the Work Order Workflow implementation for the Eureka CMMS system.

## Status Definitions

The system supports 5 work order statuses:
- **Open**: Work order created, awaiting assignment
- **In Progress**: Technician assigned and working on the task
- **Pending**: Technician completed work, awaiting admin review
- **Completed**: Admin approved the work
- **Closed**: Work order closed and archived

## Workflow Rules

### 1. Work Order Creation
- **Action**: Requester creates WO
- **Initial Status**: Open
- **Allowed Roles**: Requester, Admin

### 2. Assignment
- **Action**: Admin assigns technician
- **Status Transition**: Open → In Progress
- **Allowed Roles**: Admin only

### 3. Work Completion
- **Action**: Technician marks job done
- **Status Transition**: In Progress → Pending
- **Allowed Roles**: Technician (must be assigned to the WO)

### 4. Admin Review
#### Option A: Reject
- **Action**: Admin rejects work
- **Status Transition**: Pending → In Progress
- **Allowed Roles**: Admin only

#### Option B: Approve
- **Action**: Admin approves work
- **Status Transition**: Pending → Completed
- **Allowed Roles**: Admin only

### 5. Closure
- **Action**: Admin closes work order
- **Status Transition**: Completed → Closed
- **Allowed Roles**: Admin only

## Permission Matrix

| Role | Open | In Progress | Pending | Completed | Closed |
|------|------|-------------|---------|----------|-------|
| **Requester** | Edit, Delete | View only | View only | View only | View only |
| **Technician** | View only | Edit (if assigned) | View only | View only | View only |
| **Admin** | Full control | Full control | Full control | Full control | View only |

### Detailed Permissions

#### Requester
- **Can Edit**: Only when status = Open
- **Can Delete**: Only when status = Open
- **Can Change Status**: No
- **Can Assign**: No

#### Technician
- **Can Edit**: Only when assigned AND status = In Progress
- **Can Change Status**: Only In Progress → Pending
- **Can Assign**: No
- **Can Delete**: No

#### Admin
- **Can Edit**: All statuses except Closed
- **Can Change Status**: All transitions
- **Can Assign**: Yes
- **Can Delete**: Only when status = Open

## Notification Rules

| Event | Trigger | Recipients |
|-------|---------|-----------|
| WO Created | Requester creates WO | Admin |
| WO Assigned | Admin assigns technician | Technician |
| Work Done | Technician marks complete | Admin |
| Work Rejected | Admin rejects | Technician |
| Work Approved | Admin approves | Requester + Technician |
| WO Closed | Admin closes | Requester |

## Implementation Files

### 1. Type Definitions (`types.ts`)
- Added `WorkOrderStatusTransition` interface
- Added `WorkOrderPermissions` interface
- Added `WorkOrderNotification` interface

### 2. Workflow Rules (`utils/workflowRules.ts`)
- `STATUS_TRANSITIONS`: Defines all allowed status transitions
- `isTransitionAllowed()`: Validates if a transition is allowed for a user role
- `getAllowedNextStatuses()`: Gets valid next statuses for current state and role
- `getWorkOrderPermissions()`: Calculates permissions based on status and role
- `getNotificationRecipients()`: Determines who should be notified for each action
- `validateStatusTransition()`: Throws error if transition is invalid

## Usage Examples

### Example 1: Check if Admin can approve work
```typescript
import { isTransitionAllowed, Status } from './utils/workflowRules';

const canApprove = isTransitionAllowed(
  Status.PENDING,
  Status.COMPLETED,
  'Admin'
);
// Returns: true
```

### Example 2: Get permissions for a technician
```typescript
import { getWorkOrderPermissions, Status } from './utils/workflowRules';

const permissions = getWorkOrderPermissions(
  Status.IN_PROGRESS,
  'Technician',
  'John Doe',  // assigned to
  'John Doe'   // current user
);
// Returns: { canEdit: true, canChangeStatus: true, ... }
```

### Example 3: Validate status transition
```typescript
import { validateStatusTransition, Status } from './utils/workflowRules';

try {
  validateStatusTransition(
    Status.PENDING,
    Status.CLOSE,
    'Technician'
  );
} catch (error) {
  // Throws: Status transition from "Pending" to "Close" is not allowed for role "Technician"
}
```

## Next Steps (Phase 2)

1. **Backend Integration**
   - Add status transition validation to work order update endpoint
   - Implement permission checks before allowing updates
   - Add audit logging for status changes

2. **Frontend Integration**
   - Update WorkOrders component to enforce permissions
   - Disable/hide actions based on user role and status
   - Add visual feedback for allowed transitions
   - Implement notification toast system

3. **Notification System**
   - Create notification service
   - Implement email/SMS notifications
   - Add in-app notification center
   - Track notification delivery status

## Testing Checklist

- [ ] Verify Requester can only edit Open work orders
- [ ] Verify Technician can only update assigned In Progress work orders
- [ ] Verify Admin can perform all actions except editing Closed work orders
- [ ] Verify invalid status transitions are blocked
- [ ] Verify notifications are sent to correct recipients
- [ ] Verify audit trail captures all status changes
