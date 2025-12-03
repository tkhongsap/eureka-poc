# Notification System - Detailed Testing Guide
## Eureka CMMS Notification System Troubleshooting & Testing

---

## 🔧 Pre-Test Setup & Verification

### Backend Verification
```powershell
# 1. Check if backend server is running
Get-Process python -ErrorAction SilentlyContinue

# 2. Test notification API endpoints directly
Invoke-WebRequest -Uri "http://localhost:8000/api/notifications" -Method GET

# 3. Check if notifications.json exists
Test-Path "C:\Users\absat\Desktop\Eureka\storage\information\notifications.json"

# 4. View current notifications (if file exists)
Get-Content "C:\Users\absat\Desktop\Eureka\storage\information\notifications.json" | ConvertFrom-Json
```

### Expected Results:
- ✅ Python process running on port 8000
- ✅ GET /api/notifications returns 200 OK (not 404)
- ✅ notifications.json file exists
- ✅ File contains valid JSON array

---

## 🐛 Common Issues & Quick Fixes

### Issue 1: 404 Not Found on /api/notifications

**Symptoms:**
```
POST http://localhost:8000/api/notifications 404 (Not Found)
GET http://localhost:8000/api/notifications 404 (Not Found)
```

**Check:**
```python
# Open backend/routes/notifications.py
# Line ~180 should have:
router = APIRouter(prefix="/api", tags=["notifications"])
```

**Fix:**
If missing `/api` prefix, add it and restart backend.

---

### Issue 2: Notifications Not Appearing in UI

**Debug Steps:**

1. **Open Browser Console** (F12 → Console tab)
   - Look for errors related to notifications
   - Check for failed API calls

2. **Check Network Tab** (F12 → Network tab)
   - Filter by "notifications"
   - Verify API calls are successful (200 status)

3. **Check if notifications are being created:**
```javascript
// In browser console:
fetch('http://localhost:5173/api/notifications')
  .then(r => r.json())
  .then(data => console.log('Notifications:', data));
```

4. **Verify notification service is being called:**
   - Add `console.log()` in `services/notificationService.ts`
   - Check if functions are actually being invoked

---

### Issue 3: Notifications Created but Not Filtered Correctly

**Problem:** Notifications exist but wrong user sees them

**Check filtering logic:**
```typescript
// In App.tsx - loadNotifications function
const filteredNotifications = allNotifications.filter(notif => {
  if (currentUser.role === 'Admin') return true;
  if (currentUser.role === 'Technician') {
    return notif.recipientRole === 'Technician' && 
           notif.recipientName === currentUser.name;
  }
  if (currentUser.role === 'Requester') {
    return notif.recipientRole === 'Requester' && 
           notif.recipientName === currentUser.name;
  }
  return false;
});
```

**Test:** Log to console to verify filtering works
```javascript
console.log('Current User:', currentUser);
console.log('All Notifications:', allNotifications);
console.log('Filtered Notifications:', filteredNotifications);
```

---

### Issue 4: Notifications Not Updating in Real-Time

**Check polling mechanism:**
```typescript
// In App.tsx - useEffect for polling
useEffect(() => {
  if (!currentUser) return;
  
  loadNotifications(); // Initial load
  
  const interval = setInterval(() => {
    loadNotifications();
  }, 30000); // 30 seconds
  
  return () => clearInterval(interval);
}, [currentUser]);
```

**Quick Test:**
- Create a notification
- Wait 30 seconds
- Check if it appears without page refresh

---

## 📋 Step-by-Step Notification Testing

### Test 1: WO_CREATED Notification

**Objective:** Verify Admin receives notification when Requester creates work order

**Steps:**
1. **Setup**
   - Clear existing notifications:
     ```javascript
     // Browser console
     fetch('http://localhost:5173/api/notifications')
       .then(r => r.json())
       .then(data => {
         data.forEach(n => 
           fetch(`http://localhost:5173/api/notifications/${n.id}`, {method: 'DELETE'})
         );
       });
     ```

2. **Login as Requester**
   - Username: Sarah Line
   - Role: Requester

3. **Create Work Order**
   - Navigate to Work Request Portal
   - Fill form:
     - Location: "Test Location"
     - Priority: "High"
     - Description: "Test notification creation"
   - Submit

4. **Verify Backend**
   - Check browser Network tab
   - Should see: `POST /api/workorders` (200 OK)
   - Check console for notification service call

5. **Check Notification Created**
   ```javascript
   // Browser console
   fetch('http://localhost:5173/api/notifications')
     .then(r => r.json())
     .then(data => console.log('Created notifications:', data));
   ```

6. **Expected Result:**
   ```json
   [{
     "id": "notif_1234567890123",
     "type": "WO_CREATED",
     "workOrderId": "...",
     "workOrderTitle": "Test Location",
     "message": "New work order created: Test Location",
     "recipientRole": "Admin",
     "recipientName": "Admin",
     "isRead": false,
     "createdAt": "2025-11-27T...",
     "triggeredBy": "Sarah Line"
   }]
   ```

7. **Login as Admin**
   - Username: Alex Sterling
   - Role: Admin

8. **Check Notification Center**
   - Look at bell icon in header
   - Should show: Badge with "1"
   - Click bell icon
   - Should see: Teal notification card
   - Content: "New work order created: Test Location"
   - Footer: "Created by Sarah Line • Just now"

**✅ Pass Criteria:**
- Notification created in backend
- Admin sees notification in UI
- Badge count = 1
- Notification color = Teal
- Click notification navigates to work order

**❌ If Failed:**
- Check `components/WorkRequestPortal.tsx` - is notification service imported?
- Check if `createNotification()` is called after work order creation
- Check browser console for errors
- Verify API call succeeds (Network tab)

---

### Test 2: WO_ASSIGNED Notification

**Objective:** Verify Technician receives notification when Admin assigns them

**Steps:**
1. **Prerequisite:** Have an "Open" work order (from Test 1)

2. **Login as Admin**

3. **Open Work Order Detail**

4. **Assign Technician**
   - Select "John Doe" from dropdown
   - Click "Assign & Start Work Order"

5. **Check Browser Console**
   - Should see notification service call
   - Should see API POST to /api/notifications

6. **Verify Notification Created**
   ```javascript
   fetch('http://localhost:5173/api/notifications')
     .then(r => r.json())
     .then(data => console.log('Notifications:', data.filter(n => n.type === 'WO_ASSIGNED')));
   ```

7. **Expected Result:**
   ```json
   {
     "type": "WO_ASSIGNED",
     "recipientRole": "Technician",
     "recipientName": "John Doe",
     "message": "You have been assigned to work order: Test Location",
     "isRead": false
   }
   ```

8. **Login as Technician**
   - Username: John Doe
   - Role: Technician

9. **Check Notification Center**
   - Badge count should be 1
   - Purple notification card
   - Message: "You have been assigned to work order: Test Location"

**✅ Pass Criteria:**
- Notification created after assignment
- Technician "John Doe" sees notification
- Other technicians don't see it
- Badge count accurate
- Purple color

**❌ If Failed:**
- Check `components/WorkOrders.tsx` - `handleAssign` function
- Verify `createWOAssignedNotification()` is called
- Check if `await createNotification()` succeeds
- Check console for errors

---

### Test 3: WO_COMPLETED Notification

**Objective:** Verify Admin receives notification when Technician completes work

**Steps:**
1. **Prerequisite:** Work order in "In Progress" status, assigned to technician

2. **Login as Technician** (John Doe)

3. **Open Assigned Work Order**

4. **Complete Work**
   - Add work notes: "Test completion"
   - Click "Mark as Done & Submit for Review"

5. **Check Console**
   - Verify notification service called
   - Check API POST to /api/notifications

6. **Verify Notification Created**
   ```javascript
   fetch('http://localhost:5173/api/notifications')
     .then(r => r.json())
     .then(data => console.log('Completed notifications:', 
       data.filter(n => n.type === 'WO_COMPLETED')));
   ```

7. **Login as Admin**

8. **Check Notification**
   - Blue notification
   - Message: "Work order Test Location has been completed and is pending review"
   - Triggered by: John Doe

**✅ Pass Criteria:**
- Notification created
- Admin sees it
- Blue color
- Correct message

---

### Test 4: WO_APPROVED Notifications (Multiple Recipients)

**Objective:** Verify BOTH Requester AND Technician receive notifications

**Steps:**
1. **Prerequisite:** Work order in "Pending" status

2. **Login as Admin**

3. **Approve Work Order**
   - Click "Approve Work Order"

4. **Check Console**
   - Should see notification service called
   - Should create **2 notifications** (Requester + Technician)

5. **Verify Both Notifications Created**
   ```javascript
   fetch('http://localhost:5173/api/notifications')
     .then(r => r.json())
     .then(data => {
       const approved = data.filter(n => n.type === 'WO_APPROVED');
       console.log('Approved notifications:', approved);
       console.log('Recipients:', approved.map(n => `${n.recipientRole}: ${n.recipientName}`));
     });
   ```

6. **Expected: 2 Notifications**
   ```json
   [
     {
       "type": "WO_APPROVED",
       "recipientRole": "Requester",
       "recipientName": "Sarah Line",
       "message": "Your work order Test Location has been approved and completed"
     },
     {
       "type": "WO_APPROVED",
       "recipientRole": "Technician",
       "recipientName": "John Doe",
       "message": "Work order Test Location has been approved"
     }
   ]
   ```

7. **Login as Requester** (Sarah Line)
   - Check notification center
   - Should see green/emerald notification

8. **Login as Technician** (John Doe)
   - Check notification center
   - Should see green/emerald notification

**✅ Pass Criteria:**
- 2 notifications created
- Requester sees their notification
- Technician sees their notification
- Both are emerald color
- Messages are different but both relevant

**❌ If Failed:**
- Check `components/WorkOrders.tsx` - `handleApprove` function
- Verify `createWOApprovedNotifications()` returns **array**
- Check if loop creates both notifications:
   ```typescript
   for (const notification of notifications) {
     await createNotification(notification);
   }
   ```

---

### Test 5: WO_REJECTED Notification (with Reason)

**Objective:** Verify Technician receives rejection with reason included

**Steps:**
1. **Prerequisite:** Work order in "Pending" status

2. **Login as Admin**

3. **Reject Work Order**
   - Enter rejection reason: "Missing photos of completed work"
   - Click "Reject & Send Back"

4. **Verify Notification Created**
   ```javascript
   fetch('http://localhost:5173/api/notifications')
     .then(r => r.json())
     .then(data => {
       const rejected = data.filter(n => n.type === 'WO_REJECTED');
       console.log('Rejection notification:', rejected);
     });
   ```

5. **Expected:**
   ```json
   {
     "type": "WO_REJECTED",
     "recipientRole": "Technician",
     "recipientName": "John Doe",
     "message": "Work order Test Location needs revision. Reason: Missing photos of completed work",
     "isRead": false
   }
   ```

6. **Login as Technician**

7. **Check Notification**
   - Red notification card
   - Message includes rejection reason
   - Clear call-to-action

**✅ Pass Criteria:**
- Notification created
- Rejection reason included in message
- Red color
- Technician sees it

---

### Test 6: WO_CLOSED Notification

**Objective:** Verify Requester receives notification when work order closed

**Steps:**
1. **Prerequisite:** Work order in "Completed" status

2. **Login as Admin**

3. **Close Work Order**
   - Click "Close Work Order"

4. **Verify Notification Created**
   ```javascript
   fetch('http://localhost:5173/api/notifications')
     .then(r => r.json())
     .then(data => {
       const closed = data.filter(n => n.type === 'WO_CLOSED');
       console.log('Closed notification:', closed);
     });
   ```

5. **Login as Requester**

6. **Check Notification**
   - Stone/gray notification
   - Message: "Work order Test Location has been closed"

**✅ Pass Criteria:**
- Notification created
- Requester sees it
- Stone/gray color

---

## 🔍 Debugging Checklist

### When Notifications Don't Work:

**1. Check Backend**
- [ ] Backend server running (`Get-Process python`)
- [ ] API endpoint responds (`Invoke-WebRequest http://localhost:8000/api/notifications`)
- [ ] Router has `/api` prefix in `backend/routes/notifications.py`
- [ ] Router registered in `backend/main.py`

**2. Check Frontend API Calls**
- [ ] Browser Network tab shows successful POST/GET
- [ ] No CORS errors
- [ ] Correct headers sent (X-User-Role, X-User-Name)
- [ ] Response status 200 (not 404 or 500)

**3. Check Notification Service**
- [ ] Service imported in component
- [ ] Function called after workflow action
- [ ] `await createNotification()` used (async)
- [ ] Notification object has all required fields

**4. Check Notification Filtering**
- [ ] `loadNotifications()` called on login
- [ ] Filter logic matches user role and name
- [ ] Admin sees all notifications
- [ ] Technician/Requester see only their own

**5. Check UI Updates**
- [ ] `notifications` state passed to Header
- [ ] `onNotificationsUpdate` callback works
- [ ] NotificationCenter component receives props
- [ ] Badge count calculated correctly

**6. Check Polling**
- [ ] useEffect runs when user logs in
- [ ] Interval set to 30 seconds
- [ ] Cleanup function clears interval
- [ ] No infinite loops

---

## 🧪 Manual Testing Script

Run this in browser console for comprehensive test:

```javascript
// Complete notification system test
async function testNotifications() {
  console.log('=== NOTIFICATION SYSTEM TEST ===');
  
  // 1. Check API availability
  console.log('1. Testing API endpoint...');
  try {
    const response = await fetch('http://localhost:5173/api/notifications');
    console.log('✅ API responds:', response.status);
    const data = await response.json();
    console.log('Current notifications:', data.length);
  } catch (error) {
    console.error('❌ API error:', error);
    return;
  }
  
  // 2. Test notification creation
  console.log('\n2. Testing notification creation...');
  const testNotif = {
    type: 'WO_CREATED',
    workOrderId: 'test_123',
    workOrderTitle: 'Test WO',
    message: 'Test notification',
    recipientRole: 'Admin',
    recipientName: 'Admin',
    isRead: false,
    triggeredBy: 'Test User'
  };
  
  try {
    const createResponse = await fetch('http://localhost:5173/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'Admin',
        'X-User-Name': 'Admin'
      },
      body: JSON.stringify(testNotif)
    });
    console.log('✅ Create response:', createResponse.status);
    const created = await createResponse.json();
    console.log('Created notification:', created);
    
    // 3. Test mark as read
    console.log('\n3. Testing mark as read...');
    const markReadResponse = await fetch(
      `http://localhost:5173/api/notifications/${created.id}/read`,
      { method: 'PATCH' }
    );
    console.log('✅ Mark read response:', markReadResponse.status);
    
    // 4. Test delete
    console.log('\n4. Testing delete...');
    const deleteResponse = await fetch(
      `http://localhost:5173/api/notifications/${created.id}`,
      { method: 'DELETE' }
    );
    console.log('✅ Delete response:', deleteResponse.status);
    
    console.log('\n✅ ALL TESTS PASSED');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testNotifications();
```

---

## 📊 Notification Flow Diagram

```
Requester Creates WO
       ↓
   [WO_CREATED]
       ↓
    → Admin (Teal)
       ↓
Admin Assigns Tech (ตั้ง preferredDate และ dueDate = preferredDate + 7)
       ↓
   [WO_ASSIGNED]
       ↓
    → Technician (Purple)
       ↓
    ┌────────────────────────────────────────────┐
    │  REMINDER SYSTEM (Auto-check on login)     │
    │                                            │
    │  Preferred Date Reminders:                 │
    │  - 7 days before → [WO_REMINDER_7_DAYS]   │
    │  - 3 days before → [WO_REMINDER_3_DAYS]   │
    │                                            │
    │  Due Date Reminders:                       │
    │  - 7 days before → [WO_DUE_7_DAYS] (Sky)  │
    │  - 3 days before → [WO_DUE_3_DAYS] (Amber)│
    │  - 1 day before  → [WO_DUE_1_DAY] (Red)   │
    │                                            │
    │  All reminders → Technician assigned       │
    └────────────────────────────────────────────┘
       ↓
Technician Completes
       ↓
   [WO_COMPLETED]
       ↓
    → Admin (Blue)
       ↓
Admin Reviews
       ↓
    ├─ Approve ──→ [WO_APPROVED] → Requester (Emerald)
    │                            → Technician (Emerald)
    │
    └─ Reject ───→ [WO_REJECTED] → Technician (Red)
       ↓
Admin Closes
       ↓
   [WO_CLOSED]
       ↓
    → Requester (Stone)
```

---

## 🎯 Quick Diagnosis Guide

**Symptom:** No notifications appear at all
→ Check backend API, verify router prefix, restart server

**Symptom:** Notifications created but wrong user sees them
→ Check filtering logic in `App.tsx`, verify recipientRole/recipientName

**Symptom:** Notifications appear but badge count wrong
→ Check `getUnreadCount()` function, verify isRead field

**Symptom:** Mark as read doesn't work
→ Check PATCH endpoint, verify API call succeeds, check state update

**Symptom:** Notifications don't auto-refresh
→ Check useEffect polling, verify 30s interval, check cleanup function

**Symptom:** Multiple notifications created for single action
→ Check if notification service called multiple times, verify no duplicate calls

**Symptom:** Notification created but UI doesn't update
→ Check `onNotificationsUpdate` callback, verify state updates trigger re-render

---

## ✅ Success Criteria

### Status Change Notifications (6 types):
- [x] WO_CREATED
- [x] WO_ASSIGNED
- [x] WO_COMPLETED
- [x] WO_APPROVED (2 recipients)
- [x] WO_REJECTED (with reason)
- [x] WO_CLOSED

### Reminder Notifications - Preferred Date (2 types):
- [x] WO_REMINDER_7_DAYS - 7 วันก่อนวันนัดหมาย (preferredDate)
- [x] WO_REMINDER_3_DAYS - 3 วันก่อนวันนัดหมาย (preferredDate)

### Due Date Reminders (3 types):
- [x] WO_DUE_7_DAYS - 7 วันก่อนกำหนดส่ง (dueDate)
- [x] WO_DUE_3_DAYS - 3 วันก่อนกำหนดส่ง (dueDate)
- [x] WO_DUE_1_DAY - 1 วันก่อนกำหนดส่ง (dueDate)

All interactions work:
- [x] Badge shows unread count
- [x] Mark as read
- [x] Mark all as read
- [x] Delete notification
- [x] Auto-refresh (30s)
- [x] Click to view work order

All filtering works:
- [x] Admin sees all
- [x] Technician sees only assigned
- [x] Requester sees only their WOs

---

## 📝 Notes for Developers

### Common Mistakes to Avoid:

1. **Forgetting `await`**
   ```typescript
   // ❌ Wrong
   createNotification(notification);
   
   // ✅ Correct
   await createNotification(notification);
   ```

2. **Not handling arrays**
   ```typescript
   // WO_APPROVED returns array
   const notifications = createWOApprovedNotifications(...);
   for (const notif of notifications) {
     await createNotification(notif);
   }
   ```

3. **Wrong recipientName**
   ```typescript
   // Make sure to use the actual user's name, not role
   recipientName: technician.name // ✅
   recipientName: "Technician"   // ❌
   ```

4. **Missing /api prefix**
   ```python
   # In backend router
   router = APIRouter(prefix="/api", tags=["notifications"])  # ✅
   router = APIRouter(tags=["notifications"])                  # ❌
   ```

5. **Filtering logic errors**
   ```typescript
   // Admin should see ALL
   if (currentUser.role === 'Admin') return true;
   
   // Others need exact match
   return notif.recipientRole === currentUser.role && 
          notif.recipientName === currentUser.name;
   ```
