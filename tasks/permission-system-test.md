# Permission System - Comprehensive Testing Guide
## Eureka CMMS Work Order Permission Rules Testing

---

## 📋 Permission Rules Overview

### Requestor (Requester)
- ✅ **Can Edit**: Only when status = "Open"
- 🔒 **Read-Only**: All other statuses (In Progress, Pending, Completed, Closed)
- ✅ **Can View**: All work orders they created
- ❌ **Cannot**: Assign technicians, approve, reject, or close

### Technician
- ✅ **Can Update**: Only when status = "In Progress" AND assigned to them
- 🔒 **Read-Only**: 
  - Work orders not assigned to them
  - Work orders in other statuses (Open, Pending, Completed, Closed)
- ✅ **Can View**: All work orders (with "Show Only My Jobs" filter)
- ❌ **Cannot**: Create, assign, approve, reject, or close

### Admin
- ✅ **Full Control**: Can manage work orders in all statuses EXCEPT Closed
- ✅ **Can**:
  - Assign technicians (when Open)
  - Review and approve/reject (when Pending)
  - Close work orders (when Completed)
- 🔒 **Read-Only**: Closed work orders (cannot reopen or edit)
- ✅ **Can View**: All work orders in the system

---

## 🧪 Test Matrix

| Role | Status | Can Edit | Can View Details | Can Assign | Can Update Work | Can Approve | Can Reject | Can Close |
|------|--------|----------|------------------|------------|-----------------|-------------|------------|-----------|
| **Requester** | Open | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Requester | In Progress | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Requester | Pending | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Requester | Completed | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Requester | Closed | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Technician** | Open | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Technician | In Progress (Assigned) | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Technician | In Progress (Not Assigned) | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Technician | Pending | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Technician | Completed | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Technician | Closed | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Admin** | Open | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Admin | In Progress | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Admin | Pending | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Admin | Completed | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Admin | Closed | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🔍 Test Scenario 1: Requester Permissions

### Test 1.1: Requester Can Edit Work Order (Status = Open)

**Setup:**
1. Login as Requester (Sarah Line)
2. Create a new work order
3. Work order status should be "Open"

**Test Steps:**
1. Navigate to Work Orders page
2. Click on the newly created work order

**Expected Results:**
- ✅ Detail panel opens
- ✅ Badge shows "✓ Editable" in green
- ✅ Can see and edit these fields:
  - Location
  - Priority (dropdown)
  - Description (textarea)
  - Upload/remove images
- ✅ Edit sections are enabled and visible
- ✅ Changes can be saved

**Validation Code:**
```javascript
// In browser console
const workOrder = /* your work order object */;
const user = { role: 'Requester', name: 'Sarah Line' };
const permissions = getWorkOrderPermissions(workOrder, user);

console.log('Permissions:', permissions);
// Expected: { canEdit: true, canView: true, canDelete: false }
```

**✅ Pass Criteria:**
- Green "✓ Editable" badge visible
- All edit fields are active (not disabled)
- Save button works
- Changes persist in backend

**❌ Failure Indicators:**
- Red "🔒 Read-only" badge appears
- Fields are disabled or grayed out
- No edit sections visible
- Cannot modify any content

---

### Test 1.2: Requester CANNOT Edit Work Order (Status = In Progress)

**Setup:**
1. Use work order from Test 1.1
2. Login as Admin, assign a technician (status → In Progress)
3. Logout and login as Requester again

**Test Steps:**
1. Navigate to Work Orders
2. Click on the work order (now "In Progress")

**Expected Results:**
- ✅ Detail panel opens
- ✅ Badge shows "🔒 Read-only" in red
- ✅ All fields are read-only (disabled)
- ❌ No edit sections visible
- ❌ Cannot modify location, priority, or description
- ❌ Cannot upload/remove images
- ✅ Can only view information

**Validation Code:**
```javascript
const workOrder = { status: 'In Progress', createdBy: 'Sarah Line' };
const user = { role: 'Requester', name: 'Sarah Line' };
const permissions = getWorkOrderPermissions(workOrder, user);

console.log('Permissions:', permissions);
// Expected: { canEdit: false, canView: true, canDelete: false }
```

**✅ Pass Criteria:**
- Red "🔒 Read-only" badge visible
- All fields disabled
- No save/edit buttons
- Work order is view-only

---

### Test 1.3: Requester Cannot Edit in Other Statuses

**Test each status:**
- [ ] **Pending**: Read-only ✅
- [ ] **Completed**: Read-only ✅
- [ ] **Closed**: Read-only ✅

**Validation:**
All should show "🔒 Read-only" badge and disabled fields.

---

## 🔧 Test Scenario 2: Technician Permissions

### Test 2.1: Technician Can Update Assigned Work Order (Status = In Progress)

**Setup:**
1. Create work order as Requester
2. Login as Admin, assign to "John Doe"
3. Login as Technician (John Doe)

**Test Steps:**
1. Navigate to Work Orders
2. Optionally enable "Show Only My Jobs" filter
3. Click on the assigned work order

**Expected Results:**
- ✅ Detail panel opens
- ✅ Badge shows "🔒 Read-only" (cannot edit requester fields)
- ✅ Blue "Complete Work & Submit" section visible
- ✅ Can add work notes (textarea)
- ✅ Can upload work images
- ✅ "Mark as Done & Submit for Review" button enabled
- ❌ Cannot edit location, priority, or description
- ❌ Cannot assign/unassign themselves

**Validation Code:**
```javascript
const workOrder = { 
  status: 'In Progress', 
  assignedTo: 'John Doe' 
};
const user = { role: 'Technician', name: 'John Doe' };
const permissions = getWorkOrderPermissions(workOrder, user);

console.log('Can Technician Update:', permissions.canEdit);
// Expected: false (cannot edit base fields)
// But special technician update section should be visible
```

**Check Component Logic:**
```typescript
// In WorkOrders.tsx
const canTechnicianUpdate = 
  currentUser?.role === 'Technician' && 
  selectedWorkOrder.status === 'In Progress' && 
  selectedWorkOrder.assignedTo === currentUser.name;

console.log('Can Update Work:', canTechnicianUpdate);
// Expected: true
```

**✅ Pass Criteria:**
- Blue technician section visible
- Can add notes and images
- Can submit completion
- Cannot edit requester fields

---

### Test 2.2: Technician CANNOT Update Non-Assigned Work Order

**Setup:**
1. Create work order and assign to "John Doe"
2. Login as different Technician (e.g., "Sarah M.")

**Test Steps:**
1. Navigate to Work Orders
2. Click on work order assigned to "John Doe"

**Expected Results:**
- ✅ Detail panel opens
- ✅ Badge shows "🔒 Read-only"
- ❌ Blue technician section NOT visible
- ❌ Cannot add work notes
- ❌ Cannot submit completion
- ✅ Can only view work order details

**Validation Code:**
```javascript
const workOrder = { 
  status: 'In Progress', 
  assignedTo: 'John Doe' 
};
const user = { role: 'Technician', name: 'Sarah M.' };
const canUpdate = 
  user.role === 'Technician' && 
  workOrder.status === 'In Progress' && 
  workOrder.assignedTo === user.name;

console.log('Can Sarah M. Update:', canUpdate);
// Expected: false
```

**✅ Pass Criteria:**
- No technician update section
- Read-only access only
- Cannot modify work order

---

### Test 2.3: Technician Cannot Update in Other Statuses

**Test with assigned technician:**
- [ ] **Open**: No update section ✅
- [ ] **Pending**: No update section ✅
- [ ] **Completed**: No update section ✅
- [ ] **Closed**: No update section ✅

**Validation:**
Even if assigned, technician can only update when status = "In Progress".

---

### Test 2.4: "Show Only My Jobs" Filter

**Setup:**
1. Create 3 work orders
2. Assign 2 to "John Doe"
3. Assign 1 to "Sarah M."
4. Login as "John Doe"

**Test Steps:**
1. Navigate to Work Orders
2. Toggle "Show Only My Jobs" ON

**Expected Results:**
- ✅ Only 2 work orders visible (assigned to John Doe)
- ✅ Work order assigned to Sarah M. is hidden

**Test Steps:**
3. Toggle "Show Only My Jobs" OFF

**Expected Results:**
- ✅ All 3 work orders visible

**✅ Pass Criteria:**
- Filter correctly shows only assigned work orders
- Filter toggle works smoothly
- Filter state persists during session

---

## 👨‍💼 Test Scenario 3: Admin Permissions

### Test 3.1: Admin Can Assign Technician (Status = Open)

**Setup:**
1. Create work order as Requester (status = Open)
2. Login as Admin

**Test Steps:**
1. Navigate to Work Orders
2. Click on the "Open" work order

**Expected Results:**
- ✅ Detail panel opens
- ✅ Purple "Assign Technician" section visible
- ✅ Technician dropdown populated with available technicians
- ✅ "Assign & Start Work Order" button enabled
- ✅ Can select technician and assign

**Validation Code:**
```javascript
const workOrder = { status: 'Open' };
const user = { role: 'Admin' };

const canAssign = user.role === 'Admin' && workOrder.status === 'Open';
console.log('Can Assign:', canAssign);
// Expected: true
```

**✅ Pass Criteria:**
- Purple section visible
- Dropdown works
- Assignment succeeds
- Status changes to "In Progress"

---

### Test 3.2: Admin Can Review Work (Status = Pending)

**Setup:**
1. Get work order to "Pending" status (Technician marked as done)
2. Login as Admin

**Test Steps:**
1. Navigate to Work Orders
2. Click on "Pending" work order

**Expected Results:**
- ✅ Purple "Review Work Completion" section visible
- ✅ Can see technician's work notes
- ✅ Can see technician's uploaded images
- ✅ "Approve Work Order" button (green) enabled
- ✅ Rejection section with reason textarea enabled
- ✅ "Reject & Send Back" button (red) enabled

**Validation Code:**
```javascript
const workOrder = { status: 'Pending' };
const user = { role: 'Admin' };

const canReview = user.role === 'Admin' && workOrder.status === 'Pending';
console.log('Can Review:', canReview);
// Expected: true
```

**✅ Pass Criteria:**
- Review section visible
- Both approve and reject options available
- Can execute either action

---

### Test 3.3: Admin Can Close Work Order (Status = Completed)

**Setup:**
1. Get work order to "Completed" status (Admin approved)
2. Login as Admin

**Test Steps:**
1. Navigate to Work Orders
2. Click on "Completed" work order

**Expected Results:**
- ✅ Purple "Close Work Order" section visible
- ✅ Shows completion summary
- ✅ "Close Work Order" button enabled
- ✅ Can click and close

**Validation Code:**
```javascript
const workOrder = { status: 'Completed' };
const user = { role: 'Admin' };

const canClose = user.role === 'Admin' && workOrder.status === 'Completed';
console.log('Can Close:', canClose);
// Expected: true
```

**✅ Pass Criteria:**
- Close section visible
- Close button works
- Status changes to "Closed"

---

### Test 3.4: Admin CANNOT Edit Closed Work Order

**Setup:**
1. Close a work order (status = Closed)
2. Stay logged in as Admin

**Test Steps:**
1. Click on "Closed" work order

**Expected Results:**
- ✅ Detail panel opens
- ✅ Badge shows "🔒 Read-only"
- ❌ No purple admin sections visible
- ❌ Cannot assign, approve, reject, or close
- ❌ Cannot reopen work order
- ✅ All fields are read-only

**Validation Code:**
```javascript
const workOrder = { status: 'Closed' };
const user = { role: 'Admin' };
const permissions = getWorkOrderPermissions(workOrder, user);

console.log('Can Admin Edit Closed:', permissions.canEdit);
// Expected: false
```

**✅ Pass Criteria:**
- No admin action sections
- Complete read-only state
- Cannot modify closed work orders

---

### Test 3.5: Admin Cannot Perform Wrong Actions

**Test invalid operations:**
- [ ] Cannot assign when status ≠ Open
- [ ] Cannot approve/reject when status ≠ Pending
- [ ] Cannot close when status ≠ Completed

**Expected:**
Purple sections should not appear for wrong statuses.

---

## 🎯 Test Scenario 4: Cross-Role Boundary Testing

### Test 4.1: Requester Tries to Access Admin Functions

**Setup:**
1. Login as Requester
2. View any work order

**Expected Results:**
- ❌ No purple "Assign Technician" section
- ❌ No purple "Review Work" section
- ❌ No purple "Close Work Order" section
- ❌ Cannot drag work orders to change status
- ✅ Can only view and edit (when Open)

**Validation:**
Check that admin-specific UI elements don't appear for Requester role.

---

### Test 4.2: Technician Tries to Access Admin Functions

**Setup:**
1. Login as Technician
2. View any work order

**Expected Results:**
- ❌ No purple admin sections
- ❌ No ability to assign or close
- ✅ Only blue technician section (when applicable)

---

### Test 4.3: Non-Owner Requester Access

**Setup:**
1. Requester A creates work order
2. Login as Requester B

**Test Steps:**
1. View Requester A's work order

**Expected Results:**
- ✅ Can view work order
- ❌ Cannot edit (even if status = Open)
- 🔒 Read-only access

**Validation Code:**
```javascript
const workOrder = { 
  status: 'Open', 
  createdBy: 'Sarah Line' 
};
const user = { 
  role: 'Requester', 
  name: 'John User' 
};
const permissions = getWorkOrderPermissions(workOrder, user);

console.log('Can Other Requester Edit:', permissions.canEdit);
// Expected: false (only creator can edit)
```

---

## 🔐 Test Scenario 5: Permission Function Testing

### Test 5.1: getWorkOrderPermissions() Function

**Test all combinations:**

```javascript
// Test cases
const testCases = [
  // Requester tests
  {
    workOrder: { status: 'Open', createdBy: 'Sarah Line' },
    user: { role: 'Requester', name: 'Sarah Line' },
    expected: { canEdit: true, canView: true, canDelete: false }
  },
  {
    workOrder: { status: 'In Progress', createdBy: 'Sarah Line' },
    user: { role: 'Requester', name: 'Sarah Line' },
    expected: { canEdit: false, canView: true, canDelete: false }
  },
  // Technician tests
  {
    workOrder: { status: 'In Progress', assignedTo: 'John Doe' },
    user: { role: 'Technician', name: 'John Doe' },
    expected: { canEdit: false, canView: true, canDelete: false }
  },
  {
    workOrder: { status: 'In Progress', assignedTo: 'Sarah M.' },
    user: { role: 'Technician', name: 'John Doe' },
    expected: { canEdit: false, canView: true, canDelete: false }
  },
  // Admin tests
  {
    workOrder: { status: 'Open' },
    user: { role: 'Admin' },
    expected: { canEdit: false, canView: true, canDelete: true }
  },
  {
    workOrder: { status: 'Closed' },
    user: { role: 'Admin' },
    expected: { canEdit: false, canView: true, canDelete: false }
  }
];

// Run tests
testCases.forEach((test, index) => {
  const result = getWorkOrderPermissions(test.workOrder, test.user);
  const passed = JSON.stringify(result) === JSON.stringify(test.expected);
  console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  if (!passed) {
    console.log('Expected:', test.expected);
    console.log('Got:', result);
  }
});
```

---

## 🚀 Test Scenario 6: UI Badge Testing

### Test 6.1: Badge Display Logic

**Test all scenarios:**

| Role | Status | Created By | Assigned To | Expected Badge |
|------|--------|------------|-------------|----------------|
| Requester | Open | Same User | - | ✓ Editable (Green) |
| Requester | Open | Other User | - | 🔒 Read-only (Red) |
| Requester | In Progress | Same User | - | 🔒 Read-only (Red) |
| Technician | In Progress | - | Same User | 🔒 Read-only (Red)* |
| Technician | In Progress | - | Other User | 🔒 Read-only (Red) |
| Admin | Open | - | - | 🔒 Read-only (Red)* |
| Admin | Closed | - | - | 🔒 Read-only (Red) |

*Note: Red badge but has special action sections (blue for tech, purple for admin)

**Validation:**
Check that badge color and text match expected values.

---

## 📊 Test Execution Checklist

### Requester Permission Tests
- [ ] Test 1.1: Can edit when Open ✅
- [ ] Test 1.2: Cannot edit when In Progress ✅
- [ ] Test 1.3: Cannot edit in other statuses ✅

### Technician Permission Tests
- [ ] Test 2.1: Can update assigned WO (In Progress) ✅
- [ ] Test 2.2: Cannot update non-assigned WO ✅
- [ ] Test 2.3: Cannot update in other statuses ✅
- [ ] Test 2.4: "Show Only My Jobs" filter works ✅

### Admin Permission Tests
- [ ] Test 3.1: Can assign (Open) ✅
- [ ] Test 3.2: Can review (Pending) ✅
- [ ] Test 3.3: Can close (Completed) ✅
- [ ] Test 3.4: Cannot edit Closed ✅
- [ ] Test 3.5: Cannot perform wrong actions ✅

### Cross-Role Boundary Tests
- [ ] Test 4.1: Requester cannot access Admin functions ✅
- [ ] Test 4.2: Technician cannot access Admin functions ✅
- [ ] Test 4.3: Non-owner Requester cannot edit ✅

### Function Tests
- [ ] Test 5.1: getWorkOrderPermissions() works correctly ✅

### UI Badge Tests
- [ ] Test 6.1: Badges display correctly for all scenarios ✅

---

## 🐛 Common Permission Issues

### Issue 1: Edit Sections Appear When They Shouldn't

**Check:**
```typescript
// In component
const canEdit = getWorkOrderPermissions(workOrder, currentUser).canEdit;

// Should be used to conditionally render edit sections
{canEdit && (
  <div>Edit controls here</div>
)}
```

### Issue 2: Wrong Role Sees Admin Sections

**Check:**
```typescript
// Admin sections should check
{currentUser?.role === 'Admin' && workOrder.status === 'Open' && (
  <div>Assign technician section</div>
)}
```

### Issue 3: Technician Cannot Update Assigned Work

**Debug:**
```javascript
console.log('User:', currentUser);
console.log('Work Order:', selectedWorkOrder);
console.log('Can Update:', 
  currentUser?.role === 'Technician' && 
  selectedWorkOrder.status === 'In Progress' && 
  selectedWorkOrder.assignedTo === currentUser.name
);
```

### Issue 4: Badge Shows Wrong State

**Check:**
```typescript
// Badge logic
const canEdit = getWorkOrderPermissions(selectedWorkOrder, currentUser).canEdit;

<span className={canEdit ? 'text-green-600' : 'text-red-600'}>
  {canEdit ? '✓ Editable' : '🔒 Read-only'}
</span>
```

---

## ✅ Success Criteria

All tests pass when:

1. **Requester:**
   - ✅ Can edit only own Open work orders
   - ✅ All other statuses are read-only

2. **Technician:**
   - ✅ Can update only assigned In Progress work orders
   - ✅ Special update section appears only when allowed
   - ✅ Filter shows only assigned jobs

3. **Admin:**
   - ✅ Can assign when Open
   - ✅ Can review when Pending
   - ✅ Can close when Completed
   - ✅ Cannot edit Closed

4. **Boundaries:**
   - ✅ Roles cannot access other roles' functions
   - ✅ No permission escalation possible
   - ✅ Badges accurately reflect permissions

5. **UI:**
   - ✅ Correct sections appear for each role/status
   - ✅ Badges show correct state
   - ✅ Disabled fields cannot be edited

---

## 📝 Test Report Template

```
=== PERMISSION SYSTEM TEST REPORT ===
Date: _______________
Tester: _______________

REQUESTER TESTS:
- Edit when Open: ☐ Pass ☐ Fail
- Read-only other statuses: ☐ Pass ☐ Fail

TECHNICIAN TESTS:
- Update assigned In Progress: ☐ Pass ☐ Fail
- Cannot update non-assigned: ☐ Pass ☐ Fail
- Filter "My Jobs": ☐ Pass ☐ Fail

ADMIN TESTS:
- Assign (Open): ☐ Pass ☐ Fail
- Review (Pending): ☐ Pass ☐ Fail
- Close (Completed): ☐ Pass ☐ Fail
- Cannot edit Closed: ☐ Pass ☐ Fail

BOUNDARY TESTS:
- No cross-role access: ☐ Pass ☐ Fail
- Badges accurate: ☐ Pass ☐ Fail

OVERALL RESULT: ☐ PASS ☐ FAIL

ISSUES FOUND:


NOTES:
```
