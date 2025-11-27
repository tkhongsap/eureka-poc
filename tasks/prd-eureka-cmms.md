# Product Requirements Document: Eureka CMMS

## Introduction/Overview

Eureka CMMS (Computerized Maintenance Management System) is a comprehensive, multi-tenant SaaS platform designed to revolutionize maintenance management across multiple factories, warehouses, and facilities. As part of the Eureka Platform ecosystem, it provides end-to-end solutions for work order management, preventive and predictive maintenance, asset lifecycle management, inventory control, and enterprise-wide operational visibility.

The system addresses the critical challenges faced by industrial operations: unplanned downtime, inefficient maintenance workflows, poor spare parts management, lack of real-time visibility, and difficulty coordinating across multiple sites. By providing mobile-first workflows, offline capabilities, and intelligent automation, Eureka CMMS empowers maintenance teams to work more efficiently and organizations to optimize their Total Cost of Ownership (TCO).

**Problem Statement**: Organizations with multiple sites struggle with fragmented maintenance processes, lack of standardization, poor visibility into asset health, inefficient technician deployment, and inability to leverage economies of scale in spare parts procurement.

**Solution**: A unified, cloud-based CMMS platform that supports multi-tenant, multi-site operations with role-based access control, mobile-first workflows, offline capabilities, and enterprise-level analytics and coordination.

## Goals

### Business Goals

1. **Reduce Unplanned Downtime**: Decrease equipment downtime by 30% through proactive maintenance and faster response times
2. **Improve Maintenance Efficiency**: Increase technician productivity by 25% through mobile workflows and optimized scheduling
3. **Optimize Inventory Costs**: Reduce spare parts inventory carrying costs by 20% through better demand forecasting and cross-site optimization
4. **Enable Scalability**: Support 50+ tenants with 200+ sites within 18 months of launch
5. **Enhance Compliance**: Achieve 100% audit trail coverage for safety and regulatory compliance

### Technical Goals

1. Deliver a scalable, multi-tenant architecture supporting thousands of concurrent users
2. Achieve 99.9% platform uptime with robust disaster recovery
3. Provide seamless offline-to-online synchronization for mobile workers
4. Enable real-time data integration with IoT, SCADA, MES, and ERP systems
5. Support responsive web and native mobile experiences

### User Experience Goals

1. Enable technicians to complete work orders 50% faster using mobile workflows
2. Provide supervisors with real-time visibility into maintenance operations
3. Empower enterprise operations centers to coordinate across multiple sites
4. Deliver intuitive, role-specific interfaces requiring minimal training

## User Roles

The system supports the following user roles with distinct permissions:

1. **Super Admin** - Platform-wide administration, tenant onboarding, license allocation
2. **Tenant Admin & Master Data Manager** - Tenant management, site creation, master data management
3. **Tenant Configuration Manager** - System configuration, workflows, integrations
4. **Site Manager** - Site operations, work order management, supervision, master data
5. **Site Store Manager** - Inventory management, stock transactions
6. **Technician** - Field maintenance execution, mobile app usage
7. **Tenant Enterprise Operations Center (EOC)** - Multi-site monitoring and emergency coordination
8. **Tenant Spare Part Center** - Cross-site inventory optimization and procurement

## User Stories

### Tenant & Site Management

**As a Super Admin**, I want to:

- Onboard new tenants with their organizational structure and initial configuration
- Allocate and manage license pools for each tenant
- Monitor platform-wide usage and performance metrics
- Manage system-wide configurations and feature flags
- Deactivate or suspend tenants when needed
- View audit logs across all tenants

**As a Tenant Admin & Master Data Manager**, I want to:

- Create and manage multiple sites (factories/warehouses) within my organization
- Assign Site Managers and allocate licenses to each site
- View consolidated reports and KPIs across all my sites
- Manage tenant-level master data (spare parts catalog, supplier directory, part classifications)
- Control user access and reset passwords when needed
- Define organizational policies and approval workflows
- Configure tenant-wide settings and branding
- Manage tenant-level BOMs and standard procedures
- Approve or reject master data changes from sites

**As a Tenant Configuration Manager**, I want to:

- Configure workflow stages and status transitions for work orders
- Define custom fields and attributes for assets, work orders, and inventory
- Set up approval workflows and escalation rules
- Configure notification templates and alert rules
- Manage integration settings (SAP, IoT, Keycloak)
- Define KPI thresholds and performance targets
- Configure data retention and archival policies
- Set up automated report schedules

**As a Site Manager**, I want to:

- Manage users within my site and assign appropriate roles
- Allocate licenses to active users from my site's license pool
- Maintain site-specific master data (assets, functional locations, equipment hierarchy)
- Configure site-specific workflows and approval processes
- Monitor site performance and compliance metrics
- Create work orders directly or from work notifications
- Assign work orders to technicians based on skills, availability, and location
- Set priorities using asset criticality and production impact
- Track work order progress in real-time on a Kanban board
- Approve work completion and review labor/material costs
- Manage work order backlog by priority and type
- Schedule preventive maintenance tasks using drag-and-drop calendar interface
- Define shift schedules (start/end times, rotation cycles)
- Manage company holidays and non-working days
- Maintain technician profiles with skills, certifications, and proficiency levels
- Track technician availability (leave, training, assignments)
- View workload distribution across technicians and teams
- Identify staffing gaps by comparing demand vs. availability
- Assign work to in-house technicians or external contractors
- Receive alerts when stock reaches reorder points (ROP)
- View parts catalog with images, specifications, and supplier information
- Link spare parts to equipment BOMs
- Receive suggestions to update BOMs when parts are used but not listed
- Track part usage history for demand forecasting

### Work Request & Notification

**As a Non-Maintenance Employee**, I want to:

- Quickly report maintenance issues by scanning QR codes on equipment or locations
- Submit work notifications through a simple mobile-friendly portal
- Attach photos and descriptions to clearly communicate the problem
- Track the status of my requests and receive updates when work is completed
- Receive notifications when my request is converted to a work order

**As a Call Center Operator**, I want to:

- Create work notifications on behalf of callers via API integration
- Link notifications to specific assets or locations
- Set priority levels based on caller urgency
- Track notification-to-resolution time

### Work Order Management

**As a Site Manager**, I want to:

- View work orders on a Kanban board with drag-and-drop status updates
- Filter and search work orders by multiple criteria
- Create custom board views (My Board, Team Board, Asset Board)
- Perform bulk actions on multiple work orders
- Export work order data to Excel/PDF
- View work order analytics and backlog metrics

**As a Technician**, I want to:

- View my assigned work orders on my mobile device
- Access detailed work instructions, checklists, and reference documents
- Clock in/out for each work order to track actual labor time
- Record failure codes, root causes, and corrective actions
- Request and reserve spare parts from inventory
- Attach photos and videos documenting work performed
- Communicate with Site Managers and other team members via in-app chat
- Update work order status (Started, In Progress, Waiting for Parts, Completed)
- Work offline in areas without connectivity and sync when back online
- Scan QR codes to quickly access asset information and create work orders
- View my shift schedule and assigned work orders
- Register as a mobile app user using my employee credentials

**As a Tenant Enterprise Operations Center (EOC)**, I want to:

- Monitor work orders across all sites in real-time
- Identify critical situations (fires, major breakdowns) requiring coordination
- Dispatch technicians across sites for emergency situations
- Coordinate with external agencies (fire department, ambulance, police)
- Track technician locations and availability across the enterprise
- Escalate issues to supply chain and logistics teams
- View multi-site dashboard with critical events
- Allocate resources across sites for emergencies
- Communicate with site teams through emergency channels

### Preventive & Predictive Maintenance

**As a Site Manager**, I want to:

- Schedule PM tasks based on time intervals (daily, weekly, monthly)
- Trigger PM based on meter readings exceeding thresholds (hours, cycles, temperature)
- Create route-based maintenance plans for daily inspection rounds
- Build reusable job plans with standard procedures and checklists
- Assign PM schedules to specific technicians or teams
- View PM compliance rates and upcoming scheduled tasks
- Use drag-and-drop PM calendar for scheduling

**As a Technician on Route-Based Maintenance**, I want to:

- Download my inspection route to my mobile device for offline use
- Navigate the route with a checklist of checkpoints
- Scan QR codes at each checkpoint to confirm arrival
- Complete inspection checklists, capture photos, and record meter readings
- Report defects or abnormalities discovered during inspection
- Submit completed route inspections with all data synchronized

**As a Reliability Engineer**, I want to:

- Configure predictive maintenance triggers based on IoT sensor data
- Integrate with SCADA/PLC systems to automatically create work orders when anomalies are detected
- Analyze failure patterns using MTBF/MTTR metrics
- Conduct root cause analysis (RCA) with structured failure coding
- Implement RCM (Reliability-Centered Maintenance) strategies

### Asset Management

**As a Site Manager**, I want to:

- Create and maintain asset hierarchies (functional locations and equipment)
- Define asset classifications and criticality rankings using RCM or FMEA
- Attach technical specifications, manuals, and drawings to assets
- Link assets to their Bill of Materials (BOM) for spare parts
- Track asset warranty information and set expiration alerts
- Record asset acquisition costs and calculate Total Cost of Ownership (TCO)
- View asset performance dashboards and downtime reports

**As a Technician**, I want to:

- Scan asset QR codes to instantly access asset history and specifications
- Log asset downtime with detailed failure codes and duration
- Record meter readings manually or by photographing analog meters
- View asset maintenance history before starting work
- Update asset condition and operational status

**As a Facility Manager**, I want to:

- Manage building systems (HVAC, lighting, security) alongside production equipment
- Integrate with Building Management Systems (BMS) and IoT platforms
- Track location-based maintenance for facilities
- Monitor asset performance across functional locations

### Inventory & Spare Parts Management

**As a Site Store Manager**, I want to:

- Manage multi-warehouse inventory with bin location tracking
- Process spare part requisitions from work orders
- Conduct cycle counts and stock audits using mobile barcode scanning
- Track parts reserved for specific work orders
- Manage part returns and repairs
- Record parts issued and returned to stock
- Maintain accurate stock levels across multiple storage locations
- Receive and process goods receipts
- Perform stock adjustments and transfers
- Generate inventory reports and metrics

**As a Site Manager**, I want to:

- Receive alerts when stock reaches reorder points (ROP)
- View parts catalog with images, specifications, and supplier information
- Link spare parts to equipment BOMs
- Receive suggestions to update BOMs when parts are used but not listed
- Track part usage history for demand forecasting
- Create purchase requests for needed parts
- Approve inventory transactions and adjustments

**As a Tenant Spare Part Center**, I want to:

- Consolidate spare parts demand across all sites
- Plan bulk purchases to improve supplier negotiation power
- Optimize stock distribution across sites based on usage patterns
- Identify slow-moving inventory and recommend transfers between sites
- Create purchase requests and track purchase orders
- Manage supplier performance metrics (lead time, quality, reliability)
- View cross-site inventory aggregation
- Forecast demand based on PM schedules and historical usage
- Negotiate contracts with suppliers at tenant level
- Recommend stock optimization strategies

**As a Technician**, I want to:

- Search parts catalog by part number, description, or equipment
- Reserve parts for my work orders
- Scan barcodes/QR codes/RFID tags for quick part identification
- Record parts usage in work orders using mobile app
- Return unused parts to inventory
- View parts availability before starting work

### Safety & Compliance

**As a Safety Officer**, I want to:

- Manage work permits and attach them to work orders
- Enforce Lockout/Tagout (LOTO) procedures with digital checklists
- Track safety inspection compliance
- Maintain audit trails for all safety-critical activities
- Generate compliance reports for regulatory audits (ISO, FDA, OSHA)
- Investigate safety incidents and near-misses
- Track corrective actions and preventive measures

**As a Technician**, I want to:

- Complete safety checklists before starting hazardous work
- Attach work permit documentation to work orders
- Follow LOTO procedures with step-by-step guidance
- Report safety incidents or near-misses
- View safety requirements for each work order

### Analytics & Reporting

**As a Tenant Admin & Master Data Manager**, I want to:

- View enterprise-wide dashboards showing OEE, PM compliance, work order backlog
- Analyze MTBF and MTTR trends across sites
- Compare site performance metrics
- Export data to Power BI, Tableau, or Superset for custom analysis
- Track Six Big Losses for OEE improvement
- Generate executive summary reports
- Monitor tenant-wide KPIs

**As a Site Manager**, I want to:

- Monitor daily KPIs: work order completion rate, backlog, downtime
- View asset criticality and failure analysis reports
- Track labor efficiency (planned vs. actual hours)
- Generate cost reports by asset, department, or cost center
- Analyze spare parts consumption and inventory turnover
- Create custom reports with filters and grouping
- Schedule automated report delivery

## Technology Stack

### Backend

- **Language**: TypeScript
- **Framework**: ElysiaJS (Bun runtime)
- **Database**: PostgreSQL 15+ (relational), InfluxDB 2.x (time-series)
- **Caching**: Redis 7+
- **Message Queue**: RabbitMQ or Apache Kafka
- **Object Storage**: MinIO or AWS S3
- **Authentication**: PASETO/JWT (Phase 1), Keycloak (Phase 2)

### Frontend

- **Framework**: SvelteKit
- **Styling**: UnoCSS
- **State Management**: Svelte stores, TanStack Query for server state
- **Forms**: Superforms or Formsnap
- **Charts**: Chart.js or Apache ECharts
- **Maps**: Leaflet or Mapbox GL JS
- **Icons**: Lucide Icons or Heroicons
- **PWA**: Vite PWA plugin

### Mobile (Phase 2)

- **Framework**: Flutter
- **State Management**: Riverpod or Bloc
- **Local Database**: Drift (SQLite)
- **Platforms**: Android, iOS, HarmonyOS

### DevOps & Infrastructure

- **Containerization**: Docker
- **Orchestration**: Kubernetes or Docker Swarm
- **CI/CD**: GitHub Actions, GitLab CI, or Jenkins
- **Monitoring**: Prometheus, Grafana, ELK Stack
- **Cloud**: AWS, Azure, GCP (or on-premise)

## Design System

### Design Philosophy

The Eureka CMMS interface MUST embody a **modern, consumer-grade experience** inspired by Limble CMMS, prioritizing:

- **Simplicity over complexity**: Reduce cognitive load with clean, uncluttered interfaces
- **Mobile-first thinking**: Design for touch and small screens first, then scale up
- **Instant feedback**: Provide immediate visual responses to all user actions
- **Data visualization**: Transform raw data into clear, actionable insights
- **Contextual intelligence**: Show the right information at the right time

### Color Palette (Modern & Professional)

**Primary Colors:**

- Primary Blue: `#2563EB` (for primary actions, links, active states)
- Primary Blue Dark: `#1E40AF` (hover states)
- Primary Blue Light: `#DBEAFE` (backgrounds, badges)

**Semantic Colors:**

- Success Green: `#10B981` (completed, success states)
- Warning Orange: `#F59E0B` (warnings, medium priority)
- Error Red: `#EF4444` (errors, emergency priority)
- Info Cyan: `#06B6D4` (informational messages)

**Neutral Colors (Modern Gray Scale):**

- Gray 950: `#0A0A0A` (primary text)
- Gray 800: `#1F2937` (secondary text)
- Gray 600: `#4B5563` (tertiary text, icons)
- Gray 400: `#9CA3AF` (disabled text, placeholders)
- Gray 200: `#E5E7EB` (borders, dividers)
- Gray 100: `#F3F4F6` (backgrounds, hover states)
- Gray 50: `#F9FAFB` (page backgrounds)
- White: `#FFFFFF` (cards, modals)

**Priority Indicators:**

- Emergency: `#DC2626` (red, pulsing animation)
- High: `#F97316` (orange)
- Medium: `#FBBF24` (yellow)
- Low: `#94A3B8` (gray)

### Typography

**Fonts:**

- Primary Font: Inter or Outfit (Google Fonts)
- Monospace: JetBrains Mono (for IDs, codes)

**Font Sizes:**

- Display: 2.5rem / 40px (page titles)
- H1: 2rem / 32px (section headers)
- H2: 1.5rem / 24px (card titles)
- H3: 1.25rem / 20px (subsections)
- Body: 1rem / 16px (default text)
- Small: 0.875rem / 14px (labels, captions)
- Tiny: 0.75rem / 12px (badges, timestamps)

**Font Weights:**

- Regular: 400 (body text)
- Medium: 500 (labels, buttons)
- Semibold: 600 (headings, emphasis)
- Bold: 700 (important headings)

### Spacing System

Use consistent spacing scale (based on 4px):

- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px

### Component Design Principles

**1. Cards & Containers**

- Elevated cards with subtle shadows: `box-shadow: 0 1px 3px rgba(0,0,0,0.1)`
- Rounded corners: `border-radius: 8px` (cards), `12px` (modals)
- White backgrounds with subtle borders
- Generous padding: 16-24px

**2. Buttons**

- Primary: Solid blue background, white text, subtle shadow
- Secondary: White background, blue border and text
- Ghost: Transparent background, blue text, hover background
- Danger: Red background for destructive actions
- Height: 40px (default), 36px (small), 48px (large)
- Rounded corners: 6px
- Hover states: Darken by 10%, add shadow
- Active states: Scale down slightly (0.98)

**3. Form Inputs**

- Height: 40px
- Border: 1px solid gray-300, focus: 2px solid primary blue
- Rounded corners: 6px
- Placeholder text: gray-400
- Labels: Above inputs, semibold, gray-700
- Helper text: Below inputs, small, gray-600
- Error states: Red border, red helper text

**4. Icons**

- Use Lucide Icons or Heroicons (outline style)
- Size: 20px (default), 16px (small), 24px (large)
- Color: Inherit from parent or gray-600
- Consistent stroke width: 2px

**5. Badges & Tags**

- Pill-shaped: `border-radius: 9999px`
- Padding: 4px 12px
- Font size: 12px, font weight: 500
- Color-coded by type (priority, status, category)
- Subtle background colors with darker text

## Navigation Structure

### Top Navigation Bar

The top navigation bar MUST be fixed at the top of the screen and include:

1. **Logo & Tenant Selector** (Left)

   - Company logo (clickable, returns to dashboard)
   - Tenant name display (for multi-tenant users)
   - Tenant switcher dropdown (if user has access to multiple tenants)

2. **Global Search** (Center-Left)

   - Search bar with keyboard shortcut (Cmd/Ctrl + K)
   - Search across: Work Orders, Assets, Parts, Locations, Documents
   - Recent searches dropdown
   - Quick filters (by type)
   - Search results with type indicators and quick preview

3. **Quick Actions** (Center-Right)

   - **Create New** button with dropdown:
     - New Work Order
     - New Work Notification
     - New Asset
     - New PM Schedule
     - Quick Issue Parts

4. **Notifications** (Right)

   - Bell icon with unread count badge
   - Dropdown panel showing:
     - Work order assignments
     - Status updates
     - Overdue tasks
     - System alerts
     - Mark all as read option
     - View all notifications link

5. **User Menu** (Far Right)
   - User avatar with online status indicator
   - Dropdown menu:
     - User profile
     - My work orders
     - My schedule
     - Settings & preferences
     - Language selector
     - Theme toggle (light/dark)
     - Help & documentation
     - Logout

### Sidebar Navigation

The sidebar MUST be collapsible and include the following menu items with role-based visibility:

#### 1. 🏠 Dashboard

**Purpose**: Overview of key metrics and recent activity  
**Visible to**: All roles  
**Features**: KPI widgets, recent work orders, alerts, quick actions, performance charts

#### 2. 📋 Work Orders

**Purpose**: Manage all work order activities  
**Visible to**: All roles (content filtered by permissions)  
**Sub-menu**:

- Board View (Kanban board - default view)
- List View (Table format with filters)
- Calendar View (Work orders by due date)
- My Work Orders (Assigned to current user)
- Unassigned (Work orders needing assignment)
- Overdue (Past due date)
- Completed (Closed work orders)
- Create Work Order (Quick create form)

#### 3. 📢 Work Notifications

**Purpose**: Manage maintenance requests from non-technical staff  
**Visible to**: Site Managers, Technicians  
**Sub-menu**:

- Open Notifications (Pending review)
- In Progress (Being converted to WO)
- Converted (Linked to work orders)
- Closed (Resolved without WO)
- All Notifications (Complete list)

#### 4. 🏭 Assets

**Purpose**: Manage asset hierarchy, equipment, and functional locations  
**Visible to**: All roles (edit permissions vary)  
**Sub-menu**:

- Asset Hierarchy (Tree view of locations and equipment)
- Equipment List (All equipment with filters)
- Functional Locations (Location structure)
- Asset Register (Complete asset database)
- Critical Assets (High-priority equipment)
- Downtime Tracking (Asset availability)
- Meter Readings (Equipment meters)
- Warranties (Warranty tracking)
- Asset Map (GIS view - if enabled)

#### 5. 📦 Inventory

**Purpose**: Manage spare parts, stock levels, and procurement  
**Visible to**: Store Managers, Technicians (view), Site Managers  
**Sub-menu**:

- Parts Catalog (All spare parts)
- Stock Levels (Current inventory)
- Reorder Alerts (Low stock warnings)
- Transactions (Issue/receive history)
- Reservations (Parts reserved for WOs)
- Cycle Counts (Inventory audits)
- Purchase Requests (PR management)
- Suppliers (Supplier directory)
- Stock Transfers (Between warehouses)

#### 6. 🔧 Preventive Maintenance

**Purpose**: Schedule and manage preventive maintenance programs  
**Visible to**: Site Managers  
**Sub-menu**:

- PM Calendar (Visual schedule with drag-and-drop)
- PM Schedules (All PM plans)
- Route Plans (Inspection routes)
- Job Plans (Standard procedures)
- Checklists (Digital forms)
- Compliance Report (PM completion rates)
- Templates (Reusable PM templates)

#### 7. 👥 Workforce

**Purpose**: Manage technicians, shifts, and scheduling  
**Visible to**: Site Managers  
**Sub-menu**:

- Technicians (Employee directory)
- Skills Matrix (Skills and certifications)
- Shift Schedules (Calendar view)
- Workload Planning (Capacity planning)
- Time Tracking (Labor hours)
- Contractors (External workforce)
- Availability (Leave and absences)

#### 8. 📊 Reports & Analytics

**Purpose**: Generate insights and performance reports  
**Visible to**: All roles (reports filtered by permissions)  
**Sub-menu**:

- Dashboards (Pre-built KPI dashboards)
  - OEE Dashboard
  - MTBF/MTTR Dashboard
  - Cost Analysis
  - PM Compliance
  - Inventory Turnover
- Custom Reports (Report builder)
- Scheduled Reports (Automated delivery)
- Export Data (CSV, Excel, PDF)
- BI Integration (Power BI, Tableau links)

#### 9. 🏢 Enterprise Operations Center (EOC)

**Purpose**: Multi-site monitoring and emergency coordination  
**Visible to**: EOC Operators, Tenant Admins  
**Sub-menu**:

- Multi-Site Dashboard (All sites overview)
- Critical Events (Emergency alerts)
- Resource Allocation (Cross-site technicians)
- Live Map (Site and technician locations)
- Communication Hub (Emergency coordination)

#### 10. 🏪 Spare Part Center (Tenant-Level)

**Purpose**: Centralized procurement and inventory optimization  
**Visible to**: Spare Part Center Managers, Tenant Admins  
**Sub-menu**:

- Cross-Site Inventory (Aggregated view)
- Bulk Purchasing (Consolidated orders)
- Stock Optimization (Transfer recommendations)
- Slow-Moving Items (Obsolete inventory)
- Demand Forecasting (Predictive ordering)
- Supplier Negotiations (Contract management)

#### 11. 🔒 Safety & Compliance

**Purpose**: Manage work permits, LOTO, and safety procedures  
**Visible to**: Safety Officers, Site Managers, Technicians  
**Sub-menu**:

- Work Permits (Permit management)
- LOTO Procedures (Lockout/tagout)
- Safety Checklists (Inspection forms)
- Incident Reports (Safety incidents)
- Audit Trail (Compliance logs)
- Compliance Reports (Regulatory reporting)

#### 12. ⚙️ Settings

**Purpose**: System configuration and administration  
**Visible to**: Role-based (different settings for different roles)

**For Super Admins**:

- Tenant Management (Add/edit tenants)
- License Management (Allocate licenses)
- System Configuration (Platform settings)

**For Tenant Admins**:

- Site Management (Add/edit sites)
- User Management (Manage users)
- Role Configuration (Permissions)
- Workflow Settings (Status workflows)
- Master Data (Tenant-level data)
- Integrations (SAP, IoT, Keycloak)
- Branding (Logo, colors)

**For Site Managers**:

- Site Configuration (Site settings)
- User Management (Site users)
- Master Data (Site-level data)
- Custom Fields (Additional attributes)

**For All Users**:

- My Profile (Personal information)
- Preferences (Language, theme, notifications)
- Password Change
- Two-Factor Authentication

#### 13. ❓ Help & Support

**Purpose**: Access documentation and support  
**Visible to**: All roles  
**Sub-menu**:

- User Guide (Documentation)
- Video Tutorials (Training videos)
- FAQs (Common questions)
- Contact Support (Support ticket)
- What's New (Release notes)
- Keyboard Shortcuts (Shortcut reference)

### Navigation Behavior

- **Collapsible Sidebar**: Click hamburger icon to collapse to icon-only view
- **Active State**: Highlight current page with background color and bold text
- **Badge Indicators**: Show counts for notifications, pending approvals, overdue items
- **Keyboard Shortcuts**:
  - `Cmd/Ctrl + K`: Global search
  - `Cmd/Ctrl + B`: Toggle sidebar
  - `G + D`: Go to Dashboard
  - `G + W`: Go to Work Orders
  - `G + A`: Go to Assets
  - `G + I`: Go to Inventory
- **Mobile Behavior**: Sidebar becomes slide-out drawer from left
- **Breadcrumb Navigation**: Show current location path below top nav
- **Contextual Actions**: Page-specific quick actions in page header

## Work Order Kanban Board

### Board Layout (Kanban-Style)

The Work Order management interface MUST provide a Kanban board view similar to GitLab Issue Board with the following characteristics:

- **Multi-Column Layout**: Horizontal columns representing work order statuses (e.g., Open, Assigned, In Progress, On Hold, Completed, Closed)
- **Drag-and-Drop**: Users MUST be able to drag work order cards between columns to update status
- **Collapsible Columns**: Each column MUST be collapsible to maximize screen space
- **Column Customization**: Administrators MUST be able to configure column names and workflow stages
- **Column Counters**: Each column header MUST display the count of work orders in that status
- **Swimlanes** (Optional): Support for horizontal swimlanes by priority, asset, technician, or site

### Work Order Cards

Each work order card MUST display:

- Work order ID (e.g., WO-12345) with clickable link
- Title/description (truncated with ellipsis)
- Priority indicator (color-coded badge: red=Emergency, orange=High, yellow=Medium, gray=Low)
- Asset/equipment name or functional location
- Assigned technician avatar and name
- Due date (with overdue highlighting in red)
- Age indicator (days since creation)
- Quick action icons (edit, comment, attach)
- Labels/tags (e.g., PM, Breakdown, Safety)
- Attachment indicator (paperclip icon with count)
- Comment count indicator

### Card Interactions

- Click card to open work order detail modal or side panel
- Hover to show quick preview with additional details
- Right-click for context menu (assign, change priority, add label, etc.)
- Bulk selection with checkboxes for multi-card actions

### Filtering & Search

The board MUST support:

- **Quick Filters**: Buttons for common filters (My Work Orders, Overdue, High Priority, Unassigned)
- **Advanced Filters**: Filter by multiple criteria:
  - Status, Priority, Work Type
  - Assigned Technician, Team
  - Asset, Functional Location, Site
  - Date Range (created, due, completed)
  - Tags/Labels
  - Custom fields
- **Search Bar**: Full-text search across work order ID, title, description, asset name
- **Saved Filters**: Users MUST be able to save and name filter combinations
- **Filter Persistence**: Selected filters MUST persist across sessions

### Board Views

The system MUST support multiple board views:

- **My Board**: Shows only work orders assigned to the current user
- **Team Board**: Shows work orders for the user's team
- **Site Board**: Shows all work orders for a specific site
- **Asset Board**: Shows work orders for a specific asset or asset group
- **Custom Boards**: Users can create and save custom board configurations

### Real-Time Updates

- Work order cards MUST update in real-time when changes occur (via WebSocket or polling)
- Show visual indicator when another user is viewing/editing a work order
- Display toast notifications for new assignments or status changes
- Highlight recently updated cards with subtle animation

### Responsive Behavior

- **Desktop**: Full multi-column horizontal layout
- **Tablet**: Scrollable horizontal columns with touch-friendly drag-and-drop
- **Mobile**: Vertical stacked list view with swipe gestures to change status, or single-column view with status dropdown

## Mobile PWA Features

### Offline Functionality

The following features MUST work offline:

**Work Order Management**:

- Download assigned work orders with all details
- Update work order status and progress
- Record labor time (clock in/out)
- Capture photos and videos
- Add chat messages (queued for sync)
- Record failure codes and corrective actions
- Create new work orders or work notifications

**Asset Access**:

- View asset details and history for assigned work orders
- Scan QR codes to access asset information
- Access technical documents and manuals (pre-downloaded)

**Checklists & Forms**:

- Complete digital checklists
- Record meter readings
- Fill safety forms and LOTO procedures

**Inventory**:

- Record spare parts usage (pending inventory deduction)
- View parts catalog (pre-downloaded)

**Route-Based Maintenance**:

- Download inspection routes
- Check in at route checkpoints via QR code scan
- Complete route tasks (photos, checklists, meter readings, defect reporting)

### Data Synchronization

- **Pre-Synchronization**: When online, the app MUST download relevant data to local storage
- **Offline Operation**: All offline actions MUST be stored in a local queue with accurate timestamps
- **Post-Synchronization**: When connectivity is restored, the app MUST automatically upload queued data
- **Conflict Resolution**: The system MUST detect and resolve conflicts using last-write-wins or user notification
- **Integrity Check**: Server MUST validate synchronized data and update central database

### Location Services

The mobile app MUST capture location data when recording transactions:

- GPS coordinates (when available)
- Bluetooth/BLE beacon signals
- Cellular tower information

Location data MUST be used for:

- Verifying technician presence at work sites
- Indoor positioning (future phase with AI model)
- Technician tracking for emergency dispatch

## Success Metrics

### Business Metrics

1. **Tenant Adoption**: Onboard 20 tenants with 100+ sites within 12 months
2. **User Engagement**: 80% of licensed users active monthly
3. **Downtime Reduction**: Reduce unplanned downtime by 30% for pilot customers
4. **Maintenance Efficiency**: Increase work order completion rate by 25%
5. **Inventory Optimization**: Reduce inventory carrying costs by 20% through cross-site optimization
6. **Customer Satisfaction**: Net Promoter Score (NPS) > 50

### Technical Metrics

1. **System Uptime**: 99.9% availability (< 8.76 hours downtime per year)
2. **Performance**: 95th percentile API response time < 200ms
3. **Mobile Performance**: Page load time < 2 seconds on 3G
4. **Offline Sync Success**: > 99% successful synchronization after offline work
5. **Data Accuracy**: < 1% data conflicts during synchronization
6. **Scalability**: Support 10,000 concurrent users without degradation

### User Experience Metrics

1. **Task Completion Time**: Reduce work order creation time by 50% vs. manual processes
2. **Mobile Adoption**: 70% of technicians use mobile app daily
3. **Training Time**: New users productive within 2 hours of training
4. **Error Rate**: < 5% user-reported errors per 1000 transactions
5. **Offline Usage**: 30% of mobile transactions occur offline

### Operational Metrics

1. **PM Compliance**: > 95% preventive maintenance tasks completed on time
2. **Work Order Backlog**: Reduce backlog aging by 40%
3. **MTTR Improvement**: Reduce mean time to repair by 20%
4. **MTBF Improvement**: Increase mean time between failures by 15%
5. **OEE Improvement**: Increase overall equipment effectiveness by 10%

## Implementation Phases

### Phase 1: Foundation (Months 1-6)

- Multi-tenant architecture
- Authentication & authorization
- Tenant & site management
- Work notifications
- Work orders with Kanban board
- Basic asset management
- Basic inventory management
- Mobile PWA with offline support

### Phase 2: Advanced Features (Months 7-12)

- Preventive maintenance scheduling
- Route-based maintenance
- Advanced analytics & reporting
- Workforce management
- Safety & compliance
- SAP integration
- IoT/SCADA integration
- Native Flutter mobile app

### Phase 3: Intelligence & Optimization (Months 13-18)

- Predictive maintenance
- Indoor positioning with AI
- Advanced demand forecasting
- Customer site management features
- Machine learning-based recommendations
- Advanced BI integration

## Non-Goals (Out of Scope)

The following are explicitly **NOT** included in the initial release:

1. **Native Mobile Applications**: No native iOS/Android/HarmonyOS apps in Phase 1 (PWA only)
2. **Advanced AI/ML Features**:
   - Indoor positioning using AI models (Phase 2)
   - OCR for meter reading from photos (Phase 2)
   - Predictive failure modeling (Phase 2)
3. **Customer Site Management**: Features specific to external customer sites (Phase 2)
4. **Advanced Analytics**: Weibull analysis, ML-based forecasting (Phase 2)
5. **Financial Management**: Full accounting, invoicing, billing (rely on ERP integration)
6. **Project Management**: Capital project tracking, project budgeting (separate module)
7. **Energy Management**: Detailed energy consumption tracking (separate module)
8. **Fleet Management**: Vehicle maintenance and GPS tracking (separate module)

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-26  
**Status**: Active