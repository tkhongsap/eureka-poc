# Technician Features - Task Mapping

เอกสารนี้แสดงการจับคู่ระหว่าง Technician Features ใน feature checklist กับ tasks ที่เกี่ยวข้องใน task list

## 5. Technician Features

### ✅ View assigned work orders on mobile
**Related Tasks:**
- **5.1** Create mobile work order list view wireframe
- **5.2** Create mobile work order detail view wireframe
- **17.5.3** Add query parameters for assigned technician filter ("Assigned to Me")
- **29.3** Connect work order Kanban board to API
  - 29.3.1 Fetch work orders from backend
  - 29.3.2 Update work order status via drag-and-drop
- **38.1** Implement offline data synchronization
  - 38.1.1 Store offline changes in IndexedDB
  - 38.1.2 Queue API requests when offline

### ❌ Access detailed work instructions
**Related Tasks:**
- **20.3** Implement job plans
  - 20.3.1 Create reusable job plan templates
  - 20.3.2 Store task checklists in job plans
  - 20.3.3 Attach job plans to PM schedules
  - 20.3.4 Copy job plan to work order on creation
- **31.1** Implement work order templates
  - 31.1.2 Store predefined checklists and procedures (AI-generated)

### ❌ Access checklists
**Related Tasks:**
- **5.6** Create checklist and forms mobile interface
- **20.3.2** Store task checklists in job plans
- **31.1.2** Store predefined checklists and procedures
- **38.1.4** Offline checklists (implied in offline sync)

### ❌ Access reference documents
**Related Tasks:**
- **31.5** Implement work order attachments
  - 31.5.1 Upload files to MinIO (backend storage)
  - 31.5.2 Link files to work orders (imageIds array)
  - 31.5.3 Display attachments in work order details
  - 31.5.4 Support multiple file types (images, PDFs, videos)
- **28.2** Implement file upload logic
- **28.3** Implement file retrieval logic
  - 28.3.1 Generate presigned URLs for secure access

### ❌ Clock in/out for labor time
**Related Tasks:**
- **22.4** Implement availability tracking
  - 22.4.1 Track leave requests
  - 22.4.2 Track training schedules
  - 22.4.3 Calculate available capacity
- **31.4** Implement work order cost tracking
  - 31.4.1 Track labor costs (hours × rate)

### ❌ Record failure codes
**Related Tasks:**
- **18.5** Implement asset downtime tracking
  - 18.5.4 Store failure codes and root causes

### ❌ Record root causes
**Related Tasks:**
- **18.5.4** Store failure codes and root causes
- **8.0** Predictive Maintenance (Phase 3)
  - Root cause analysis (RCA) mentioned in feature checklist

### ❌ Record corrective actions
**Related Tasks:**
- **18.5.4** Store failure codes and root causes (implied)
- **36.3** Implement incident reporting
  - 36.3.3 Track corrective actions

### ❌ Request/reserve spare parts
**Related Tasks:**
- **19.4** Implement parts reservation
  - 19.4.1 Reserve parts for specific work orders
  - 19.4.2 Reduce available stock count
  - 19.4.3 Release reservation on work order completion
  - 19.4.4 Handle partial reservations
- **19.5** Implement parts issuance and returns
  - 19.5.1 Issue parts from stock to work order
  - 19.5.2 Deduct from inventory

### ✅ Attach photos/videos
**Related Tasks:**
- **31.5** Implement work order attachments
  - 31.5.1 Upload files to MinIO (backend storage)
  - 31.5.2 Link files to work orders (imageIds array)
  - 31.5.3 Display attachments in work order details
  - 31.5.4 Support multiple file types (images, PDFs, videos)
- **28.2** Implement file upload logic
  - 28.2.1 Handle multipart file uploads
  - 28.2.2 Validate file types and sizes
- **38.3** Implement photo/video capture
  - 38.3.1 Access device camera
  - 38.3.2 Capture photos and videos
  - 38.3.3 Compress media before upload

### ❌ In-app chat with Site Managers
**Related Tasks:**
- **30.0** Real-Time Updates Implementation
  - 30.1 Set up WebSocket server
  - 30.2 Implement work order real-time updates
  - 30.3 Implement frontend WebSocket client
- **34.2** Implement emergency coordination
  - 34.2.3 Coordinate with external agencies
- *Note: No specific chat/messaging task found - may need to be added*

### ✅ Update work order status
**Related Tasks:**
- **17.4** Implement work order status transitions
  - 17.4.1 Define allowed status transitions (Open → In Progress → Pending → Completed)
  - 17.4.2 Validate transition rules before update
  - 17.4.3 Update status in database (via drag-and-drop)
- **29.3.2** Update work order status via drag-and-drop
- **30.2.1** Broadcast work order status changes (real-time)

### ❌ Scan QR codes for asset info
**Related Tasks:**
- **5.3** Design QR code scanner interface
- **21.1.2** Allow QR code scanning for asset linking
- **32.4** Implement asset QR code generation
  - 32.4.1 Generate unique QR codes for assets
  - 32.4.2 Link QR codes to asset IDs
  - 32.4.4 Implement QR code scanning in mobile app
- **38.2** Implement QR code scanning
  - 38.2.1 Integrate QR code scanner library
  - 38.2.2 Scan asset QR codes
  - 38.2.3 Scan part QR codes for inventory
- **45.2.1** Test QR code scanning

### ❌ View shift schedule
**Related Tasks:**
- **22.3** Implement shift scheduling
  - 22.3.1 Define shift templates (start/end times)
  - 22.3.2 Create shift assignments for technicians
  - 22.3.3 Handle rotation cycles
  - 22.3.4 Manage company holidays and non-working days
- **22.4.4** Show technician availability on calendar
- **12.0** Workforce Management (feature checklist)
  - Shift schedules (calendar view) mentioned

### ❌ Mobile app user registration
**Related Tasks:**
- **15.3** Implement registration endpoint logic
  - 15.3.1 Validate registration input (email, password strength)
  - 15.3.2 Check for existing user conflicts
  - 15.3.3 Hash password before storing
  - 15.3.4 Create user record in database
- **29.2** Implement authentication flow
  - 29.2.1 Create login form component
  - 29.2.2 Connect login to backend API
- *Note: Mobile-specific registration UI not explicitly mentioned*

---

## Summary by Task Phase

### Phase 1 Tasks (High-Level Mockups & Skeleton)
- 5.0 Mobile PWA Wireframe (5.1, 5.2, 5.3, 5.6)

### Phase 2 Tasks (Core Feature Implementation)
- 17.0 Work Order Management Core Logic (17.4, 17.5.3)
- 18.5 Asset downtime tracking (18.5.4)
- 19.4 Parts reservation (19.4.1-19.4.4)
- 19.5 Parts issuance (19.5.1-19.5.2)
- 20.3 Job plans (20.3.1-20.3.4)
- 22.3 Shift scheduling (22.3.1-22.3.4)
- 22.4 Availability tracking (22.4.1-22.4.4)

### Phase 3 Tasks (Integration & Validation)
- 28.0 Object Storage Integration (28.2, 28.3)
- 29.0 Frontend-Backend Integration (29.2, 29.3)
- 30.0 Real-Time Updates (30.1, 30.2, 30.3)

### Phase 4 Tasks (Advanced Features)
- 31.1 Work order templates (31.1.2)
- 31.4 Work order cost tracking (31.4.1)
- 31.5 Work order attachments (31.5.1-31.5.4)
- 32.4 Asset QR code generation (32.4.1-32.4.4)
- 36.3 Incident reporting (36.3.3)
- 38.0 Mobile PWA Enhancements (38.1, 38.2, 38.3, 38.4)

### Phase 5 Tasks (Testing & QA)
- 45.0 Mobile PWA Testing (45.2.1, 45.3)
- 49.2.2 Create test scenarios for Technician role

---

*Document created: 2025-12-08*  
*Reference: docs/04-feature-checklist.md (Section 5) and docs/02-tasks-eureka-cmms.md*
