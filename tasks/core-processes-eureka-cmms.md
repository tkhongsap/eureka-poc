# Core Processes: Eureka CMMS

## Overview

This document outlines the core business processes and workflows for Eureka CMMS, providing detailed step-by-step procedures for key operations across the platform.

**Implementation Status Legend:**
- ✅ **Implemented** - Feature is fully coded and working
- 🚧 **Partially Implemented** - Some components exist but incomplete
- ❌ **Not Implemented** - Feature not yet developed

---

## Table of Contents

1. [Work Notification to Work Order Conversion](#2-work-notification-to-work-order-conversion) - ✅ **Implemented**
2. [Work Order Lifecycle](#3-work-order-lifecycle) - ✅ **Implemented**
3. [Tenant & Site Onboarding](#1-tenant--site-onboarding) - ❌ Not Implemented
4. [Preventive Maintenance Scheduling](#4-preventive-maintenance-scheduling) - ❌ Not Implemented
5. [Route-Based Inspection](#5-route-based-inspection) - ❌ Not Implemented
6. [Spare Parts Requisition & Issue](#6-spare-parts-requisition--issue) - 🚧 Partially Implemented
7. [Emergency Response & EOC Coordination](#7-emergency-response--eoc-coordination) - ❌ Not Implemented
8. [Cross-Site Inventory Optimization](#8-cross-site-inventory-optimization) - ❌ Not Implemented
9. [Asset Downtime Tracking](#9-asset-downtime-tracking) - ❌ Not Implemented
10. [Safety Permit Management](#10-safety-permit-management) - ❌ Not Implemented

---

## 2. Work Notification to Work Order Conversion ✅

**Implementation Status:** ✅ **Fully Implemented**

**Implemented Components:**
- ✅ Work Request Portal (`WorkRequestPortal.tsx`)
- ✅ Image upload with preview
- ✅ Backend API for request creation (`/api/requests`)
- ✅ Automatic Work Order creation from requests
- ✅ Request history tracking
- ✅ Technician assignment (Admin/Technician roles)
- ✅ Priority selection
- ✅ Image attachment support
- ✅ Success notifications (2.5s toast, bottom-right)

### Process Owner
Non-Maintenance Employee (Requester), Site Manager

### Objective
Report a maintenance issue and convert it into a formal work order.

### Steps

#### 2.1 Submit Work Notification (Requester) ✅

**Status:** ✅ Fully working in `WorkRequestPortal.tsx`

1. **Access Work Notification Portal**:
   - ✅ Web portal accessible via `/requests` route
   - 🚧 QR code scanning (planned for mobile app)
   - ❌ Call center API integration (not implemented)
2. **Fill in notification form**:
   - ✅ **Location/Equipment**: Text input field
   - ✅ **Issue Description**: Textarea input
   - ✅ **Priority**: Dropdown (Low/Medium/High/Critical)
   - ✅ **Attach Photos**: Multiple image upload with preview
   - ✅ **Assign Technician**: (Admin/Technician only)
3. ✅ Click **"Submit Request"**
4. ✅ System generates Request ID (e.g., REQ-2024-001)
5. ✅ Requester sees success toast notification
6. ✅ Request appears in **"My Recent Requests"** sidebar

**Success Criteria:** ✅ Notification is logged, requester sees confirmation

---

#### 2.2 Review & Convert Notification (Site Manager) ✅

**Status:** ✅ Automatic conversion implemented

1. ✅ Request is created via `POST /api/requests`
2. ✅ System auto-converts to Work Order via `createWorkOrder()` in `App.tsx`
3. ✅ **AI-Generated Title**: Uses Gemini API to create meaningful WO title from description
4. ✅ Work Order pre-filled with:
   - Title (AI-generated)
   - Description (from request)
   - Asset Name (from location)
   - Priority (from request)
   - Assigned technician (if specified)
   - Due date (auto: +7 days)
   - Linked images (imageIds array)
   - Request ID reference
5. ✅ Work Order created via `POST /api/workorders`
6. ✅ WO appears in Work Orders board

**Success Criteria:** ✅ Work order created, technician notified (via UI), notification linked to WO

---

## 3. Work Order Lifecycle ✅

**Implementation Status:** ✅ **Fully Implemented**

**Implemented Components:**
- ✅ Work Order Board View (`WorkOrders.tsx`)
- ✅ List View & Board View toggle
- ✅ Drag-and-drop status updates
- ✅ Work order detail panel (slide-over)
- ✅ AI-powered root cause analysis (Gemini 2.5)
- ✅ Smart checklist generation
- ✅ Spare parts tracking
- ✅ Image attachment viewer with fullscreen
- ✅ Backend API (`/api/workorders`)

### Process Owner
Site Manager, Technician

### Objective
Execute a work order from creation to completion.

### Steps

#### 3.1 Work Order Creation (Site Manager) ✅

**Option A: Manual Creation** 🚧
- ❌ Manual creation form not yet implemented
- ✅ Can be done via API

**Option B: From PM Schedule** ❌
- ❌ Not implemented (PM module not built)

**Option C: From Work Request** ✅
- ✅ Fully working via `WorkRequestPortal.tsx`
- ✅ Auto-creates WO when request is submitted
- ✅ AI generates title using Gemini API
- ✅ Links images and request ID

**Success Criteria:** ✅ WO created with status **"Open"**

---

#### 3.2 Work Order Assignment (Site Manager) ✅

**Status:** ✅ Working via request portal

1. ✅ Admin/Technician can assign during request creation
2. ✅ Work orders display in board view by status
3. ✅ Kanban board shows: Open → In Progress → Pending → Completed
4. ✅ Technician filter: "Assigned to Me" checkbox
5. ✅ **Drag-and-drop**: Move WO cards between status columns
6. ❌ Technician skill matching not implemented
7. ❌ Workload/shift schedule integration not implemented

**Success Criteria:** ✅ WO assigned, visible in board

---

#### 3.3 Work Order Execution (Technician) 🚧

**Status:** 🚧 Partially implemented (UI ready, mobile features pending)

**Working:**
1. ✅ View work order details in slide-over panel
2. ✅ See description, priority, asset, due date
3. ✅ View attached images with fullscreen zoom
4. ✅ **AI Assistant**:
   - ✅ Click "Analyze Issue" button
   - ✅ Gemini 2.5 generates root causes
   - ✅ Estimates repair time
   - ✅ Recommends actions
   - ✅ Generates smart checklist
5. ✅ Add/remove spare parts to work order
6. ✅ View parts cost calculation

**Not Implemented:**
- ❌ Clock in/out (labor time tracking)
- ❌ Status change from technician view
- ❌ Mobile app
- ❌ Offline mode
- ❌ GPS tracking
- ❌ QR code scanning
- ❌ Chat/communication
- ❌ Photo capture from mobile
- ❌ Failure code recording

**Success Criteria:** 🚧 Work visible, AI analysis works, but execution tracking incomplete

---

#### 3.4 Work Order Approval (Site Manager) ❌

**Status:** ❌ Not implemented

- ❌ No approval workflow
- ❌ No completion review
- ❌ No cost validation
- ❌ WO status can be changed via drag-and-drop only

**Success Criteria:** ❌ Not achieved

---

## 1. Tenant & Site Onboarding ❌

**Implementation Status:** ❌ **Not Implemented**

### Process Owner
Super Admin / Tenant Admin

### Objective
Onboard a new tenant organization with multiple sites into the Eureka CMMS platform.

### Prerequisites
- Valid tenant contract
- License allocation approved
- Organizational structure documented

**Implementation Notes:**
- ❌ Multi-tenant architecture not implemented
- ❌ Tenant management UI not built
- ❌ License allocation system not implemented
- Current system: Single-tenant demo with mock users

### Steps

#### 1.1 Tenant Creation (Super Admin) ❌

**Status:** ❌ Not implemented

1. **Navigate to Settings → Tenant Management**
2. Click **"+ New Tenant"** button
3. Fill in tenant details:
   - Tenant Name
   - Company Registration Number
   - Primary Contact (Name, Email, Phone)
   - Billing Address
   - Subscription Plan (Starter, Professional, Enterprise)
   - License Pool Allocation (e.g., 50 users)
   - Start Date & End Date
4. Upload tenant logo and branding assets
5. Configure tenant-level settings:
   - Time Zone
   - Currency
   - Language (default)
   - Date Format
6. Set up initial Tenant Admin credentials
7. Click **"Create Tenant"**
8. System generates Tenant ID (e.g., TNT-001)
9. Send welcome email to Tenant Admin with login credentials

**Success Criteria**: Tenant appears in tenant list, Tenant Admin can log in

---

#### 1.2 Site Creation (Tenant Admin)

1. **Log in as Tenant Admin**
2. Navigate to **Settings → Site Management**
3. Click **"+ Add Site"** button
4. Fill in site details:
   - Site Name (e.g., "Bangkok Factory 1")
   - Site Code (e.g., BKK-F01)
   - Site Type (Factory, Warehouse, Office, Service Center)
   - Physical Address
   - GPS Coordinates (latitude, longitude)
   - Time Zone (if different from tenant)
   - Contact Person (Site Manager)
5. Allocate licenses to the site (e.g., 10 users)
6. Upload site layout diagram (optional)
7. Click **"Create Site"**
8. System generates Site ID (e.g., SITE-001)
9. Assign Site Manager and provide credentials

**Success Criteria**: Site appears in site list, Site Manager can access site dashboard

---

#### 1.3 Initial Master Data Setup (Site Manager)

1. **Log in as Site Manager**
2. **Create Functional Locations**:
   - Navigate to **Assets → Functional Locations**
   - Click **"+ New Location"**
   - Define hierarchy (e.g., Building A → Floor 1 → Production Line 1)
   - Add location codes (e.g., BKK-F01-L01)
3. **Register Equipment**:
   - Navigate to **Assets → Equipment List**
   - Click **"+ New Equipment"**
   - Fill in equipment details:
     - Equipment ID, Name, Description
     - Functional Location
     - Manufacturer, Model, Serial Number
     - Installation Date, Warranty Expiry
     - Criticality Ranking (A, B, C)
   - Generate and print QR code for equipment
4. **Import Spare Parts Catalog**:
   - Navigate to **Inventory → Parts Catalog**
   - Click **"Import Parts"**
   - Upload CSV file with part data
   - Map columns and validate data
5. **Create User Accounts**:
   - Navigate to **Settings → User Management**
   - Click **"+ Add User"**
   - Fill in user details and assign role (Technician, Store Manager)
   - Allocate license from site pool
   - Send invitation email

**Success Criteria**: 
- At least 10 functional locations created
- At least 20 equipment items registered
- At least 100 parts in catalog
- All technicians have accounts

---

## 2. Work Notification to Work Order Conversion

### Process Owner
Non-Maintenance Employee (Requester), Site Manager

### Objective
Report a maintenance issue and convert it into a formal work order.

### Steps

#### 2.1 Submit Work Notification (Requester)

1. **Access Work Notification Portal**:
   - Scan QR code on equipment/location, OR
   - Open web portal: `https://eureka.cmms.com/request`, OR
   - Call service hotline (system creates notification via API)
2. **Fill in notification form**:
   - **Location/Equipment**: Select from dropdown or scan QR code
   - **Issue Description**: Enter free-text description
   - **Priority**: Select urgency (Low, Medium, High, Emergency)
   - **Attach Photos**: Capture up to 5 photos of the issue
3. Click **"Submit Request"**
4. System generates Notification ID (e.g., NOTIF-2024-001)
5. Requester receives confirmation email with tracking link
6. Notification appears in **Work Notifications → Open** queue

**Success Criteria**: Notification is logged, requester receives confirmation

---

#### 2.2 Review & Convert Notification (Site Manager)

1. **Navigate to Work Notifications → Open**
2. Click on notification to view details
3. Review attached photos and description
4. **Assess Priority**:
   - If urgent, escalate priority to High/Emergency
   - If not urgent, keep as submitted
5. **Decide Action**:
   - **Convert to Work Order**: For valid maintenance issues
   - **Close Without WO**: For non-maintenance issues (IT, admin, etc.)
6. **If converting to WO**:
   - Click **"Convert to Work Order"** button
   - System pre-fills WO with notification data
   - **Enhance Work Order Details**:
     - Add detailed title
     - Select Work Type (Breakdown, PM, Project, Inspection)
     - Assign technician (based on skills and availability)
     - Set due date (based on priority SLA)
     - Link to asset (if not already linked)
     - Add job plan or checklist (if applicable)
   - Click **"Create Work Order"**
7. System generates WO ID (e.g., WO-2024-001)
8. Notification status changes to **"Converted"**
9. Assigned technician receives mobile notification

**Success Criteria**: Work order created, technician notified, notification linked to WO

---

## 3. Work Order Lifecycle

### Process Owner
Site Manager, Technician

### Objective
Execute a work order from creation to completion.

### Steps

#### 3.1 Work Order Creation (Site Manager)

**Option A: Manual Creation**
1. Navigate to **Work Orders → Create Work Order**
2. Fill in work order form:
   - **Title**: Brief description (e.g., "Replace bearing on pump P-101")
   - **Work Type**: Breakdown, PM, Project, Inspection, Safety
   - **Priority**: Emergency, High, Medium, Low
   - **Asset/Location**: Select equipment or functional location
   - **Description**: Detailed work scope
   - **Estimated Duration**: Hours required
   - **Assign To**: Select technician
   - **Due Date**: Calculate based on priority
   - **Attach Documents**: SOPs, drawings, manuals
3. Click **"Create & Assign"**

**Option B: From PM Schedule**
- System auto-generates WO from PM plan when due date arrives

**Option C: From IoT Alert**
- SCADA/IoT system triggers WO creation via API when anomaly detected

**Success Criteria**: WO created with status **"Open"**

---

#### 3.2 Work Order Assignment (Site Manager)

1. Navigate to **Work Orders → Board View**
2. Locate unassigned work orders in **"Open"** column
3. **Review Technician Availability**:
   - Click **"Assign"** button
   - System shows recommended technicians based on:
     - Skills match
     - Current workload
     - Location proximity
     - Shift schedule
4. Select technician from list
5. Adjust due date if needed
6. Add assignment notes
7. Click **"Assign Work Order"**
8. WO moves to **"Assigned"** column
9. Technician receives push notification on mobile app

**Success Criteria**: WO assigned, technician notified

---

#### 3.3 Work Order Execution (Technician)

1. **Receive Notification**:
   - Mobile app shows new work order in **"My Work Orders"**
   - Notification displays: WO ID, title, priority, asset, due date
2. **View Work Order Details**:
   - Open WO in mobile app
   - Review description, asset details, attached documents
   - View asset history (last 5 work orders)
   - Access job plan or checklist (if attached)
3. **Start Work**:
   - Click **"Start Work"** button
   - System records start time (clock-in)
   - WO status changes to **"In Progress"**
   - Enable GPS tracking (if configured)
4. **Perform Maintenance Tasks**:
   - Follow job plan steps
   - Complete checklist items (check boxes)
   - Record meter readings (if required)
   - Scan QR codes to verify checkpoints
5. **Request Spare Parts** (if needed):
   - Click **"Request Parts"** button
   - Search parts catalog
   - Select parts and quantities
   - Submit reservation request
   - Wait for Store Manager approval
   - **If parts unavailable**: Change WO status to **"Waiting for Parts"**
6. **Document Work**:
   - Capture before/after photos (minimum 2)
   - Record failure codes (if breakdown)
   - Enter corrective actions taken
   - Add notes or comments
   - Attach videos (optional)
7. **Complete Work**:
   - Click **"Complete Work"** button
   - System records end time (clock-out)
   - Calculate actual labor hours
   - WO status changes to **"Pending Approval"**
8. **Sync Data** (if offline):
   - When connectivity restored, app auto-syncs all changes

**Success Criteria**: Work completed, data synced, WO pending approval

---

#### 3.4 Work Order Approval (Site Manager)

1. Navigate to **Work Orders → Pending Approval**
2. Click on completed work order
3. **Review Completion Details**:
   - View before/after photos
   - Check labor hours (actual vs. estimated)
   - Review parts used and costs
   - Read technician notes
   - Verify failure codes and root cause
4. **Decision**:
   - **Approve**: If work satisfactory
     - Click **"Approve & Close"**
     - WO status changes to **"Completed"**
     - Asset status updates (operational, downtime ended)
   - **Reject**: If rework needed
     - Click **"Reject"**
     - Add rejection reason
     - WO returns to **"In Progress"**
     - Technician notified to redo work
5. **Close Work Order**:
   - WO moves to **"Closed"** column
   - Work order archived after 90 days

**Success Criteria**: WO closed, asset status updated, data archived

---

## 4. Preventive Maintenance Scheduling ❌

**Implementation Status:** ❌ **Not Implemented**

**Missing Components:**
- ❌ PM Schedule creation UI
- ❌ PM Calendar view
- ❌ Time-based triggers
- ❌ Meter-based triggers
- ❌ Job plan templates
- ❌ Recurring work order generation
- ❌ PM compliance tracking

### Process Owner
Site Manager, Technician

### Objective
Schedule and execute time-based or meter-based preventive maintenance.

### Steps

#### 4.1 Create PM Schedule (Site Manager) ❌

**Status:** ❌ Not implemented

1. Navigate to **Preventive Maintenance → PM Schedules**
2. Click **"+ New PM Schedule"**
3. **Define PM Plan**:
   - **Plan Name**: E.g., "Monthly Pump Inspection"
   - **Asset/Group**: Select equipment
   - **Work Type**: Preventive Maintenance
   - **Job Plan**: Attach standard procedure
   - **Estimated Duration**: Hours per task
   - **Assign To**: Technician or team
4. **Set Trigger Type**:
   - **Time-Based**:
     - Frequency: Daily, Weekly, Monthly, Quarterly, Annually
     - Start Date, Recurrence Rule (e.g., Every 1st Monday)
     - Time of Day (e.g., 08:00)
   - **Meter-Based**:
     - Meter Type: Operating Hours, Cycles, Kilometers
     - Threshold: E.g., Every 500 hours
     - Last Meter Reading
5. **Configure Settings**:
   - Lead Time: Days before due to generate WO (e.g., 7 days)
   - Auto-Assign: Enable/Disable
   - Notification: Email/Push when WO created
6. Click **"Save PM Schedule"**
7. System creates first work order based on schedule

**Success Criteria**: PM schedule active, first WO generated

---

#### 4.2 PM Calendar Management (Site Manager)

1. Navigate to **Preventive Maintenance → PM Calendar**
2. View upcoming PM tasks on calendar (week/month view)
3. **Drag-and-Drop Scheduling**:
   - Drag PM task to different date/time
   - System updates due date
4. **Bulk Reschedule**:
   - Select multiple PM tasks
   - Click **"Reschedule"**
   - Apply date offset (e.g., +7 days)
5. **Handle Conflicts**:
   - If technician overloaded, system highlights in red
   - Reassign to another technician
6. **Suspend PM Schedule** (if asset decommissioned):
   - Right-click PM schedule
   - Click **"Suspend"**
   - Enter reason

**Success Criteria**: PM calendar optimized, no scheduling conflicts

---

#### 4.3 Execute PM Work Order (Technician)

1. Receive PM work order notification (7 days before due)
2. Open WO in mobile app
3. View attached job plan and checklist
4. **Start Work** (same as breakdown WO)
5. **Follow Job Plan Steps**:
   - Lubrication (check oil level, add grease)
   - Inspection (visual check for leaks, cracks, wear)
   - Adjustments (tighten bolts, align belts)
   - Testing (run equipment, check performance)
6. **Complete Checklist**:
   - Check each item (Pass/Fail/NA)
   - Add notes for failed items
7. **Record Meter Reading**:
   - Enter current meter value (e.g., 5,230 hours)
   - System calculates next PM due (5,230 + 500 = 5,730 hours)
8. **Identify Defects** (if found):
   - Create follow-up corrective work order
   - Link to PM work order
9. **Complete PM Work Order**
10. System auto-schedules next PM occurrence

**Success Criteria**: PM completed, next PM scheduled, defects logged

---

## 5. Route-Based Inspection ❌

**Implementation Status:** ❌ **Not Implemented**

**Missing Components:**
- ❌ Route plan creation
- ❌ Checkpoint management
- ❌ Route execution UI
- ❌ QR code check-in
- ❌ Offline route download
- ❌ GPS navigation
- ❌ Defect reporting from routes

### Process Owner
Technician

### Objective
Perform daily/weekly inspection rounds following a predefined route.

### Steps

#### 5.1 Create Inspection Route (Site Manager) ❌

**Status:** ❌ Not implemented

1. Navigate to **Preventive Maintenance → Route Plans**
2. Click **"+ New Route Plan"**
3. **Define Route Details**:
   - Route Name: E.g., "Daily Production Line Inspection"
   - Route Code: E.g., ROUTE-001
   - Frequency: Daily, Weekly, Monthly
   - Estimated Duration: E.g., 2 hours
4. **Add Checkpoints**:
   - Click **"+ Add Checkpoint"**
   - Select functional location or equipment
   - Set checkpoint order (sequence)
   - Attach checklist for each checkpoint
   - Add GPS coordinates (optional)
5. **Assign Route**:
   - Assign to specific technician or rotating schedule
   - Set start time (e.g., 08:00)
6. Click **"Save Route Plan"**
7. System generates route work orders daily

**Success Criteria**: Route created, first route WO generated

---

#### 5.2 Download Route (Technician)

1. Open mobile app at start of shift
2. Navigate to **My Work Orders → Route Inspections**
3. Select today's route (e.g., "Daily Production Line Inspection - 2024-11-26")
4. Click **"Download Route"** (for offline access)
5. System downloads:
   - Route map with checkpoint locations
   - Checklists for each checkpoint
   - Asset details and history
   - Reference photos
6. App caches data locally

**Success Criteria**: Route downloaded, ready for offline use

---

#### 5.3 Execute Route Inspection (Technician)

1. Click **"Start Route"**
2. System shows map with checkpoint markers
3. **Navigate to First Checkpoint**:
   - Follow GPS navigation (if online)
   - Scan QR code at checkpoint to check in
4. **Complete Checkpoint Tasks**:
   - View checklist items
   - Check each item (OK/Not OK)
   - Capture photos for abnormalities
   - Record meter readings
   - Add notes
5. **Report Defects** (if found):
   - Click **"Report Defect"**
   - Enter defect description
   - Capture photo of defect
   - Set priority (Low/Medium/High)
   - System creates work notification
6. **Move to Next Checkpoint**:
   - Click **"Next Checkpoint"**
   - Repeat steps 3-5
7. **Complete All Checkpoints**:
   - System shows route progress (e.g., 8/10 checkpoints completed)
8. **Finish Route**:
   - Click **"Finish Route"**
   - System records completion time
   - Route WO status changes to **"Completed"**
9. **Sync Data**:
   - When online, app syncs all route data to server
   - Defects automatically converted to work notifications

**Success Criteria**: Route completed, defects reported, data synced

---

## 6. Spare Parts Requisition & Issue 🚧

**Implementation Status:** 🚧 **Partially Implemented**

**Implemented Components:**
- ✅ Parts list in Work Order detail panel
- ✅ Add parts from dropdown (mock catalog)
- ✅ Remove parts from WO
- ✅ Cost calculation (total parts cost)
- ✅ Parts display with quantity and cost

**Missing Components:**
- ❌ Inventory management system
- ❌ Stock level tracking
- ❌ Reorder point (ROP) alerts
- ❌ Parts reservation workflow
- ❌ Store Manager approval process
- ❌ Barcode/QR scanning
- ❌ Parts return process
- ❌ Multi-warehouse support
- ❌ Parts catalog with images

### Process Owner
Technician, Store Manager

### Objective
Request and issue spare parts for work orders.

### Steps

#### 6.1 Request Spare Parts (Technician) 🚧

**Status:** 🚧 Partially working

**Working:**
1. ✅ Open work order detail panel
2. ✅ Scroll to "Spare Parts & Materials" section
3. ✅ Select part from dropdown
4. ✅ Part added to WO with quantity and cost
5. ✅ Total cost calculated automatically

**Not Working:**
- ❌ No real inventory system (using mock data)
- ❌ No part search/filter
- ❌ No barcode scanning
- ❌ No stock availability check
- ❌ No reservation workflow

**Success Criteria:** 🚧 Parts can be added but no full requisition process

---

#### 6.2 Approve & Issue Parts (Store Manager) ❌

**Status:** ❌ Not implemented

1. Open work order in mobile app
2. Click **"Request Parts"** button
3. **Search Parts Catalog**:
   - Enter part number or description
   - Scan barcode/QR code
   - Browse by category
4. **Select Parts**:
   - Click on part from search results
   - Enter quantity required
   - Add to requisition list
5. **Review Requisition**:
   - Verify parts and quantities
   - Add notes (e.g., "Urgent - production line down")
6. Click **"Submit Requisition"**
7. System generates Reservation ID (e.g., RESV-001)
8. Parts status changes to **"Reserved"** (pending approval)
9. Store Manager receives notification

**Success Criteria**: Requisition submitted, Store Manager notified

---

#### 6.2 Approve & Issue Parts (Store Manager)

1. Navigate to **Inventory → Reservations**
2. Click on pending reservation
3. **Review Requisition**:
   - Check part availability
   - Verify work order priority
   - Confirm quantities
4. **Decision**:
   - **Approve**: If parts available
     - Click **"Approve Reservation"**
     - System reserves quantity from stock
   - **Partial Approval**: If insufficient stock
     - Adjust quantity to available amount
     - Click **"Approve Partial"**
     - Notify technician of shortage
   - **Reject**: If parts unavailable or invalid request
     - Click **"Reject"**
     - Add rejection reason
5. **Issue Parts** (when technician arrives):
   - Scan technician badge
   - Scan part barcodes
   - Confirm quantities issued
   - Print issue slip (optional)
   - Click **"Issue Parts"**
6. **Update Inventory**:
   - System deducts quantity from stock
   - Updates stock level
   - Links parts to work order
   - Records transaction in history
7. **Check Reorder Point**:
   - If stock falls below ROP, system generates reorder alert
   - Store Manager creates purchase request

**Success Criteria**: Parts issued, inventory updated, technician notified

---

#### 6.3 Return Unused Parts (Technician)

1. After completing work, open work order
2. Click **"Return Parts"**
3. Select parts to return
4. Enter quantity returned
5. Add reason (e.g., "Excess parts ordered")
6. Click **"Submit Return"**
7. Take parts back to store
8. Store Manager scans parts
9. Click **"Accept Return"**
10. System adds quantity back to stock
11. Work order cost updated

**Success Criteria**: Parts returned, stock replenished, WO cost adjusted

---

## 7. Emergency Response & EOC Coordination ❌

**Implementation Status:** ❌ **Not Implemented**

**Missing Components:**
- ❌ EOC Dashboard
- ❌ Emergency alert system
- ❌ Multi-site monitoring
- ❌ Technician location tracking
- ❌ Emergency dispatch
- ❌ External agency integration
- ❌ Emergency chat channels
- ❌ Real-time incident timeline

### Process Owner
Tenant EOC, Site Manager, Technicians

### Objective
Coordinate response to critical emergencies across multiple sites.

### Steps

#### 7.1 Emergency Detection ❌

**Status:** ❌ Not implemented

**Triggers**:
- Fire alarm system triggers API call
- SCADA detects critical failure (boiler pressure, gas leak)
- Employee calls emergency hotline
- Technician creates emergency work order

**Automatic Actions**:
1. System creates emergency work order (Priority: EMERGENCY)
2. Sends push notification to:
   - Site Manager
   - On-duty technicians
   - EOC operators
3. Triggers emergency alert sound in EOC dashboard
4. Escalates to external agencies (if configured)

---

#### 7.2 EOC Response (EOC Operator)

1. **Receive Emergency Alert**:
   - Dashboard shows red pulsing alert banner
   - Alert sound plays
   - Pop-up displays emergency details
2. **Assess Situation**:
   - View emergency type (fire, injury, equipment failure)
   - Check affected site location
   - Review severity level
3. **Activate Emergency Response**:
   - Click **"Activate Emergency Protocol"**
   - System opens emergency coordination panel
4. **Coordinate Resources**:
   - **View Available Technicians**:
     - Live map shows technician locations
     - Filter by skills (firefighting, first aid, electrical)
   - **Dispatch Technicians**:
     - Select nearest qualified technicians
     - Click **"Dispatch"**
     - Send navigation route to mobile app
   - **Notify External Agencies**:
     - Click **"Call Fire Department"** (auto-dials)
     - Click **"Call Ambulance"** (if injury)
     - Click **"Call Police"** (if security threat)
5. **Communicate with Site**:
   - Open emergency chat channel
   - Send instructions to Site Manager
   - Request status updates every 5 minutes
6. **Escalate to Management**:
   - If major incident, notify Tenant Admin
   - Send SMS to executive team
7. **Monitor Real-Time Updates**:
   - Track technician arrival times
   - Receive live photos from site
   - View incident timeline

**Success Criteria**: Response team dispatched, external agencies notified, real-time monitoring active

---

#### 7.3 On-Site Emergency Response (Technician)

1. Receive emergency dispatch notification
2. Click **"Accept Dispatch"**
3. System provides:
   - GPS navigation to site
   - Emergency contact numbers
   - Safety protocols
4. Arrive at site and check in via mobile app
5. Follow emergency procedure:
   - Evacuate personnel if needed
   - Isolate affected area
   - Perform lockout/tagout
   - Use fire extinguisher or emergency equipment
6. Provide status updates via chat:
   - "Fire under control"
   - "Evacuating building"
   - "Requesting backup"
7. Capture photos/videos of situation
8. Once resolved:
   - Click **"Emergency Resolved"**
   - Fill in incident report
   - Record actions taken
9. System closes emergency work order
10. Incident data sent to EOC for post-incident analysis

**Success Criteria**: Emergency resolved, incident documented, EOC notified

---

## 8. Cross-Site Inventory Optimization ❌

**Implementation Status:** ❌ **Not Implemented**

**Missing Components:**
- ❌ Cross-site inventory aggregation
- ❌ Stock transfer management
- ❌ Slow-moving item detection
- ❌ Demand forecasting
- ❌ Bulk purchasing module
- ❌ Supplier negotiation tracking
- ❌ Spare Part Center dashboard

### Process Owner
Tenant Spare Part Center

### Objective
Optimize inventory levels across multiple sites to reduce carrying costs.

### Steps

#### 8.1 Analyze Cross-Site Inventory (Spare Part Center) ❌

**Status:** ❌ Not implemented

1. Navigate to **Spare Part Center → Cross-Site Inventory**
2. View aggregated inventory dashboard:
   - Total stock value across all sites
   - Stock by site
   - Slow-moving items (no usage in 180 days)
   - Excess stock (above maximum level)
3. **Identify Optimization Opportunities**:
   - **Site A**: 50 units of Part X (excess)
   - **Site B**: 5 units of Part X (below ROP)
   - **Recommendation**: Transfer 20 units from Site A to Site B
4. Click **"Generate Transfer Recommendations"**
5. System uses AI to suggest optimal transfers:
   - Considers shipping costs
   - Factors in lead times
   - Prioritizes critical parts
6. Review recommendations
7. Select transfers to execute

**Success Criteria**: Transfer recommendations generated

---

#### 8.2 Create Stock Transfer (Spare Part Center)

1. Click **"Create Stock Transfer"**
2. Fill in transfer details:
   - From Site: Site A
   - To Site: Site B
   - Part Number: PART-12345
   - Quantity: 20 units
   - Reason: Balancing stock levels
   - Requested Delivery Date
3. Click **"Submit Transfer Request"**
4. System notifies:
   - Site A Store Manager (to ship parts)
   - Site B Store Manager (to receive parts)
   - Logistics team (to arrange transport)
5. Transfer status: **"Pending Shipment"**

**Success Criteria**: Transfer request created, sites notified

---

#### 8.3 Execute Stock Transfer (Site Store Managers)

**Shipping Site (Site A)**:
1. Receive transfer notification
2. Navigate to **Inventory → Transfers → Outbound**
3. Click on transfer request
4. **Pick Parts**:
   - Print picking list
   - Locate parts in warehouse
   - Scan barcodes to confirm
5. **Pack & Ship**:
   - Pack parts in box
   - Generate shipping label
   - Hand over to logistics
   - Enter tracking number
6. Click **"Mark as Shipped"**
7. System deducts quantity from Site A stock

**Receiving Site (Site B)**:
1. Receive parts delivery
2. Navigate to **Inventory → Transfers → Inbound**
3. Click on transfer (status: "In Transit")
4. **Inspect & Receive**:
   - Verify quantities
   - Check for damage
   - Scan barcodes
5. Click **"Confirm Receipt"**
6. System adds quantity to Site B stock
7. Transfer status: **"Completed"**

**Success Criteria**: Parts transferred, inventory updated at both sites

---

#### 8.4 Consolidate Procurement (Spare Part Center)

1. Navigate to **Spare Part Center → Bulk Purchasing**
2. View aggregated demand forecast:
   - Part X: Total demand across all sites = 500 units
   - Part Y: Total demand = 300 units
3. **Create Bulk Purchase Request**:
   - Select parts to purchase
   - Enter consolidated quantities
   - Assign supplier
   - Request pricing for bulk order
4. **Negotiate with Supplier**:
   - System sends RFQ to supplier
   - Receive quote (bulk discount: 15%)
   - Approve purchase
5. **Create Purchase Order**:
   - System generates tenant-level PO
   - Assign delivery to central warehouse or direct to sites
6. **Track Purchase Order**:
   - Monitor delivery status
   - Receive parts at designated sites
7. **Distribute to Sites**:
   - Allocate parts to sites based on demand forecast
   - Create stock transfers

**Success Criteria**: Bulk purchase completed, parts distributed to sites, cost savings achieved

---

## 9. Asset Downtime Tracking ❌

**Implementation Status:** ❌ **Not Implemented**

**Missing Components:**
- ❌ Downtime recording system
- ❌ Asset status management
- ❌ Downtime reason tracking
- ❌ OEE calculation
- ❌ MTTR/MTBF metrics
- ❌ Downtime analytics dashboard
- ❌ Asset performance reports

### Process Owner
Technician, Site Manager

### Objective
Track asset downtime to calculate OEE and MTTR metrics.

### Steps

#### 9.1 Record Downtime Start (Technician) ❌

**Status:** ❌ Not implemented

1. **When Asset Fails**:
   - Open mobile app
   - Navigate to **Assets**
   - Scan asset QR code or search by ID
2. Click **"Report Downtime"**
3. System records downtime start timestamp
4. Select downtime reason:
   - Breakdown
   - Planned Maintenance
   - Changeover
   - No Demand
   - Other
5. Add notes (e.g., "Bearing seized")
6. System auto-creates breakdown work order
7. Asset status changes to **"Down"**

**Success Criteria**: Downtime recorded, work order created

---

#### 9.2 Work on Asset (Technician)

1. Execute work order (see [Work Order Lifecycle](#3-work-order-lifecycle))
2. System tracks labor time
3. **If waiting for parts**:
   - Change WO status to **"Waiting for Parts"**
   - Downtime reason updates to **"Parts Shortage"**

---

#### 9.3 Record Downtime End (Technician)

1. After completing repair, open work order
2. Click **"Mark Asset Operational"**
3. System records downtime end timestamp
4. Calculate downtime duration (e.g., 4 hours 30 minutes)
5. Asset status changes to **"Operational"**
6. System updates:
   - Asset downtime history
   - OEE calculation
   - MTTR metric

**Success Criteria**: Downtime ended, metrics updated

---

#### 9.4 Analyze Downtime (Site Manager)

1. Navigate to **Reports → Asset Downtime**
2. Select date range (e.g., Last 30 Days)
3. View downtime reports:
   - **Top 10 Assets by Downtime Hours**
   - **Downtime by Reason** (Breakdown, PM, Changeover)
   - **MTTR Trend** (Mean Time To Repair)
   - **MTBF Trend** (Mean Time Between Failures)
4. Identify chronic issues (assets with frequent failures)
5. **Take Action**:
   - Increase PM frequency
   - Schedule overhaul
   - Plan equipment replacement
6. Export report to PDF

**Success Criteria**: Downtime analyzed, improvement actions identified

---

## 10. Safety Permit Management ❌

**Implementation Status:** ❌ **Not Implemented**

**Missing Components:**
- ❌ Work permit creation system
- ❌ Permit types (Hot Work, Confined Space, Electrical, Height)
- ❌ Approval workflow
- ❌ LOTO procedure management
- ❌ Safety checklist integration
- ❌ Permit attachment to work orders
- ❌ Incident reporting
- ❌ Safety compliance tracking

### Process Owner
Safety Officer, Technician

### Objective
Ensure safety compliance for high-risk maintenance activities.

### Steps

#### 10.1 Create Work Permit (Safety Officer) ❌

**Status:** ❌ Not implemented

1. Navigate to **Safety & Compliance → Work Permits**
2. Click **"+ New Work Permit"**
3. Select permit type:
   - Hot Work Permit (welding, cutting, grinding)
   - Confined Space Entry
   - Electrical Work Permit
   - Working at Height
4. Fill in permit details:
   - Work Order ID (link to WO)
   - Work Location
   - Work Description
   - Hazards Identified
   - Risk Mitigation Measures
   - Required PPE
   - Emergency Contacts
5. Attach safety documents:
   - JSA (Job Safety Analysis)
   - LOTO plan
   - Emergency response plan
6. **Assign Permit Approvers**:
   - Site Manager
   - Safety Officer
   - Operations Manager (if critical)
7. Click **"Submit for Approval"**
8. System routes permit through approval workflow

**Success Criteria**: Permit created, routed for approval

---

#### 10.2 Approve Work Permit (Site Manager)

1. Receive permit notification
2. Navigate to **Safety & Compliance → Pending Approvals**
3. Click on permit to review
4. **Assess Risks**:
   - Review hazards and controls
   - Verify PPE requirements
   - Check emergency procedures
5. **Decision**:
   - **Approve**: If safe to proceed
     - Click **"Approve"**
     - Permit status: **"Approved"**
   - **Request Changes**: If additional controls needed
     - Click **"Request Changes"**
     - Add comments
     - Safety Officer updates permit
   - **Reject**: If work too risky
     - Click **"Reject"**
     - Provide reason
6. Approved permit sent to technician

**Success Criteria**: Permit approved, technician authorized to work

---

#### 10.3 Execute Work with Permit (Technician)

1. Open work order in mobile app
2. View attached work permit
3. **Pre-Work Checklist**:
   - Review permit conditions
   - Verify required PPE (hard hat, gloves, safety harness)
   - Conduct toolbox talk with team
   - Complete pre-work safety checklist
4. **Perform LOTO** (if required):
   - Follow lockout/tagout procedure
   - Isolate energy sources
   - Apply locks and tags
   - Verify zero energy state
   - Take photo of locked equipment
5. **Start Work**:
   - Click **"Start Work"** in app
   - System logs work start time
6. **Monitor Conditions**:
   - Check atmospheric monitoring (if confined space)
   - Verify fire watch (if hot work)
   - Maintain communication with spotter
7. **Complete Work**:
   - Click **"Complete Work"**
   - Remove LOTO devices
   - Restore equipment to service
8. **Close Permit**:
   - Click **"Close Permit"**
   - Confirm all safety conditions met
   - Permit status: **"Closed"**

**Success Criteria**: Work completed safely, permit closed, LOTO removed

---

## Summary: Implementation Progress

### ✅ Fully Implemented (2/10 processes)

1. **Work Notification to Work Order Conversion** ✅
   - Complete request submission portal
   - Image upload and preview
   - Automatic WO creation with AI title generation
   - Request history tracking
   - Technician assignment

2. **Work Order Lifecycle** ✅
   - Kanban board with drag-and-drop
   - List and board views
   - Work order detail panel
   - AI-powered analysis (Gemini 2.5)
   - Smart checklist generation
   - Image attachments with fullscreen
   - Basic parts tracking

### 🚧 Partially Implemented (1/10 processes)

3. **Spare Parts Requisition & Issue** 🚧
   - ✅ Add/remove parts from WO
   - ✅ Cost calculation
   - ❌ No inventory management
   - ❌ No approval workflow
   - ❌ No stock tracking

### ❌ Not Implemented (7/10 processes)

4. **Tenant & Site Onboarding** ❌
5. **Preventive Maintenance Scheduling** ❌
6. **Route-Based Inspection** ❌
7. **Emergency Response & EOC Coordination** ❌
8. **Cross-Site Inventory Optimization** ❌
9. **Asset Downtime Tracking** ❌
10. **Safety Permit Management** ❌

### Current System Capabilities

**Working Features:**
- ✅ Authentication (Login page with mock users)
- ✅ Landing page
- ✅ Work request portal with image upload
- ✅ Work order board (Kanban + List views)
- ✅ Drag-and-drop status updates
- ✅ AI analysis (Gemini 2.5 API)
- ✅ Smart checklist generation
- ✅ Basic spare parts tracking
- ✅ Role-based views (Admin, Technician, Requester)
- ✅ Image storage and retrieval (backend)
- ✅ Toast notifications (2.5s, bottom-right)

**Priority Next Steps:**
1. 🚧 Complete spare parts inventory management
2. ❌ Build asset management module
3. ❌ Implement PM scheduling system
4. ❌ Add mobile app with offline support
5. ❌ Create tenant/site management
6. ❌ Develop EOC dashboard

---

## Process Improvement & Feedback

### Continuous Improvement

Each core process MUST be reviewed quarterly by process owners to identify:
- Bottlenecks and inefficiencies
- User pain points
- Automation opportunities
- Integration gaps

### Feedback Mechanism

Users can submit process improvement suggestions via:
1. In-app feedback form (Help → Submit Feedback) - ❌ Not implemented
2. Quarterly process review workshops
3. User forum discussions - ❌ Not implemented

### KPI Tracking

Each core process MUST have measurable KPIs:
- **Process Cycle Time**: Average time to complete process
- **Process Compliance Rate**: % of processes following standard steps
- **User Satisfaction Score**: Rating from process participants
- **Error Rate**: % of processes requiring rework

**Current KPI Status:** ❌ No KPI tracking implemented

---

**Document Version**: 1.1  
**Last Updated**: November 26, 2025  
**Next Review Date**: February 26, 2026  
**Owner**: Product Management Team

**Revision Notes:**
- Added implementation status badges (✅/🚧/❌)
- Compared PRD requirements with actual codebase
- Documented working vs. missing features
- Prioritized next development steps
