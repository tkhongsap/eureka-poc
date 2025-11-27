-- Migration: 005_create_work_orders_table.sql
-- Description: Create the work_orders table for work order management
-- Created: 2024-11-27
-- Author: Eureka CMMS Team

-- ============================================================================
-- WORK ORDERS TABLE
-- Core table for managing maintenance work orders across all tenants and sites.
-- Supports the full work order lifecycle: Open → In Progress → Pending → 
-- Completed → Closed, with role-based permissions and workflow rules.
-- ============================================================================

-- Create enum types for constrained fields
CREATE TYPE work_order_status AS ENUM ('open', 'in_progress', 'pending', 'completed', 'closed', 'canceled');
CREATE TYPE work_order_priority AS ENUM ('emergency', 'high', 'medium', 'low');
CREATE TYPE work_order_type AS ENUM ('breakdown', 'preventive_maintenance', 'corrective', 'inspection', 'safety', 'other');

-- Create the work_orders table
CREATE TABLE work_orders (
    -- ========================================================================
    -- CORE IDENTIFICATION
    -- ========================================================================
    
    -- Unique identifier for the work order. Used as foreign key reference in
    -- related tables (work_order_parts, work_order_attachments, etc.)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to the parent tenant. All work orders belong to a tenant for
    -- multi-tenant data isolation. Queries filter by tenant_id for security
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Foreign key to the site where work is performed. All work orders belong
    -- to a specific site. PRD: "Each site operates independently with its own
    -- assets, work orders, and inventory"
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    
    -- Human-readable work order code (e.g., WO-00001). Auto-generated on creation.
    -- Used in UI, reports, QR codes, and support communications. Must be unique
    -- within a tenant (same code can exist in different tenants)
    code VARCHAR(20) NOT NULL,

    -- ========================================================================
    -- WORK DETAILS
    -- ========================================================================
    
    -- Brief title summarizing the work to be performed. Displayed in Kanban
    -- board cards, work order lists, and notifications. PRD: "Work order ID
    -- (e.g., WO-12345) with clickable link" and "Title/description (truncated
    -- with ellipsis)" in Kanban cards
    title VARCHAR(255) NOT NULL,
    
    -- Detailed description of the work required, problem statement, or
    -- maintenance task. Supports multi-line text for comprehensive documentation.
    -- Technicians reference this when performing work
    description TEXT,
    
    -- Type of work order determines workflow and reporting categorization.
    -- breakdown: Unplanned equipment failure requiring immediate attention
    -- preventive_maintenance: Scheduled maintenance based on time or meter readings
    -- corrective: Planned repair or improvement work
    -- inspection: Routine inspection or route-based maintenance
    -- safety: Safety-related work (LOTO, permits, compliance)
    -- other: Custom work types
    work_type work_order_type NOT NULL DEFAULT 'breakdown',
    
    -- Priority level determines urgency and resource allocation. Used for
    -- Kanban board sorting and EOC emergency coordination. PRD: "Priority
    -- indicator (color-coded badge: red=Emergency, orange=High, yellow=Medium,
    -- gray=Low)" in work order cards
    priority work_order_priority NOT NULL DEFAULT 'medium',
    
    -- Current status in the workflow lifecycle. Maps to workflow-implementation.md
    -- status definitions: Open, In Progress, Pending, Completed, Closed, Canceled.
    -- Used for Kanban board columns and status-based filtering
    status work_order_status NOT NULL DEFAULT 'open',

    -- ========================================================================
    -- ASSET REFERENCE
    -- ========================================================================
    
    -- Foreign key to assets table. Links work order to specific equipment or
    -- functional location. NULL for location-based work without specific asset.
    -- Note: FK constraint will be added in future migration when assets table exists
    asset_id UUID,
    
    -- Foreign key to functional_locations table. Links work order to location
    -- in asset hierarchy. NULL if work is asset-specific only.
    -- Note: FK constraint will be added in future migration when functional_locations table exists
    functional_location_id UUID,
    
    -- Denormalized asset name for display in Kanban cards and reports without
    -- joining assets table. Updated when asset_id changes. PRD: "Asset/equipment
    -- name or functional location" in work order cards
    asset_name VARCHAR(255),
    
    -- Human-readable location description (e.g., "Building A, Floor 2, Room 205").
    -- Used when functional_location_id is not available or for quick reference.
    -- PRD: "Location" field in work order cards
    location VARCHAR(255),

    -- ========================================================================
    -- ASSIGNMENT
    -- ========================================================================
    
    -- Foreign key to users table. Technician assigned to perform the work.
    -- NULL when work order is Open (unassigned). PRD: "Assigned technician
    -- avatar and name" in work order cards. Workflow: Admin assigns technician
    -- to move status from Open → In Progress
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Foreign key to users table. Person who reported or created the work order
    -- (Requester). Used for notifications and audit trail. PRD: "Non-Maintenance
    -- Employee" can submit work notifications that become work orders
    reported_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- ========================================================================
    -- SCHEDULING
    -- ========================================================================
    
    -- Target completion date for the work order. Used for overdue detection,
    -- priority calculation, and Kanban board sorting. PRD: "Due date (with
    -- overdue highlighting in red)" in work order cards. NULL for unscheduled work
    due_date DATE,
    
    -- Planned start date and time for scheduled work. Used for PM calendar view
    -- and resource planning. NULL for unscheduled or reactive work
    scheduled_start TIMESTAMPTZ,
    
    -- Planned end date and time for scheduled work. Used for capacity planning
    -- and calendar visualization. NULL for unscheduled work
    scheduled_end TIMESTAMPTZ,
    
    -- Estimated labor hours required to complete the work. Used for resource
    -- planning, workload distribution, and cost estimation. NULL if unknown
    estimated_hours DECIMAL(6, 2),

    -- ========================================================================
    -- ACTUAL WORK TRACKING
    -- ========================================================================
    
    -- Actual start date and time when technician began work. Captured via
    -- mobile app clock-in or manual entry. Used for MTTR (Mean Time To Repair)
    -- calculations and labor time tracking. NULL until work starts
    actual_start TIMESTAMPTZ,
    
    -- Actual end date and time when technician completed work. Captured via
    -- mobile app clock-out or manual entry. Used for actual labor hours
    -- calculation and completion metrics. NULL until work is finished
    actual_end TIMESTAMPTZ,
    
    -- Actual labor hours spent on the work order. Calculated from actual_start
    -- and actual_end, or manually entered. Used for cost calculation and
    -- efficiency analysis. PRD: "Clock in/out for each work order to track
    -- actual labor time"
    actual_hours DECIMAL(6, 2),

    -- ========================================================================
    -- COST TRACKING
    -- ========================================================================
    
    -- Labor cost in tenant currency. Calculated from actual_hours × hourly_rate
    -- or manually entered. Used for TCO (Total Cost of Ownership) analysis and
    -- cost reporting. PRD: "Track labor efficiency (planned vs. actual hours)"
    -- and "Generate cost reports by asset, department, or cost center"
    labor_cost DECIMAL(12, 2) DEFAULT 0,
    
    -- Parts and materials cost in tenant currency. Sum of all parts issued from
    -- inventory for this work order. Updated when parts are issued or returned.
    -- Used for inventory cost tracking and total work order cost
    parts_cost DECIMAL(12, 2) DEFAULT 0,
    
    -- Total cost of the work order (labor_cost + parts_cost + other_costs).
    -- Calculated automatically or manually entered. Used for financial reporting
    -- and asset TCO calculations. PRD: "Approve work completion and review
    -- labor/material costs"
    total_cost DECIMAL(12, 2) DEFAULT 0,

    -- ========================================================================
    -- FAILURE ANALYSIS
    -- ========================================================================
    
    -- Failure code classification (e.g., "BEARING_FAILURE", "ELECTRICAL_SHORT").
    -- Used for reliability analysis, MTBF calculations, and failure pattern
    -- identification. PRD: "Record failure codes, root causes, and corrective
    -- actions" and "Analyze failure patterns using MTBF/MTTR metrics"
    failure_code VARCHAR(100),
    
    -- Root cause analysis description. Detailed explanation of why the failure
    -- occurred. Used for RCA (Root Cause Analysis) and preventive action planning.
    -- PRD: "Conduct root cause analysis (RCA) with structured failure coding"
    root_cause TEXT,
    
    -- Corrective action taken to resolve the issue and prevent recurrence.
    -- Used for knowledge base and future reference. PRD: "Record failure codes,
    -- root causes, and corrective actions"
    corrective_action TEXT,

    -- ========================================================================
    -- WORK NOTES
    -- ========================================================================
    
    -- Notes entered by the assigned technician during or after work completion.
    -- Contains work performed, observations, and completion details. PRD:
    -- "Technician marks job done" - these notes accompany the status change
    -- to Pending. From workflow-implementation.md: Technician can update when
    -- assigned AND status = In Progress
    technician_notes TEXT,
    
    -- Review comments from Admin after technician submits work for approval.
    -- Contains approval/rejection feedback. PRD: "Admin reviews work completion"
    -- - this field stores the review outcome. From workflow-implementation.md:
    -- Admin can approve (Pending → Completed) or reject (Pending → In Progress)
    admin_review TEXT,

    -- ========================================================================
    -- REFERENCES
    -- ========================================================================
    
    -- Foreign key to work_notifications table. Links work order to the original
    -- notification/request that triggered it. NULL for directly created work orders.
    -- PRD: "Create work orders directly or from work notifications" and "Receive
    -- notifications when my request is converted to a work order"
    request_id UUID,
    
    -- Foreign key to work_orders table (self-reference). Links child work order
    -- to parent work order. Used for work order hierarchies (e.g., parent PM
    -- work order spawning multiple child corrective work orders). NULL for
    -- top-level work orders
    parent_work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
    
    -- Foreign key to pm_schedules table. Links work order to the preventive
    -- maintenance schedule that generated it. NULL for non-PM work orders.
    -- PRD: "Schedule PM tasks based on time intervals" and "Trigger PM based
    -- on meter readings exceeding thresholds"
    -- Note: FK constraint will be added in future migration when pm_schedules table exists
    pm_schedule_id UUID,

    -- ========================================================================
    -- METADATA
    -- ========================================================================
    
    -- Array of tags/labels for categorization and filtering (e.g., ["PM", "Breakdown", "Safety"]).
    -- Used for Kanban board filtering and work order grouping. PRD: "Labels/tags
    -- (e.g., PM, Breakdown, Safety)" in work order cards
    tags TEXT[] DEFAULT '{}',
    
    -- Array of image IDs (stored in MinIO/S3) attached during work order creation.
    -- Used for problem documentation and visual reference. PRD: "Attach photos
    -- and descriptions to clearly communicate the problem" and "Attachment
    -- indicator (paperclip icon with count)" in work order cards
    image_ids TEXT[] DEFAULT '{}',
    
    -- Array of image IDs captured by technician during work execution.
    -- Used for work documentation, before/after photos, and compliance evidence.
    -- PRD: "Attach photos and videos documenting work performed" from mobile app
    technician_image_ids TEXT[] DEFAULT '{}',
    
    -- Flexible JSON storage for custom fields and work order-specific settings
    -- without schema changes. Common uses: custom attributes, integration data,
    -- workflow state, notification preferences. PRD: "Define custom fields and
    -- attributes for assets, work orders, and inventory"
    settings JSONB NOT NULL DEFAULT '{}',

    -- ========================================================================
    -- AUDIT TRAIL
    -- ========================================================================
    
    -- Timestamp when work order was created. Never modified after initial
    -- creation. Required for compliance, audit trails, and historical reporting.
    -- Used for "Age indicator (days since creation)" in Kanban cards
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Timestamp of last modification. Auto-updated via database trigger on any
    -- column change. Useful for sync operations, debugging, and real-time
    -- update detection. PRD: "Work order cards MUST update in real-time when
    -- changes occur"
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- User ID who created this work order. NULL for system-generated work orders
    -- (e.g., from PM schedules). Required for SOX compliance and security audits.
    -- From workflow-implementation.md: "Requester creates WO" or "Admin creates WO"
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- User ID who last modified this work order. Tracks all changes for audit
    -- trail. Critical for investigating unauthorized modifications. From PRD:
    -- "Achieve 100% audit trail coverage for safety and regulatory compliance"
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- ========================================================================
    -- CONSTRAINTS
    -- ========================================================================
    
    -- Ensure work order code is unique within a tenant (same code can exist in
    -- different tenants, but not within the same tenant)
    CONSTRAINT uq_work_orders_tenant_code UNIQUE (tenant_id, code),
    
    -- Ensure all cost values are non-negative
    CONSTRAINT chk_labor_cost_positive CHECK (labor_cost >= 0),
    CONSTRAINT chk_parts_cost_positive CHECK (parts_cost >= 0),
    CONSTRAINT chk_total_cost_positive CHECK (total_cost >= 0),
    
    -- Ensure estimated and actual hours are non-negative
    CONSTRAINT chk_estimated_hours_positive CHECK (estimated_hours IS NULL OR estimated_hours >= 0),
    CONSTRAINT chk_actual_hours_positive CHECK (actual_hours IS NULL OR actual_hours >= 0),
    
    -- Ensure scheduled dates are logical (start before end)
    CONSTRAINT chk_scheduled_dates CHECK (
        scheduled_start IS NULL OR 
        scheduled_end IS NULL OR 
        scheduled_start <= scheduled_end
    ),
    
    -- Ensure actual dates are logical (start before end)
    CONSTRAINT chk_actual_dates CHECK (
        actual_start IS NULL OR 
        actual_end IS NULL OR 
        actual_start <= actual_end
    ),
    
    -- Ensure work order cannot be assigned to itself as parent (prevent circular references)
    CONSTRAINT chk_no_self_parent CHECK (parent_work_order_id IS NULL OR parent_work_order_id != id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Most common query: Get all work orders for a tenant. Critical for multi-tenant
-- data isolation and performance. Used in tenant-level dashboards and reporting
CREATE INDEX idx_work_orders_tenant_id ON work_orders(tenant_id);

-- Get all work orders for a specific site. Used for site-level Kanban boards,
-- dashboards, and work order management. PRD: "Site Board: Shows all work orders
-- for a specific site"
CREATE INDEX idx_work_orders_site_id ON work_orders(site_id);

-- Filter work orders by status. Critical for Kanban board column queries.
-- PRD: "Multi-Column Layout: Horizontal columns representing work order statuses"
CREATE INDEX idx_work_orders_status ON work_orders(status);

-- Filter work orders by priority. Used for priority-based filtering and sorting.
-- PRD: "Quick Filters: Buttons for common filters (High Priority)" and priority
-- indicators in Kanban cards
CREATE INDEX idx_work_orders_priority ON work_orders(priority);

-- Get work orders assigned to a specific technician. Used for "My Work Orders"
-- view and technician mobile app. PRD: "My Board: Shows only work orders
-- assigned to the current user"
CREATE INDEX idx_work_orders_assigned_to ON work_orders(assigned_to) WHERE assigned_to IS NOT NULL;

-- Find overdue work orders (due_date < current_date AND status NOT IN (completed, closed, canceled)).
-- Used for overdue alerts and priority dashboards. PRD: "Overdue (Past due date)"
-- filter and "Due date (with overdue highlighting in red)" in Kanban cards
CREATE INDEX idx_work_orders_due_date ON work_orders(due_date) WHERE due_date IS NOT NULL;

-- Composite index for common query: Get work orders by tenant, status, and priority.
-- Used for filtered Kanban board views and reporting. Optimizes queries like
-- "Get all high-priority in-progress work orders for tenant X"
CREATE INDEX idx_work_orders_tenant_status_priority ON work_orders(tenant_id, status, priority);

-- Composite index for site-level queries: Get work orders by site and status.
-- Used for site-specific Kanban boards and dashboards
CREATE INDEX idx_work_orders_site_status ON work_orders(site_id, status);

-- Get work orders for a specific asset. Used for asset history and asset-based
-- work order views. PRD: "Asset Board: Shows work orders for a specific asset
-- or asset group". Note: Index created even though FK constraint deferred
CREATE INDEX idx_work_orders_asset_id ON work_orders(asset_id) WHERE asset_id IS NOT NULL;

-- Get work orders reported by a specific user. Used for requester's work order
-- history and notification tracking
CREATE INDEX idx_work_orders_reported_by ON work_orders(reported_by) WHERE reported_by IS NOT NULL;

-- Get work orders linked to a PM schedule. Used for PM compliance reporting and
-- PM-generated work order tracking
CREATE INDEX idx_work_orders_pm_schedule_id ON work_orders(pm_schedule_id) WHERE pm_schedule_id IS NOT NULL;

-- Get work orders by work type. Used for work type-based reporting and filtering
CREATE INDEX idx_work_orders_work_type ON work_orders(work_type);

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_work_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_work_orders_updated_at
    BEFORE UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_work_orders_updated_at();

-- ============================================================================
-- COMMENTS (Database-level documentation)
-- ============================================================================

COMMENT ON TABLE work_orders IS 'Maintenance work orders across all tenants and sites. Supports full lifecycle: Open → In Progress → Pending → Completed → Closed, with role-based permissions.';

COMMENT ON COLUMN work_orders.id IS 'Unique identifier for the work order. Used as foreign key reference in related tables (work_order_parts, work_order_attachments, etc.)';
COMMENT ON COLUMN work_orders.tenant_id IS 'Foreign key to the parent tenant. All work orders belong to a tenant for multi-tenant data isolation. Queries filter by tenant_id for security';
COMMENT ON COLUMN work_orders.site_id IS 'Foreign key to the site where work is performed. All work orders belong to a specific site. Each site operates independently with its own work orders';
COMMENT ON COLUMN work_orders.code IS 'Human-readable work order code (e.g., WO-00001). Auto-generated on creation. Used in UI, reports, QR codes. Unique within tenant';
COMMENT ON COLUMN work_orders.title IS 'Brief title summarizing the work to be performed. Displayed in Kanban board cards, work order lists, and notifications';
COMMENT ON COLUMN work_orders.description IS 'Detailed description of the work required, problem statement, or maintenance task. Supports multi-line text for comprehensive documentation';
COMMENT ON COLUMN work_orders.work_type IS 'Type of work order determines workflow and reporting categorization. Values: breakdown, preventive_maintenance, corrective, inspection, safety, other';
COMMENT ON COLUMN work_orders.priority IS 'Priority level determines urgency and resource allocation. Used for Kanban board sorting and EOC emergency coordination. Values: emergency, high, medium, low';
COMMENT ON COLUMN work_orders.status IS 'Current status in the workflow lifecycle. Maps to workflow statuses: Open, In Progress, Pending, Completed, Closed, Canceled. Used for Kanban board columns';
COMMENT ON COLUMN work_orders.asset_id IS 'Foreign key to assets table. Links work order to specific equipment or functional location. NULL for location-based work without specific asset';
COMMENT ON COLUMN work_orders.functional_location_id IS 'Foreign key to functional_locations table. Links work order to location in asset hierarchy. NULL if work is asset-specific only';
COMMENT ON COLUMN work_orders.asset_name IS 'Denormalized asset name for display in Kanban cards and reports without joining assets table. Updated when asset_id changes';
COMMENT ON COLUMN work_orders.location IS 'Human-readable location description (e.g., "Building A, Floor 2, Room 205"). Used when functional_location_id is not available or for quick reference';
COMMENT ON COLUMN work_orders.assigned_to IS 'Foreign key to users table. Technician assigned to perform the work. NULL when work order is Open (unassigned). Admin assigns to move status Open → In Progress';
COMMENT ON COLUMN work_orders.reported_by IS 'Foreign key to users table. Person who reported or created the work order (Requester). Used for notifications and audit trail';
COMMENT ON COLUMN work_orders.due_date IS 'Target completion date for the work order. Used for overdue detection, priority calculation, and Kanban board sorting. NULL for unscheduled work';
COMMENT ON COLUMN work_orders.scheduled_start IS 'Planned start date and time for scheduled work. Used for PM calendar view and resource planning. NULL for unscheduled or reactive work';
COMMENT ON COLUMN work_orders.scheduled_end IS 'Planned end date and time for scheduled work. Used for capacity planning and calendar visualization. NULL for unscheduled work';
COMMENT ON COLUMN work_orders.estimated_hours IS 'Estimated labor hours required to complete the work. Used for resource planning, workload distribution, and cost estimation. NULL if unknown';
COMMENT ON COLUMN work_orders.actual_start IS 'Actual start date and time when technician began work. Captured via mobile app clock-in or manual entry. Used for MTTR calculations';
COMMENT ON COLUMN work_orders.actual_end IS 'Actual end date and time when technician completed work. Captured via mobile app clock-out or manual entry. Used for actual labor hours calculation';
COMMENT ON COLUMN work_orders.actual_hours IS 'Actual labor hours spent on the work order. Calculated from actual_start and actual_end, or manually entered. Used for cost calculation and efficiency analysis';
COMMENT ON COLUMN work_orders.labor_cost IS 'Labor cost in tenant currency. Calculated from actual_hours × hourly_rate or manually entered. Used for TCO analysis and cost reporting';
COMMENT ON COLUMN work_orders.parts_cost IS 'Parts and materials cost in tenant currency. Sum of all parts issued from inventory for this work order. Updated when parts are issued or returned';
COMMENT ON COLUMN work_orders.total_cost IS 'Total cost of the work order (labor_cost + parts_cost + other_costs). Calculated automatically or manually entered. Used for financial reporting and asset TCO calculations';
COMMENT ON COLUMN work_orders.failure_code IS 'Failure code classification (e.g., "BEARING_FAILURE", "ELECTRICAL_SHORT"). Used for reliability analysis, MTBF calculations, and failure pattern identification';
COMMENT ON COLUMN work_orders.root_cause IS 'Root cause analysis description. Detailed explanation of why the failure occurred. Used for RCA (Root Cause Analysis) and preventive action planning';
COMMENT ON COLUMN work_orders.corrective_action IS 'Corrective action taken to resolve the issue and prevent recurrence. Used for knowledge base and future reference';
COMMENT ON COLUMN work_orders.technician_notes IS 'Notes entered by the assigned technician during or after work completion. Contains work performed, observations, and completion details. Technician can update when assigned AND status = In Progress';
COMMENT ON COLUMN work_orders.admin_review IS 'Review comments from Admin after technician submits work for approval. Contains approval/rejection feedback. Admin can approve (Pending → Completed) or reject (Pending → In Progress)';
COMMENT ON COLUMN work_orders.request_id IS 'Foreign key to work_notifications table. Links work order to the original notification/request that triggered it. NULL for directly created work orders';
COMMENT ON COLUMN work_orders.parent_work_order_id IS 'Foreign key to work_orders table (self-reference). Links child work order to parent work order. Used for work order hierarchies. NULL for top-level work orders';
COMMENT ON COLUMN work_orders.pm_schedule_id IS 'Foreign key to pm_schedules table. Links work order to the preventive maintenance schedule that generated it. NULL for non-PM work orders';
COMMENT ON COLUMN work_orders.tags IS 'Array of tags/labels for categorization and filtering (e.g., ["PM", "Breakdown", "Safety"]). Used for Kanban board filtering and work order grouping';
COMMENT ON COLUMN work_orders.image_ids IS 'Array of image IDs (stored in MinIO/S3) attached during work order creation. Used for problem documentation and visual reference';
COMMENT ON COLUMN work_orders.technician_image_ids IS 'Array of image IDs captured by technician during work execution. Used for work documentation, before/after photos, and compliance evidence';
COMMENT ON COLUMN work_orders.settings IS 'Flexible JSON storage for custom fields and work order-specific settings without schema changes. Common uses: custom attributes, integration data, workflow state, notification preferences';
COMMENT ON COLUMN work_orders.created_at IS 'Timestamp when work order was created. Never modified after initial creation. Required for compliance, audit trails, and historical reporting. Used for "Age indicator (days since creation)" in Kanban cards';
COMMENT ON COLUMN work_orders.updated_at IS 'Timestamp of last modification. Auto-updated via database trigger on any column change. Useful for sync operations, debugging, and real-time update detection';
COMMENT ON COLUMN work_orders.created_by IS 'User ID who created this work order. NULL for system-generated work orders (e.g., from PM schedules). Required for SOX compliance and security audits';
COMMENT ON COLUMN work_orders.updated_by IS 'User ID who last modified this work order. Tracks all changes for audit trail. Critical for investigating unauthorized modifications. Required for 100% audit trail coverage';

-- ============================================================================
-- SEED DATA (Optional: Demo work order for development)
-- ============================================================================

-- Uncomment below to seed a demo work order for development/testing
-- Note: Replace 'TENANT-UUID-HERE', 'SITE-UUID-HERE', 'USER-UUID-HERE' with actual UUIDs
/*
INSERT INTO work_orders (
    tenant_id,
    site_id,
    code,
    title,
    description,
    work_type,
    priority,
    status,
    asset_name,
    location,
    assigned_to,
    reported_by,
    due_date,
    created_by
) VALUES (
    'TENANT-UUID-HERE',
    'SITE-UUID-HERE',
    'WO-00001',
    'Replace Bearing on Conveyor Belt Motor',
    'Motor bearing is making loud grinding noise. Requires immediate replacement to prevent motor failure.',
    'breakdown',
    'high',
    'open',
    'Conveyor Belt Motor #3',
    'Production Line A, Building 1',
    NULL,
    'USER-UUID-HERE',
    CURRENT_DATE + INTERVAL '3 days',
    'USER-UUID-HERE'
);
*/

