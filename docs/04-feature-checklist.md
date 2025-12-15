# Eureka CMMS - Feature Checklist

เอกสารนี้รวบรวม Feature ทั้งหมดตาม PRD โดยอ้างอิงชื่อ feature และโครงสร้างตาม PRD เป็นหลัก

**สถานะ:**
- ✅ เสร็จแล้ว
- 🔄 กำลังทำ  
- ❌ ยังไม่ได้ทำ

**อัพเดทล่าสุด:** 2025-12-11

---

## 1. Tenant & Site Management

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| Multi-tenant architecture | ❌ | Phase 1 - ปัจจุบันเป็น single tenant |
| Tenant isolation | ❌ | Phase 1 |
| Onboard new tenants | ❌ | Super Admin feature |
| License management | ❌ | Phase 1 |
| Create/manage multiple sites | ❌ | Tenant Admin feature |
| Assign Site Managers | ❌ | |
| Tenant-level master data | ❌ | |
| Tenant switcher dropdown | ❌ | Phase 1 |
| Site configuration | ❌ | |
| Organizational policies | ❌ | |
| Tenant branding (logo, colors) | ❌ | |

---

## 2. Authentication & Authorization

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| PASETO/JWT authentication | ✅ | Phase 1 - ใช้ JWT + Authlib + Google OAuth |
| User login/logout | ✅ | Phase 1 |
| Role-based access control (RBAC) | ✅ | Phase 1 - 4 roles: Admin, Head Technician, Technician, Requester |
| User session management | ✅ | ใช้ sessionStorage |
| Password reset/change | ❌ | Phase 1 |
| User management | ✅ | Phase 1 |
| Two-Factor Authentication | ❌ | |
| Keycloak integration | ❌ | Phase 2 |
| User profile | ✅ | Settings.tsx - ดู/แก้ไขชื่อ, เบอร์โทร, เปลี่ยนรูปโปรไฟล์ได้ |
| User preferences | ✅ | Settings.tsx - Notification preferences บันทึกลง DB แล้ว |
| Team structure (teamId) | ✅ | เพิ่มเติม - Technician → Head Technician routing |

---

## 3. Work Notifications (Work Requests)

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| Submit work notifications via mobile-friendly portal | ✅ | Phase 1 - Work Request Portal |
| Attach photos and descriptions | ✅ | Phase 1 - รองรับ image upload |
| QR code scanning for equipment/locations | ❌ | Phase 1 |
| Track notification status | ✅ | Phase 1 |
| Receive updates when work is completed | ✅ | Phase 1 - In-app notification |
| Notification-to-work order conversion | ✅ | Phase 1 |
| Link notifications to assets/locations | ✅ | Phase 1 - Location picker (เพิ่มเติม) |
| AI-generated title | ✅ | เพิ่มเติมจาก PRD - Gemini AI |
| Open Notifications list | ✅ | Phase 1 |
| In Progress notifications | ✅ | Phase 1 |
| Converted notifications | ✅ | Phase 1 |
| Closed notifications | ✅ | Phase 1 |
| All Notifications list | ✅ | Phase 1 |
| Call center API integration | ❌ | |
| Priority levels based on urgency | ✅ | |

---

## 4. Work Order Management

### Board Layout (Kanban-Style)

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| Multi-column Kanban layout | ✅ | Phase 1 - 5 columns (Open, In Progress, Pending, Completed, Canceled) |
| Drag-and-drop status updates | ✅ | Phase 1 - รองรับ workflow rules ตาม role |
| Collapsible columns | ✅ | Phase 1 - คลิกเพื่อย่อ/ขยาย column |
| Column customization | ✅ | Phase 1 - เลือก columns ที่จะแสดง ผ่าน Board Settings |
| Column counters | ✅ | Phase 1 - แสดงจำนวน WO ในแต่ละ column |
| Swimlanes (priority/asset/technician) | ✅ | Phase 1 - Group by None/Priority/Technician |

### Work Order Cards

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| Work order ID with clickable link | ✅ | Phase 1 |
| Title/description | ✅ | Phase 1 |
| Priority indicator (color-coded) | ✅ | Phase 1 - Critical=red, High=orange, Medium=blue, Low=green |
| Asset/equipment name | ✅ | Phase 1 |
| Assigned technician avatar/name | ✅ | Phase 1 |
| Due date with overdue highlighting | ✅ | Phase 1 |
| Age indicator | ❌ | |
| Quick action icons | ❌ | |
| Labels/tags | ❌ | |
| Attachment indicator | ✅ | Phase 1 |
| Comment count indicator | ❌ | |

### Card Interactions

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| Click to open detail modal/side panel | ✅ | Phase 1 |
| Quick preview on hover | ❌ | |
| Right-click context menu | ❌ | |
| Bulk selection with checkboxes | ❌ | Phase 1 |

### Filtering & Search

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| Quick filters (My WO, Overdue, High Priority, Unassigned) | ✅ | Phase 1 |
| Advanced filters (multiple criteria) | ✅ | Phase 1 |
| Search bar (full-text) | ✅ | Phase 1 |
| Saved filters | ❌ | Phase 1 |
| Filter persistence across sessions | ❌ | Phase 1 |

### Board Views

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| My Board | ❌ | |
| Team Board | ❌ | |
| Site Board | ❌ | |
| Asset Board | ❌ | |
| Custom Boards | ❌ | |
| List View (table format) | ✅ | Phase 1 |
| Calendar View | ❌ | Phase 1 |

### Work Order Features

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| Create work order | ✅ | Phase 1 |
| Edit work order | ✅ | Phase 1 |
| Delete work order | ✅ | Phase 1 |
| Work order detail view | ✅ | Phase 1 |
| Status workflow | ✅ | Phase 1 - Open → In Progress → Pending → Completed → Closed |
| Assign to technician | ✅ | Phase 1 |
| Due date management | ✅ | Phase 1 |
| Export to Excel/PDF | ❌ | Phase 1 |
| Real-time updates (WebSocket) | 🔄 | Phase 1 - ใช้ polling 30s แทน |

---

## 5. Technician Features

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| View assigned work orders on mobile | ✅ | |
| Access detailed work instructions | ❌ | |
| Access checklists | ❌ | |
| Access reference documents | ❌ | |
| Clock in/out for labor time | ❌ | |
| Record failure codes | ❌ | |
| Record root causes | ❌ | |
| Record corrective actions | ❌ | |
| Request/reserve spare parts | ❌ | |
| Attach photos/videos | ✅ | |
| In-app chat with Site Managers | ❌ | |
| Update work order status | ✅ | |
| Scan QR codes for asset info | ❌ | |
| View shift schedule | ❌ | |
| Mobile app user registration | ❌ | |

---

## 6. Preventive Maintenance

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| PM Calendar (drag-and-drop) | ❌ | Phase 2 |
| PM Schedules | ❌ | Phase 2 |
| Time-based PM (daily/weekly/monthly) | ❌ | Phase 2 |
| Meter-based PM triggers | ❌ | Phase 2 |
| Route plans (inspection routes) | ❌ | Phase 2 |
| Job plans (standard procedures) | ❌ | Phase 2 |
| Digital checklists | ❌ | Phase 2 |
| PM compliance report | ❌ | Phase 2 |
| PM templates | ❌ | Phase 2 |
| Assign PM to technicians/teams | ❌ | Phase 2 |

---

## 7. Route-Based Maintenance

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| Download inspection route (offline) | ❌ | Phase 2 |
| Navigate route with checklist | ❌ | Phase 2 |
| QR code scan at checkpoints | ❌ | Phase 2 |
| Complete inspection checklists | ❌ | Phase 2 |
| Capture photos at checkpoints | ❌ | Phase 2 |
| Record meter readings | ❌ | Phase 2 |
| Report defects/abnormalities | ❌ | Phase 2 |
| Submit completed route | ❌ | Phase 2 |

---

## 8. Predictive Maintenance

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| IoT sensor data integration | ❌ | Phase 3 |
| SCADA/PLC integration | ❌ | Phase 2/3 |
| Predictive triggers | ❌ | Phase 3 |
| Auto-create WO from anomalies | ❌ | Phase 3 |
| MTBF/MTTR analysis | ❌ | Phase 2 |
| Root cause analysis (RCA) | ❌ | Phase 2 |
| RCM strategies | ❌ | Phase 3 |
| Failure pattern analysis | ❌ | Phase 3 |

---

## 9. Asset Management

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| Asset hierarchy (tree view) | ✅ | Phase 1 - AssetHierarchy.tsx + backend API + PostgreSQL |
| Functional locations | ✅ | Phase 1 - location field in assets + hierarchy structure |
| Equipment list with filters | ✅ | Phase 1 - GET /api/assets with filters |
| Asset register | ✅ | Phase 1 - assets table in DB |
| Critical assets | ✅ | Phase 1 - criticality field (Critical/High/Medium/Low) |
| Downtime tracking | ✅ | Phase 1 - asset_downtimes table + API + Tab UI |
| Meter readings | ✅ | Phase 1 - meter_readings table + API + Tab UI |
| Warranties tracking | ✅ | Phase 1 - warranty_expiry field |
| Asset map (GIS view) | ❌ | Phase 2 - ยังไม่ทำ |
| QR code scanning | ❌ | Phase 2 - ยังไม่ทำ |
| Asset CRUD operations | ✅ | Phase 1 - Full CRUD via API (Admin/Head Tech) |
| Asset classifications & criticality | ✅ | Phase 1 - type + criticality fields |
| Technical specifications | ✅ | Phase 1 - model, manufacturer, serial_number |
| Manuals/drawings attachment | ❌ | |
| Bill of Materials (BOM) | ❌ | |
| TCO calculation | ❌ | |
| Asset performance dashboards | ✅ | Phase 1 - Statistics API (active_downtimes, total_hours, avg_health) |
| Log asset downtime | ✅ | Phase 1 - /api/assets/downtimes endpoints |
| Asset condition/status update | ✅ | Phase 1 - status field (Operational/Maintenance/Downtime) |
| AI Asset Analysis | ✅ | เพิ่มเติม - Gemini AI วิเคราะห์ reliability |

---

## 10. Inventory & Spare Parts Management

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| Parts catalog | 🔄 | มี Inventory.tsx - UI only, ใช้ mock data, ยังไม่มี backend |
| Stock levels | 🔄 | แสดงใน UI (quantity/minLevel) แต่ไม่มี backend |
| Reorder alerts (ROP) | 🔄 | มี low stock indicator ใน UI |
| Transactions (issue/receive) | ❌ | Phase 1 |
| Reservations for WOs | ❌ | Phase 1 |
| Cycle counts | ❌ | Phase 1 |
| Purchase requests | ❌ | Phase 1 |
| Suppliers directory | ❌ | Phase 1 |
| Stock transfers | ❌ | Phase 1 |
| Multi-warehouse support | 🔄 | มี location field ใน mock (WH-A-01, etc.) |
| Bin location tracking | 🔄 | มี location field ใน mock |
| Goods receipts | ❌ | |
| Stock adjustments | ❌ | |
| Parts images/specifications | ❌ | |
| Part returns/repairs | ❌ | |
| Barcode/QR/RFID scanning | ❌ | |
| Link spare parts to BOMs | ❌ | |
| Part usage history | ❌ | |
| AI Stock Analysis | ✅ | เพิ่มเติม - Gemini AI วิเคราะห์ inventory |

---

## 11. Spare Part Center (Tenant-Level)

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| Cross-site inventory view | ❌ | Phase 2 |
| Bulk purchasing | ❌ | Phase 2 |
| Stock optimization | ❌ | Phase 2 |
| Slow-moving items | ❌ | Phase 2 |
| Demand forecasting | ❌ | Phase 3 |
| Supplier negotiations | ❌ | Phase 2 |
| Transfer recommendations | ❌ | Phase 2 |
| Supplier performance metrics | ❌ | |

---

## 12. Workforce Management

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| Technician directory | 🔄 | มี TeamSchedule.tsx - แสดง users จาก API (ไม่รวม Requester) |
| Skills matrix (skills & certifications) | ❌ | Phase 2 |
| Shift schedules (calendar view) | ❌ | Phase 2 - มี TeamSchedule UI แต่ยังไม่มี calendar |
| Workload planning | ❌ | Phase 2 |
| Time tracking | ❌ | Phase 2 |
| Contractors management | ❌ | Phase 2 |
| Availability (leave/absences) | 🔄 | มี status field (Available/Busy/Off-Shift/On-Leave) |
| Proficiency levels | ❌ | |
| Shift rotation cycles | ❌ | |
| Company holidays | ❌ | |
| Staffing gap identification | ❌ | |

---

## 13. Enterprise Operations Center (EOC)

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| Multi-site dashboard | ❌ | Phase 2 |
| Critical events monitoring | ❌ | Phase 2 |
| Cross-site technician dispatch | ❌ | Phase 2 |
| Live map (site & technician) | ❌ | Phase 2 |
| Communication hub | ❌ | Phase 2 |
| Emergency coordination | ❌ | |
| Resource allocation | ❌ | |
| Escalation to supply chain | ❌ | |

---

## 14. Safety & Compliance

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| Work permits management | ❌ | Phase 2 |
| LOTO procedures | ❌ | Phase 2 |
| Safety checklists | ❌ | Phase 2 |
| Incident reports | ❌ | Phase 2 |
| Audit trail | 🔄 | มี AuditLog model ใน backend แต่ยังไม่มี UI |
| Compliance reports (ISO/FDA/OSHA) | ❌ | Phase 2 |
| Safety incident investigation | ❌ | |
| Near-miss tracking | ❌ | |
| Corrective actions tracking | ❌ | |

---

## 15. Reports & Analytics

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| Pre-built KPI dashboards | 🔄 | มี Dashboard เบื้องต้น |
| OEE Dashboard | ❌ | Phase 2 |
| MTBF/MTTR Dashboard | ❌ | Phase 2 |
| Cost Analysis | ❌ | Phase 2 |
| PM Compliance | ❌ | Phase 2 |
| Inventory Turnover | ❌ | Phase 2 |
| Custom Reports builder | ❌ | Phase 2 |
| Scheduled Reports | ❌ | Phase 2 |
| Export (CSV/Excel/PDF) | ❌ | Phase 2 |
| BI Integration (Power BI/Tableau) | ❌ | Phase 3 |
| Labor efficiency reports | ❌ | |
| Asset failure analysis | ❌ | |
| Six Big Losses | ❌ | |

---

## 16. Mobile PWA with Offline Support

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| Progressive Web App (PWA) | ❌ | Phase 1 |
| Service worker | ❌ | Phase 1 |
| Install prompt | ❌ | Phase 1 |
| Push notifications | ❌ | Phase 1 |
| Offline work order access | ❌ | Phase 1 |
| Offline status updates | ❌ | Phase 1 |
| Offline photo capture | ❌ | Phase 1 |
| Offline checklists | ❌ | Phase 1 |
| Data synchronization | ❌ | Phase 1 |
| Conflict resolution | ❌ | Phase 1 |
| Pre-download relevant data | ❌ | |
| Offline queue with timestamps | ❌ | |

---

## 17. Location Services

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| GPS coordinates capture | ✅ | Phase 1 - LocationPicker ใช้ Geolocation API |
| Map integration | ✅ | Phase 1 - ใช้ Leaflet |
| Location picker | ✅ | Phase 1 |
| Technician location tracking | ❌ | Phase 1 |
| BLE beacon support | ❌ | |
| Indoor positioning (AI) | ❌ | Phase 3 |

---

## 18. Native Mobile App

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| Flutter mobile app | ❌ | Phase 2 |
| Android support | ❌ | Phase 2 |
| iOS support | ❌ | Phase 2 |
| HarmonyOS support | ❌ | Phase 2 |
| Local database (Drift/SQLite) | ❌ | Phase 2 |

---

## 19. Integrations

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| SAP integration | ❌ | Phase 2 |
| IoT/SCADA integration | ❌ | Phase 2 |
| ERP integration | ❌ | |
| MES integration | ❌ | |
| BMS integration | ❌ | |
| API for external systems | ❌ | |

---

## Navigation & UI Components

### Top Navigation Bar

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| Logo (clickable to dashboard) | ✅ | Eureka CMMS logo |
| Tenant selector | 🔄 | มี Site Switcher UI ใน Header แต่ยังไม่ทำงาน (hardcoded "Plant A") |
| Global search (Cmd/Ctrl + K) | 🔄 | มี Search bar ใน Header แต่ยังไม่ทำงานจริง, ไม่มี keyboard shortcut |
| Recent searches dropdown | ❌ | |
| Quick filters by type | ❌ | |
| Quick actions (create new) | ❌ | Phase 1 |
| Notifications bell icon | ✅ | NotificationCenter |
| Unread count badge | ✅ | |
| Mark all as read | ✅ | มี API และ UI แล้ว |
| User menu dropdown | ✅ | |
| User avatar with status | ✅ | แสดง avatar ใน Header, รองรับ upload รูปใหม่ได้ |
| Theme toggle (light/dark) | 🔄 | มีปุ่ม Sun/Moon, toggle state ได้ แต่ไม่มี dark mode CSS จริง |
| Language selector | ✅ | TH/EN switcher ใน Header |

### Sidebar Navigation

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| Collapsible sidebar | ✅ | Toggle ได้ |
| Role-based menu visibility | ✅ | Different menus per role |
| Active state highlight | ✅ | |
| Badge indicators (counts) | ✅ | Notification count |
| 🏠 Dashboard menu | ✅ | Admin only |
| 📋 Work Orders menu | ✅ | List view |
| 📢 Work Notifications menu | ✅ | เรียกว่า "Requests" |
| 🏭 Assets menu | 🔄 | มี UI แต่ใช้ mock data, ไม่มี backend API |
| 📦 Inventory menu | 🔄 | มี UI และ AI Analysis แต่ใช้ mock data, ไม่มี backend CRUD |
| 🔧 Preventive Maintenance menu | ❌ | Phase 2 |
| 👥 Workforce menu | 🔄 | แสดง users จาก API แต่ไม่มี calendar/schedule จริง |
| 📊 Reports & Analytics menu | 🔄 | WO Summary/Status/Priority ใช้ได้, ที่เหลือ Coming Soon |
| 🏢 EOC menu | ❌ | Phase 2 |
| 🏪 Spare Part Center menu | ❌ | Phase 2 |
| 🔒 Safety & Compliance menu | ❌ | Phase 2 |
| ⚙️ Settings menu | ✅ | Profile ✅, Notification Preferences ✅, About ✅ |
| ❓ Help & Support menu | 🔄 | FAQs ✅, Shortcuts ✅, What's New ✅, User Guide/Video/Contact = Coming Soon |
| Keyboard shortcuts (Cmd+B toggle) | ✅ | มีใน App.tsx - Ctrl+B / Cmd+B toggle sidebar |
| Breadcrumb navigation | ✅ | มี Breadcrumb.tsx - แสดง path navigation |
| Mobile slide-out drawer | ❌ | รอทำ responsive mobile |

---

## Dashboard

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| KPI widgets | ✅ | Status counts (Open, In Progress, Pending, Overdue) |
| Work order status overview | ✅ | 5 status cards |
| Priority distribution (pie chart) | ✅ | Interactive hover effect (เพิ่มเติม) |
| Work orders trend chart | ✅ | Line chart + period selector (Today to 1 Year) |
| Bar chart for Today | ✅ | เพิ่มเติมจาก PRD |
| Work orders by technician | ✅ | |
| Average completion time | ✅ | |
| Real-time refresh | ✅ | 30 seconds polling |
| Recent work orders | ✅ | 8 รายการล่าสุด พร้อม popup details |
| Alerts panel | ✅ | Overdue + High priority unassigned |
| Quick actions | 🔄 | UI พร้อม, รอเชื่อมต่อ API |

---

## Design System

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| Color palette | 🔄 | ใช้ Teal เป็นหลักแทน PRD Blue (#2563EB) |
| Priority colors | ✅ | Critical=red, High=orange, Medium=blue, Low=green |
| Typography (Inter/Outfit) | ❌ | ใช้ system font + serif |
| Spacing system (4px base) | ✅ | Tailwind spacing |
| Cards with shadows | ✅ | |
| Rounded corners | ✅ | 8px/12px |
| Lucide Icons | ✅ | |
| Badges & Tags | ✅ | |
| Form inputs | ✅ | |
| Buttons (Primary/Secondary/Ghost/Danger) | ✅ | |
| Loading states | ✅ | LoadingButton |
| Empty states | ✅ | EmptyState |
| Toast notifications | ✅ | |
| Modal dialogs | ✅ | |
| Responsive design | 🔄 | Desktop/tablet รองรับ, mobile ยังไม่สมบูรณ์ |

---

## Technical Stack Comparison

| PRD Requirement | Implementation | หมายเหตุ |
|-----------------|----------------|----------|
| **Backend** | | |
| TypeScript + ElysiaJS (Bun) | Python + FastAPI | เปลี่ยน stack |
| PostgreSQL 15+ | PostgreSQL (Docker) | ✅ ตรงตาม PRD |
| Redis 7+ | - | ยังไม่ได้ implement |
| RabbitMQ/Kafka | - | ยังไม่ได้ implement |
| MinIO/S3 | Local storage | ใช้ local file storage |
| InfluxDB (time-series) | - | ยังไม่ได้ implement |
| **Frontend** | | |
| SvelteKit | React 19 + Vite | เปลี่ยน framework |
| UnoCSS | Tailwind CSS 4 | |
| Svelte stores | Zustand | State management |
| TanStack Query | - | ไม่ได้ใช้ |
| Chart.js/ECharts | Recharts | Charts library |
| Leaflet | React-Leaflet | ✅ ตรงตาม PRD |
| Lucide Icons | Lucide React | ✅ ตรงตาม PRD |
| **DevOps** | | |
| Docker | Docker (PostgreSQL only) | |
| Kubernetes | - | Local dev only |
| GitHub Actions | - | No CI/CD yet |

---

## เพิ่มเติมจาก PRD (Features ที่เราเพิ่มเอง)

| Feature | สถานะ | หมายเหตุ |
|---------|-------|----------|
| AI Title Generation (Gemini) | ✅ | ใช้ Gemini API สร้าง title อัตโนมัติ |
| Toast notifications | ✅ | UI feedback |
| Loading states | ✅ | LoadingButton component |
| Empty states | ✅ | EmptyState component |
| Landing page | ✅ | หน้าแรกก่อน login |
| Requestor portal | ✅ | แยก portal สำหรับ requestor |
| Team schedule view | ✅ | TeamSchedule component |
| Per-user notification system | ✅ | Notifications ส่งถึงผู้ใช้รายบุคคลด้วย recipientName |
| managedBy tracking | ✅ | Track admin ที่ assign งาน เพื่อ route notifications |
| Reject history | ✅ | แสดงประวัติการ reject งานใน WO detail |
| WO Canceled notification | ✅ | แจ้งเตือน Requester เมื่อ Admin ยกเลิก WO |
| Due date reminder skip | ✅ | ไม่ส่ง WO_DUE_7_DAYS ถ้า WO เพิ่งสร้างวันเดียวกัน |
| Status-colored WO cards | ✅ | Recent WO cards ใน Dashboard มีสีตาม status |
| Status-colored WO popup | ✅ | WO detail popup header สีตาม status |
| Enhanced Alert popup | ✅ | แสดง days overdue, description, status, createdBy, assignedTo |
| Navigate to WO from popup | ✅ | กดปุ่มใน popup เพื่อไปหน้า Work Orders และเปิด WO detail |
| Navigate to WO from notification | ✅ | กด notification แล้วเปิด WO detail panel ทันที (ทุก role) |
| Work Orders by Technician detail | ✅ | แสดง In Progress, Completed, Open, Pending ของแต่ละช่าง |
| Request page authentication | ✅ | /request ต้อง login ก่อนเข้าถึง |
| Profile avatar upload | ✅ | กดที่รูปโปรไฟล์เพื่อ upload รูปใหม่ |
| Image serve endpoint | ✅ | /api/images/{id}/raw สำหรับแสดงรูปภาพ |
| Profile sync to Header | ✅ | อัปเดตรูปใน Header ทันทีหลังบันทึก |

---

## Progress Summary

| หมวดหมู่ | เสร็จแล้ว | กำลังทำ | ยังไม่ได้ทำ | รวม | % |
|----------|-----------|---------|-------------|-----|---|
| Tenant & Site Management | 0 | 0 | 11 | 11 | 0% |
| Authentication | 8 | 0 | 3 | 11 | 73% |
| Work Notifications | 12 | 0 | 2 | 14 | 86% |
| Work Order Management | 25 | 1 | 20 | 46 | 54% |
| Technician Features | 3 | 0 | 12 | 15 | 20% |
| Preventive Maintenance | 0 | 0 | 10 | 10 | 0% |
| Route-Based Maintenance | 0 | 0 | 8 | 8 | 0% |
| Predictive Maintenance | 0 | 0 | 8 | 8 | 0% |
| Asset Management | 0 | 4 | 15 | 19 | 11% |
| Inventory Management | 1 | 5 | 13 | 19 | 5% |
| Spare Part Center | 0 | 0 | 8 | 8 | 0% |
| Workforce Management | 0 | 2 | 9 | 11 | 9% |
| EOC | 0 | 0 | 8 | 8 | 0% |
| Safety & Compliance | 0 | 1 | 8 | 9 | 6% |
| Reports & Analytics | 0 | 1 | 12 | 13 | 4% |
| Mobile PWA | 0 | 0 | 12 | 12 | 0% |
| Location Services | 3 | 0 | 3 | 6 | 50% |
| Native Mobile App | 0 | 0 | 5 | 5 | 0% |
| Integrations | 0 | 0 | 6 | 6 | 0% |
| Top Navigation | 7 | 3 | 3 | 13 | 54% |
| Sidebar | 11 | 5 | 3 | 19 | 58% |
| Dashboard | 10 | 1 | 0 | 11 | 91% |
| Design System | 11 | 2 | 1 | 14 | 79% |
| เพิ่มเติมจาก PRD | 22 | 0 | 0 | 22 | 100% |
| **รวมทั้งหมด** | **113** | **25** | **171** | **309** | **37%** |

---

*Document maintained by: Development Team*  
*Reference: PRD v1.0 (2025-11-26)*
