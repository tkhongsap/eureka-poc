# End-to-End Workflow Test Plan
## Eureka CMMS - Work Order Workflow Testing

### Test Overview
This document provides a comprehensive end-to-end test plan for the Work Order Workflow system, covering all user roles, status transitions, permissions, and notifications.

---

## Test Scenario 1: Complete Workflow (Happy Path)

### Objective
Verify the complete work order lifecycle from creation to closure with all workflow rules and notifications working correctly.

### Prerequisites
- Backend server running on port 8000
- Frontend server running on port 5173
- Three user accounts available: Admin, Technician, Requester

### Test Steps

#### Step 1: Requester Creates Work Order
**Actor:** Requester (Sarah Line)

1. Login as Requester
2. Navigate to Work Request Portal
3. Fill in work request form:
   - Location: "Assembly Line 3"
   - Priority: "High"
   - Description: "Hydraulic pump making unusual noise"
   - Upload images (optional)
4. Submit request

**Expected Results:**
- ✅ Work order created with status = "Open"
- ✅ Work order appears in Work Orders view
- ✅ Notification created for Admin (WO_CREATED)
- ✅ Admin sees notification in bell icon

**Validation:**
- Check `storage/information/workorders.json` - new WO with status "Open"
- Check `storage/information/notifications.json` - notification for Admin
- Admin bell icon shows unread count +1

---

#### Step 2: Admin Assigns Technician
**Actor:** Admin (Alex Sterling)

1. Switch to Admin account
2. Check notifications - should see "New work order created" notification
3. Navigate to Work Orders
4. Click on the newly created work order
5. In the purple "Assign Technician" section:
   - Select a technician from dropdown (e.g., "John Doe")
   - Set preferred date (วันนัดหมาย) - optional, for advance scheduling
   - Click "Assign & Start Work Order"

**Expected Results:**
- ✅ Status changes to "In Progress"
- ✅ Work order shows assigned technician
- ✅ If preferredDate set: dueDate = preferredDate + 7 days (auto-calculated)
- ✅ Purple section shows "Work order is now in progress"
- ✅ Notification created for assigned Technician (WO_ASSIGNED)
- ✅ Technician sees notification: "You have been assigned to work order"

**Validation:**
- Work order status = "In Progress"
- assignedTo field = selected technician name
- preferredDate and dueDate fields saved (if set)
- Notification in storage for Technician
- Technician bell icon shows unread count +1

---

#### Step 3: Technician Completes Work
**Actor:** Technician (John Doe)

1. Switch to Technician account
2. Check notifications - should see "You have been assigned" notification
3. Navigate to Work Orders
4. Enable "Show Only My Jobs" filter (optional)
5. Click on assigned work order
6. In the blue "Complete Work & Submit" section:
   - Add work notes: "Replaced hydraulic seal, refilled fluid, tested operation"
   - Upload work photos (optional)
   - Click "Mark as Done & Submit for Review"

**Expected Results:**
- ✅ Status changes to "Pending"
- ✅ Work order moves to Pending column
- ✅ Detail panel closes
- ✅ Notification created for Admin (WO_COMPLETED)
- ✅ Admin sees notification: "Work order has been completed and is pending review"

**Validation:**
- Work order status = "Pending"
- technicianNotes field populated
- technicianImages array populated (if photos added)
- Notification in storage for Admin
- Admin bell icon shows unread count +1

---

#### Step 4: Admin Reviews and Approves
**Actor:** Admin (Alex Sterling)

1. Switch to Admin account
2. Check notifications - should see "Work order completed" notification
3. Navigate to Work Orders
4. Click on the pending work order
5. In the purple "Review Work Completion" section:
   - Review technician's work notes
   - Review work photos (if any)
   - Click "Approve Work Order" (green button)

**Expected Results:**
- ✅ Status changes to "Completed"
- ✅ Work order moves to Completed column
- ✅ Two notifications created:
   - WO_APPROVED for Requester: "Your work order has been approved and completed"
   - WO_APPROVED for Technician: "Work order has been approved"
- ✅ Requester and Technician see notifications

**Validation:**
- Work order status = "Completed"
- Notifications in storage for both Requester and Technician
- Both users' bell icons show unread count +1

---

#### Step 5: Admin Closes Work Order
**Actor:** Admin (Alex Sterling)

1. Stay logged in as Admin
2. Click on the completed work order
3. In the purple "Close Work Order" section:
   - Review completion status
   - Click "Close Work Order"

**Expected Results:**
- ✅ Status changes to "Closed"
- ✅ Work order moves to Closed column
- ✅ Work order becomes read-only (cannot be edited)
- ✅ Notification created for Requester (WO_CLOSED)
- ✅ Requester sees notification: "Work order has been closed"

**Validation:**
- Work order status = "Closed"
- Notification in storage for Requester
- Requester bell icon shows unread count +1
- Attempting to edit work order shows read-only state

---

## Test Scenario 2: Rejection Flow

### Objective
Verify the rejection workflow when Admin is not satisfied with completed work.

### Test Steps

#### Setup
Follow Steps 1-3 from Scenario 1 to get a work order to "Pending" status.

#### Step 4 (Alternative): Admin Rejects Work
**Actor:** Admin (Alex Sterling)

1. Login as Admin
2. Navigate to pending work order
3. In the purple "Review Work Completion" section:
   - Scroll to rejection section
   - Enter rejection reason: "Missing photos of completed repair"
   - Click "Reject & Send Back" (red button)

**Expected Results:**
- ✅ Status changes back to "In Progress"
- ✅ Work order moves back to In Progress column
- ✅ Rejection reason stored
- ✅ Notification created for Technician (WO_REJECTED)
- ✅ Technician sees notification with reason: "Work order needs revision. Reason: Missing photos of completed repair"

**Validation:**
- Work order status = "In Progress"
- rejectionReason field populated
- Notification in storage for Technician
- Technician can see rejection reason
- Technician can update work order again

#### Step 5: Technician Addresses Rejection
**Actor:** Technician (John Doe)

1. Switch to Technician account
2. Check notifications - should see rejection notification with reason
3. Navigate to work order
4. Update work notes and add missing photos
5. Submit again

**Expected Results:**
- ✅ Status changes to "Pending" again
- ✅ Admin receives new completion notification
- ✅ Workflow can proceed to approval

---

## Test Scenario 3: Permission Validation

### Objective
Verify that permission rules are enforced correctly for all user roles.

### Test Cases

#### TC 3.1: Requester Editing Permissions
**Test:** Requester can only edit when status = "Open"

1. As Requester, create a work order (status = "Open")
   - ✅ Should see "✓ Editable" badge
   - ✅ Can edit description, priority, etc.

2. As Admin, assign technician (status → "In Progress")

3. As Requester, try to view same work order
   - ✅ Should see "🔒 Read-only" badge
   - ✅ Cannot edit any fields
   - ✅ No edit sections visible

**Validation:** Requestor permissions correctly restricted after status change

---

#### TC 3.2: Technician Editing Permissions
**Test:** Technician can only update when status = "In Progress" AND assigned to them

1. Create work order, assign to "John Doe"
2. Login as "John Doe"
   - ✅ Should see blue "Complete Work & Submit" section
   - ✅ Can add notes and photos

3. As different technician ("Sarah M.")
   - ✅ Should see work order as read-only
   - ✅ No update section visible

4. After submitting (status → "Pending")
   - ✅ Original technician cannot edit anymore
   - ✅ Section disappears

**Validation:** Technician permissions correctly enforced based on assignment and status

---

#### TC 3.3: Admin Full Control
**Test:** Admin can manage all work orders except closed ones

1. As Admin, view work orders in all statuses:
   - Open: ✅ Can assign technician
   - In Progress: ✅ Can view, cannot edit technician work
   - Pending: ✅ Can approve or reject
   - Completed: ✅ Can close
   - Closed: ✅ Read-only, no edit options

**Validation:** Admin has appropriate controls for each status

---

## Test Scenario 4: Notification System

### Objective
Verify all notification events are triggered and delivered correctly.

### Notification Event Tests

#### NE 4.1: Work Order Created
- **Trigger:** Requester creates WO
- **Recipient:** Admin
- **Message:** "New work order created: [Title]"
- **Color:** Teal
- **Validation:** Check Admin's notification center

#### NE 4.2: Work Order Assigned
- **Trigger:** Admin assigns technician
- **Recipient:** Assigned Technician
- **Message:** "You have been assigned to work order: [Title]"
- **Color:** Purple
- **Validation:** Check Technician's notification center

#### NE 4.3: Work Order Completed
- **Trigger:** Technician marks as done
- **Recipient:** Admin
- **Message:** "Work order [Title] has been completed and is pending review"
- **Color:** Blue
- **Validation:** Check Admin's notification center

#### NE 4.4: Work Order Approved
- **Trigger:** Admin approves
- **Recipients:** Requester + Technician (2 notifications)
- **Messages:**
  - Requester: "Your work order [Title] has been approved and completed"
  - Technician: "Work order [Title] has been approved"
- **Color:** Emerald
- **Validation:** Check both users' notification centers

#### NE 4.5: Work Order Rejected
- **Trigger:** Admin rejects with reason
- **Recipient:** Technician
- **Message:** "Work order [Title] needs revision. Reason: [Reason]"
- **Color:** Red
- **Validation:** Check Technician's notification center, verify reason included

#### NE 4.6: Work Order Closed
- **Trigger:** Admin closes
- **Recipient:** Requester
- **Message:** "Work order [Title] has been closed"
- **Color:** Stone
- **Validation:** Check Requester's notification center

### Reminder Notification Tests (Auto-Generated)

#### NE 4.7: Preferred Date Reminder - 7 Days
- **Trigger:** System check on login, 7 days before preferredDate
- **Recipient:** Assigned Technician
- **Message:** 'งาน "[Title]" มีกำหนดนัดหมายในอีก 7 วัน ([date])'
- **Color:** Sky
- **Validation:** Auto-created by backend, check Technician notification

#### NE 4.8: Preferred Date Reminder - 3 Days
- **Trigger:** System check on login, 3 days before preferredDate
- **Recipient:** Assigned Technician
- **Message:** '⚠️ งาน "[Title]" มีกำหนดนัดหมายในอีก 3 วัน ([date])'
- **Color:** Sky
- **Validation:** Auto-created by backend, check Technician notification

#### NE 4.9: Due Date Reminder - 7 Days
- **Trigger:** System check on login, 7 days before dueDate
- **Recipient:** Assigned Technician
- **Message:** '📅 งาน "[Title]" จะถึงกำหนดส่งในอีก 7 วัน ([date])'
- **Color:** Sky
- **Validation:** Auto-created by backend, check Technician notification

#### NE 4.10: Due Date Reminder - 3 Days
- **Trigger:** System check on login, 3 days before dueDate
- **Recipient:** Assigned Technician
- **Message:** '⚠️ งาน "[Title]" จะถึงกำหนดส่งในอีก 3 วัน ([date])'
- **Color:** Amber
- **Validation:** Auto-created by backend, check Technician notification

#### NE 4.11: Due Date Reminder - 1 Day
- **Trigger:** System check on login, 1 day before dueDate
- **Recipient:** Assigned Technician
- **Message:** '🚨 งาน "[Title]" จะถึงกำหนดส่งพรุ่งนี้ ([date])'
- **Color:** Red
- **Validation:** Auto-created by backend, check Technician notification

#### NI 4.12: Mark as Read
1. Click on individual notification's checkmark button
   - ✅ Notification background changes from blue tint to white
   - ✅ Blue dot indicator disappears
   - ✅ Unread count decreases
   - ✅ Backend updates (check notifications.json)

#### NI 4.13: Mark All as Read
1. Click "Mark all read" button in header
   - ✅ All notifications lose blue tint
   - ✅ All blue dots disappear
   - ✅ Unread count goes to 0
   - ✅ Backend updates all notifications

#### NI 4.14: Delete Notification
1. Click X button on notification
   - ✅ Notification removed from list
   - ✅ Count updates if it was unread
   - ✅ Notification removed from backend storage

#### NI 4.15: Auto-Refresh
1. Perform action that creates notification
2. Wait (notifications poll every 30 seconds)
   - ✅ New notification appears without page refresh
   - ✅ Unread count updates automatically

---

## Test Scenario 5: Drag-and-Drop Status Change

### Objective
Verify drag-and-drop functionality respects workflow rules and permissions.

### Test Cases

#### DD 5.1: Valid Status Transitions
**Test:** Admin can drag work orders to valid statuses

1. As Admin, drag "Open" WO to "In Progress"
   - ✅ Allowed only if technician assigned
   - ✅ Status updates
   - ✅ Card moves to correct column

2. Drag "Completed" WO to "Closed"
   - ✅ Allowed
   - ✅ Status updates

**Validation:** Valid transitions work correctly

---

#### DD 5.2: Invalid Status Transitions
**Test:** System prevents invalid status changes

1. As Admin, try to drag "Open" directly to "Completed"
   - ✅ Alert: "You cannot move this work order from 'Open' to 'Completed'"
   - ✅ Card returns to original position

2. As Technician, try to drag any work order
   - ✅ Drag prevented if not permitted
   - ✅ Only can change status of assigned WO in specific cases

**Validation:** Invalid transitions blocked with appropriate messages

---

## Test Scenario 6: Data Persistence

### Objective
Verify all data is properly saved and loaded from backend storage.

### Test Steps

1. Complete a full workflow (Scenario 1)
2. Stop backend server
3. Check `storage/information/workorders.json`:
   - ✅ All work orders saved with correct statuses
   - ✅ Technician notes and images saved
   - ✅ Assignment information saved

4. Check `storage/information/notifications.json`:
   - ✅ All notifications saved
   - ✅ Read/unread states saved
   - ✅ Recipient information saved

5. Restart backend server
6. Refresh frontend
   - ✅ All work orders load correctly
   - ✅ All notifications load correctly
   - ✅ User sees correct data

**Validation:** Data persists across server restarts

---

## Test Scenario 7: Multi-User Concurrent Actions

### Objective
Verify system handles multiple users working simultaneously.

### Test Steps

1. Open two browser windows:
   - Window 1: Login as Admin
   - Window 2: Login as Technician

2. Admin assigns work order to technician
   - ✅ Window 2 shows notification (after 30s poll or manual refresh)

3. Technician completes work
   - ✅ Window 1 shows notification (after poll or refresh)

4. Admin approves
   - ✅ Both users see updated status (after refresh)

**Validation:** Multiple users can work concurrently without conflicts

---

## Test Scenario 8: Advance Scheduling (นัดหมายล่วงหน้า)

### Objective
Verify the advance scheduling feature with preferredDate, dueDate calculation, and reminder notifications.

### Prerequisites
- Work order in "Open" status
- Admin or Head Technician login

### Test Steps

#### Step 1: Set Preferred Date
**Actor:** Admin (Alex Sterling)

1. Login as Admin
2. Navigate to Work Orders
3. Click on an "Open" work order
4. In the "Assign Technician" section:
   - Set preferredDate to a future date (e.g., 7 days from now)
   - Select technician
   - Click "Assign & Start Work Order"

**Expected Results:**
- ✅ preferredDate saved correctly
- ✅ dueDate auto-calculated to preferredDate + 7 days
- ✅ Status changes to "In Progress"

#### Step 2: Verify Reminder Notifications
**Test Setup:** Create work orders with preferredDate/dueDate matching reminder intervals

| Test Case | preferredDate | Expected Notification |
|-----------|---------------|----------------------|
| 7-day reminder | today + 7 | WO_REMINDER_7_DAYS |
| 3-day reminder | today + 3 | WO_REMINDER_3_DAYS |
| 7-day due | dueDate = today + 7 | WO_DUE_7_DAYS |
| 3-day due | dueDate = today + 3 | WO_DUE_3_DAYS |
| 1-day due | dueDate = today + 1 | WO_DUE_1_DAY |

**Trigger:** Login any user → calls `/api/notifications/check-reminders`

**Validation:**
- ✅ Reminder notifications created for assigned technician
- ✅ Notifications not duplicated (system checks existing)
- ✅ Only work orders not in Completed/Closed/Canceled get reminders

#### Step 3: Verify Permission Restriction
1. Login as Technician (John Doe)
   - ✅ Should NOT see preferredDate field
   
2. Login as Requester (Sarah Line)
   - ✅ Should NOT see preferredDate field
   
3. Login as Admin (Alex Sterling)
   - ✅ Should see preferredDate field
   
4. Login as Head Technician
   - ✅ Should see preferredDate field

**Validation:** Only Admin and Head Technician can view/set preferredDate

---

## Performance Testing

### Load Test
- Create 20+ work orders
- Verify UI remains responsive
- Check notification loading time
- Validate board view performance

### Expected Performance
- ✅ Page loads in < 2 seconds
- ✅ Notifications load in < 1 second
- ✅ Status updates respond in < 500ms
- ✅ No UI lag with 50+ work orders

---

## Browser Compatibility

Test in multiple browsers:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Edge (latest)
- ✅ Safari (latest)

---

## Success Criteria

### All scenarios must pass with:
1. ✅ Correct status transitions
2. ✅ Proper permission enforcement
3. ✅ All notifications delivered
4. ✅ Data persistence working
5. ✅ UI responsive and functional
6. ✅ No console errors
7. ✅ Backend APIs responding correctly

---

## Defect Reporting Template

When a test fails, report using this template:

```
**Test Case:** [Scenario #.#]
**Severity:** [Critical/High/Medium/Low]
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**


**Actual Result:**


**Screenshots:** [If applicable]

**Console Errors:** [If any]

**Additional Notes:**
```

---

## Test Execution Checklist

- [ ] Scenario 1: Complete Workflow (Happy Path)
- [ ] Scenario 2: Rejection Flow
- [ ] Scenario 3: Permission Validation
  - [ ] TC 3.1: Requester Editing Permissions
  - [ ] TC 3.2: Technician Editing Permissions
  - [ ] TC 3.3: Admin Full Control
- [ ] Scenario 4: Notification System
  - [ ] NE 4.1-4.6: Status change notifications
  - [ ] NE 4.7-4.11: Reminder notifications (preferredDate & dueDate)
  - [ ] NI 4.12-4.15: Notification interactions
- [ ] Scenario 5: Drag-and-Drop Status Change
  - [ ] DD 5.1: Valid transitions
  - [ ] DD 5.2: Invalid transitions
- [ ] Scenario 6: Data Persistence
- [ ] Scenario 7: Multi-User Concurrent Actions
- [ ] Scenario 8: Advance Scheduling (นัดหมายล่วงหน้า)
  - [ ] Preferred date setting
  - [ ] Due date auto-calculation (+7 days)
  - [ ] Reminder notifications (7, 3 days before preferredDate)
  - [ ] Due date notifications (7, 3, 1 day before dueDate)
  - [ ] Permission restriction (Admin/Head Tech only)
- [ ] Performance Testing
- [ ] Browser Compatibility

**Test Completed By:** _______________
**Date:** _______________
**Overall Result:** PASS / FAIL
**Notes:**
