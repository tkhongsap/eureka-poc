# Workflow Test Checklist - Quick Reference
## Eureka CMMS Work Order Workflow

Use this checklist for rapid manual testing of core workflows.

---

## 🔄 Complete Workflow Test (Happy Path)

### Setup
- [ ] Backend server running on port 8000
- [ ] Frontend server running on port 5173
- [ ] Test accounts ready: Requester, Admin, Technician

### Step-by-Step

**1️⃣ CREATE (Requester)**
- [ ] Login as Requester (Sarah Line)
- [ ] Submit work request
- [ ] Verify status = "Open"
- [ ] Verify Admin gets WO_CREATED notification

**2️⃣ ASSIGN (Admin)**
- [ ] Login as Admin (Alex Sterling)
- [ ] See WO_CREATED notification
- [ ] Assign technician
- [ ] Verify status = "In Progress"
- [ ] Verify Technician gets WO_ASSIGNED notification

**3️⃣ COMPLETE (Technician)**
- [ ] Login as Technician (John Doe)
- [ ] See WO_ASSIGNED notification
- [ ] Add work notes
- [ ] Mark as done
- [ ] Verify status = "Pending"
- [ ] Verify Admin gets WO_COMPLETED notification

**4️⃣ APPROVE (Admin)**
- [ ] Login as Admin
- [ ] See WO_COMPLETED notification
- [ ] Approve work order
- [ ] Verify status = "Completed"
- [ ] Verify Requester gets WO_APPROVED notification
- [ ] Verify Technician gets WO_APPROVED notification

**5️⃣ CLOSE (Admin)**
- [ ] Close work order
- [ ] Verify status = "Closed"
- [ ] Verify Requester gets WO_CLOSED notification
- [ ] Verify WO is now read-only

---

## 🔁 Rejection Flow Test

### Setup
Follow steps 1-3 from Complete Workflow to get WO to "Pending"

**4️⃣ REJECT (Admin)**
- [ ] Login as Admin
- [ ] Enter rejection reason
- [ ] Click "Reject & Send Back"
- [ ] Verify status = "In Progress"
- [ ] Verify Technician gets WO_REJECTED notification with reason

**5️⃣ RE-SUBMIT (Technician)**
- [ ] Login as Technician
- [ ] See rejection notification with reason
- [ ] Update work notes
- [ ] Re-submit
- [ ] Verify status = "Pending" again

---

## 🔒 Permission Tests

### Requester Permissions
- [ ] Can edit when status = "Open" ✓
- [ ] Cannot edit when status = "In Progress" 🔒
- [ ] Cannot edit when status = "Pending" 🔒
- [ ] Cannot edit when status = "Completed" 🔒
- [ ] Cannot edit when status = "Closed" 🔒

### Technician Permissions
- [ ] Can update ONLY when assigned AND status = "In Progress"
- [ ] Cannot update when NOT assigned to them
- [ ] Cannot update when status = "Open"
- [ ] Cannot update when status = "Pending"
- [ ] Cannot update other statuses

### Admin Permissions
- [ ] Can assign technician when status = "Open"
- [ ] Can review when status = "Pending"
- [ ] Can approve when status = "Pending"
- [ ] Can reject when status = "Pending"
- [ ] Can close when status = "Completed"
- [ ] CANNOT edit when status = "Closed"

---

## 🔔 Notification Tests

### Notification Events
- [ ] WO_CREATED → Admin (Teal)
- [ ] WO_ASSIGNED → Technician (Purple)
- [ ] WO_COMPLETED → Admin (Blue)
- [ ] WO_APPROVED → Requester + Technician (Emerald)
- [ ] WO_REJECTED → Technician (Red) - includes reason
- [ ] WO_CLOSED → Requester (Stone)

### Notification Interactions
- [ ] Unread count badge shows correct number
- [ ] Mark as read removes blue dot and tint
- [ ] Mark all as read clears all unread
- [ ] Delete notification removes it
- [ ] Notifications auto-refresh (30s polling)
- [ ] Click notification scrolls to/shows work order

### Notification Filtering
- [ ] Requester sees only notifications for their WOs
- [ ] Technician sees only notifications for assigned WOs
- [ ] Admin sees notifications for all WOs
- [ ] Notifications show correct user names and WO titles

---

## 💾 Data Persistence Test

- [ ] Complete a full workflow
- [ ] Stop backend server
- [ ] Check `storage/information/workorders.json` for saved data
- [ ] Check `storage/information/notifications.json` for saved notifications
- [ ] Restart backend server
- [ ] Refresh frontend
- [ ] Verify all data loads correctly

---

## 🎯 Status Transition Matrix

Test all valid transitions:

| From | To | Actor | Required Action |
|------|-------|-------|-----------------|
| Open | In Progress | Admin | Assign Technician |
| In Progress | Pending | Technician | Mark as Done |
| Pending | Completed | Admin | Approve |
| Pending | In Progress | Admin | Reject (with reason) |
| Completed | Closed | Admin | Close WO |

Test invalid transitions are blocked:
- [ ] Cannot skip statuses (e.g., Open → Completed)
- [ ] Cannot go backward except Pending → In Progress
- [ ] Cannot reopen Closed work orders

---

## 🚀 Quick Smoke Test (5 min)

Fastest way to verify everything works:

1. [ ] **Create**: Requester creates WO
2. [ ] **Assign**: Admin assigns to Technician
3. [ ] **Complete**: Technician marks done
4. [ ] **Approve**: Admin approves
5. [ ] **Close**: Admin closes
6. [ ] **Verify**: Check all 6 notifications delivered
7. [ ] **Verify**: Final status = "Closed" and read-only

---

## ❌ Common Issues Checklist

If tests fail, check:
- [ ] Backend server running on correct port (8000)
- [ ] Frontend server running on correct port (5173)
- [ ] Logged in with correct user role
- [ ] Work order status matches expected for action
- [ ] Technician assigned before attempting tech actions
- [ ] Notifications.json file exists and is writable
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API calls

---

## 📊 Test Results

**Date:** _______________
**Tester:** _______________

| Test Category | Status | Notes |
|---------------|--------|-------|
| Complete Workflow | ⬜ Pass ⬜ Fail |  |
| Rejection Flow | ⬜ Pass ⬜ Fail |  |
| Permissions | ⬜ Pass ⬜ Fail |  |
| Notifications | ⬜ Pass ⬜ Fail |  |
| Data Persistence | ⬜ Pass ⬜ Fail |  |
| Status Transitions | ⬜ Pass ⬜ Fail |  |

**Overall Result:** ⬜ PASS ⬜ FAIL

**Issues Found:**


**Additional Comments:**
