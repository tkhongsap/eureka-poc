-- Migration: 010_create_work_notifications_table.sql
-- Description: Create the work_notifications table for tracking maintenance requests from non-technical staff
-- Created: 2024-11-27
-- Author: Eureka CMMS Team

-- ============================================================================
-- WORK NOTIFICATIONS TABLE
-- Core table for tracking maintenance requests submitted by non-technical staff
-- before they become work orders. Supports QR code scanning, mobile portal
-- submission, asset/location linking, priority setting, and conversion to
-- work orders or resolution without creating work orders.
-- ============================================================================

-- Create enum types for constrained fields
CREATE TYPE notification_status AS ENUM (
    'open',             -- Pending review by Site Manager
    'in_progress',      -- Being evaluated/converted to work order
    'converted',        -- Converted to work order (linked to work_order_id)
    'closed'            -- Resolved without creating work order
);

CREATE TYPE notification_priority AS ENUM (
    'emergency',        -- Critical issue requiring immediate attention
    'high',             -- High priority issue
    'medium',           -- Medium priority issue
    'low'               -- Low priority issue
);

-- Create the work_notifications table
CREATE TABLE work_notifications (
    -- ========================================================================
    -- CORE IDENTIFICATION
    -- ========================================================================
    
    -- Unique identifier for the work notification. Used as foreign key reference
    -- in work_orders table (request_id) to link work orders created from notifications
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to the parent tenant. All work notifications belong to a tenant
    -- for multi-tenant data isolation. Queries filter by tenant_id for security
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Foreign key to the site where this notification was submitted. All work
    -- notifications belong to a specific site. PRD: "Each site operates independently
    -- with its own assets, work orders, and inventory"
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    
    -- Human-readable notification code (e.g., "WN-001"). Auto-generated on creation.
    -- Used in UI, reports, and support communications. Must be unique within a site
    -- (same code can exist in different sites)
    code VARCHAR(50) NOT NULL,
    
    -- Brief title summarizing the maintenance issue (e.g., "Leaking pipe in Building A")
    title VARCHAR(255) NOT NULL,
    
    -- Detailed description of the problem reported. Used for Site Manager review
    -- and work order creation. PRD: "Attach photos and descriptions to clearly
    -- communicate the problem"
    description TEXT NOT NULL,

    -- ========================================================================
    -- ASSET REFERENCE
    -- ========================================================================
    
    -- Foreign key to assets table. Links notification to specific equipment if
    -- issue is equipment-related. NULL for location-based issues. PRD: "Link
    -- notifications to specific assets or locations"
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    
    -- Foreign key to functional_locations table. Links notification to location
    -- if issue is location-based. NULL if notification is asset-specific only.
    -- PRD: "Quickly report maintenance issues by scanning QR codes on equipment
    -- or locations"
    functional_location_id UUID REFERENCES functional_locations(id) ON DELETE SET NULL,
    
    -- QR code value that was scanned to create this notification. Used for
    -- tracking QR code usage and analytics. NULL if notification was created
    -- manually or via API. PRD: "Quickly report maintenance issues by scanning
    -- QR codes on equipment or locations"
    qr_code VARCHAR(255),

    -- ========================================================================
    -- REPORTER INFORMATION
    -- ========================================================================
    
    -- Name of the person reporting the issue. Required for external reporters
    -- (non-system users). NULL if reported_by is set (internal user). PRD:
    -- "Submit work notifications through a simple mobile-friendly portal"
    reporter_name VARCHAR(255),
    
    -- Email address of the reporter. Used for notifications and follow-up
    -- communications. PRD: "Track the status of my requests and receive updates
    -- when work is completed"
    reporter_email VARCHAR(255),
    
    -- Phone number of the reporter. Used for urgent issues and follow-up calls
    reporter_phone VARCHAR(50),
    
    -- Foreign key to users table. User ID if notification was submitted by an
    -- internal user (employee with system access). NULL for external reporters.
    -- PRD: "Create work notifications on behalf of callers via API integration"
    -- Note: FK constraint added after users table is created
    reported_by UUID,

    -- ========================================================================
    -- NOTIFICATION DETAILS
    -- ========================================================================
    
    -- Priority level set by reporter or call center operator. Used for triage
    -- and work order priority assignment. PRD: "Set priority levels based on
    -- caller urgency"
    priority notification_priority NOT NULL DEFAULT 'medium',
    
    -- Array of image UUIDs attached to the notification. Images are stored in
    -- object storage (MinIO/S3) and referenced by UUID. Used for visual problem
    -- documentation. PRD: "Attach photos and descriptions to clearly communicate
    -- the problem"
    image_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],

    -- ========================================================================
    -- RESOLUTION TRACKING
    -- ========================================================================
    
    -- Notification status determines workflow stage and visibility. PRD:
    -- "Track the status of my requests and receive updates when work is completed"
    -- open: Pending review by Site Manager
    -- in_progress: Being evaluated/converted to work order
    -- converted: Converted to work order (linked to work_order_id)
    -- closed: Resolved without creating work order
    status notification_status NOT NULL DEFAULT 'open',
    
    -- Foreign key to work_orders table. Links notification to work order when
    -- converted. NULL until notification is converted. PRD: "Receive notifications
    -- when my request is converted to a work order"
    work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
    
    -- Notes explaining how notification was resolved if closed without creating
    -- work order. Used for tracking resolution methods and analytics. NULL for
    -- converted notifications (resolution tracked in work order)
    resolution_notes TEXT,
    
    -- Timestamp when notification was resolved (converted or closed). NULL until
    -- notification is resolved. Used for notification-to-resolution time tracking.
    -- PRD: "Track notification-to-resolution time"
    resolved_at TIMESTAMPTZ,
    
    -- User ID who resolved or converted the notification (Site Manager). NULL
    -- until notification is resolved. Used for audit trail and accountability.
    -- Note: FK constraint added after users table is created
    resolved_by UUID,

    -- ========================================================================
    -- AUDIT TRAIL
    -- ========================================================================
    
    -- Timestamp when notification was created. Never modified after initial
    -- creation. Required for compliance, audit trails, and historical reporting
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Timestamp of last modification. Auto-updated via database trigger on any
    -- column change. Useful for sync operations and debugging
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- User ID who created this notification (if internal user) or NULL for
    -- external reporters. Required for SOX compliance and security audits.
    -- PRD: "Create work notifications on behalf of callers via API integration"
    -- Note: FK constraint added after users table is created
    created_by UUID,
    
    -- User ID who last modified this notification record. Tracks all changes for
    -- audit trail. Critical for investigating unauthorized modifications. Note:
    -- FK constraint added after users table is created
    updated_by UUID,

    -- ========================================================================
    -- CONSTRAINTS
    -- ========================================================================
    
    -- Ensure notification code is unique within a site (same code can exist in
    -- different sites, but not within the same site)
    CONSTRAINT uq_work_notifications_site_code UNIQUE (site_id, code),
    
    -- Ensure at least one asset reference is provided (asset_id or functional_location_id)
    CONSTRAINT chk_asset_or_location CHECK (
        asset_id IS NOT NULL OR functional_location_id IS NOT NULL
    ),
    
    -- Ensure reporter information is provided (either reporter_name for external
    -- or reported_by for internal users)
    CONSTRAINT chk_reporter_info CHECK (
        (reporter_name IS NOT NULL) OR (reported_by IS NOT NULL)
    ),
    
    -- Ensure work_order_id is set when status is 'converted'
    CONSTRAINT chk_converted_has_work_order CHECK (
        status != 'converted' OR work_order_id IS NOT NULL
    ),
    
    -- Ensure work_order_id is NULL when status is not 'converted'
    CONSTRAINT chk_non_converted_no_work_order CHECK (
        status = 'converted' OR work_order_id IS NULL
    ),
    
    -- Ensure resolved_at and resolved_by are set when status is 'converted' or 'closed'
    CONSTRAINT chk_resolved_fields CHECK (
        (status NOT IN ('converted', 'closed')) OR
        (resolved_at IS NOT NULL AND resolved_by IS NOT NULL)
    ),
    
    -- Ensure resolved_at and resolved_by are NULL when status is 'open' or 'in_progress'
    CONSTRAINT chk_open_fields_null CHECK (
        status IN ('open', 'in_progress') OR
        (resolved_at IS NOT NULL AND resolved_by IS NOT NULL)
    )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Most common query: Get all notifications for a tenant. Critical for
-- multi-tenant data isolation and performance
CREATE INDEX idx_work_notifications_tenant_id ON work_notifications(tenant_id);

-- Get all notifications for a specific site. Used for site-level notification
-- management and reporting
CREATE INDEX idx_work_notifications_site_id ON work_notifications(site_id);

-- Get notifications for a specific asset. Used for asset notification history
CREATE INDEX idx_work_notifications_asset_id ON work_notifications(asset_id) 
    WHERE asset_id IS NOT NULL;

-- Get notifications for a specific functional location. Used for location-based
-- notification tracking
CREATE INDEX idx_work_notifications_functional_location_id ON work_notifications(functional_location_id) 
    WHERE functional_location_id IS NOT NULL;

-- Filter notifications by status for status-based views and workflows
CREATE INDEX idx_work_notifications_status ON work_notifications(status);

-- Find open notifications requiring review. Used for Site Manager dashboard
-- and notification queue. PRD: "Open Notifications (Pending review)"
CREATE INDEX idx_work_notifications_open ON work_notifications(site_id, status) 
    WHERE status = 'open';

-- Get notifications by priority for triage and prioritization
CREATE INDEX idx_work_notifications_priority ON work_notifications(priority);

-- Find notifications converted to a specific work order
CREATE INDEX idx_work_notifications_work_order_id ON work_notifications(work_order_id) 
    WHERE work_order_id IS NOT NULL;

-- Get notifications by reporter (internal user). Used for user notification history
CREATE INDEX idx_work_notifications_reported_by ON work_notifications(reported_by) 
    WHERE reported_by IS NOT NULL;

-- Get notifications by resolver. Used for Site Manager activity tracking
CREATE INDEX idx_work_notifications_resolved_by ON work_notifications(resolved_by) 
    WHERE resolved_by IS NOT NULL;

-- Lookup notification by code within site (enforced by UNIQUE constraint, but
-- explicit index for documentation and performance)
CREATE INDEX idx_work_notifications_site_code ON work_notifications(site_id, code);

-- Composite index for common query: Get open notifications by site and priority
CREATE INDEX idx_work_notifications_site_status_priority ON work_notifications(site_id, status, priority) 
    WHERE status = 'open';

-- Get notifications by creation date for reporting and analytics
CREATE INDEX idx_work_notifications_created_at ON work_notifications(created_at);

-- Get notifications by resolution date for notification-to-resolution time tracking
CREATE INDEX idx_work_notifications_resolved_at ON work_notifications(resolved_at) 
    WHERE resolved_at IS NOT NULL;

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_work_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_work_notifications_updated_at
    BEFORE UPDATE ON work_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_work_notifications_updated_at();

-- ============================================================================
-- COMMENTS (Database-level documentation)
-- ============================================================================

COMMENT ON TABLE work_notifications IS 'Tracks maintenance requests submitted by non-technical staff before they become work orders. Supports QR code scanning, mobile portal submission, asset/location linking, and conversion to work orders.';

COMMENT ON COLUMN work_notifications.id IS 'Unique identifier for the work notification. Used as foreign key reference in work_orders table (request_id) to link work orders created from notifications';
COMMENT ON COLUMN work_notifications.tenant_id IS 'Foreign key to the parent tenant. All work notifications belong to a tenant for multi-tenant data isolation. Queries filter by tenant_id for security';
COMMENT ON COLUMN work_notifications.site_id IS 'Foreign key to the site where this notification was submitted. All work notifications belong to a specific site. Each site operates independently';
COMMENT ON COLUMN work_notifications.code IS 'Human-readable notification code (e.g., "WN-001"). Auto-generated on creation. Used in UI, reports. Unique within site';
COMMENT ON COLUMN work_notifications.title IS 'Brief title summarizing the maintenance issue (e.g., "Leaking pipe in Building A")';
COMMENT ON COLUMN work_notifications.description IS 'Detailed description of the problem reported. Used for Site Manager review and work order creation';
COMMENT ON COLUMN work_notifications.asset_id IS 'Foreign key to assets table. Links notification to specific equipment if issue is equipment-related';
COMMENT ON COLUMN work_notifications.functional_location_id IS 'Foreign key to functional_locations table. Links notification to location if issue is location-based';
COMMENT ON COLUMN work_notifications.qr_code IS 'QR code value that was scanned to create this notification. Used for tracking QR code usage and analytics';
COMMENT ON COLUMN work_notifications.reporter_name IS 'Name of the person reporting the issue. Required for external reporters (non-system users)';
COMMENT ON COLUMN work_notifications.reporter_email IS 'Email address of the reporter. Used for notifications and follow-up communications';
COMMENT ON COLUMN work_notifications.reporter_phone IS 'Phone number of the reporter. Used for urgent issues and follow-up calls';
COMMENT ON COLUMN work_notifications.reported_by IS 'Foreign key to users table. User ID if notification was submitted by an internal user (employee with system access)';
COMMENT ON COLUMN work_notifications.priority IS 'Priority level set by reporter or call center operator. Used for triage and work order priority assignment. Values: emergency, high, medium, low';
COMMENT ON COLUMN work_notifications.image_ids IS 'Array of image UUIDs attached to the notification. Images are stored in object storage and referenced by UUID';
COMMENT ON COLUMN work_notifications.status IS 'Notification status determines workflow stage and visibility. Values: open (pending review), in_progress (being evaluated), converted (linked to WO), closed (resolved without WO)';
COMMENT ON COLUMN work_notifications.work_order_id IS 'Foreign key to work_orders table. Links notification to work order when converted. NULL until notification is converted';
COMMENT ON COLUMN work_notifications.resolution_notes IS 'Notes explaining how notification was resolved if closed without creating work order. NULL for converted notifications';
COMMENT ON COLUMN work_notifications.resolved_at IS 'Timestamp when notification was resolved (converted or closed). NULL until notification is resolved. Used for notification-to-resolution time tracking';
COMMENT ON COLUMN work_notifications.resolved_by IS 'User ID who resolved or converted the notification (Site Manager). NULL until notification is resolved';
COMMENT ON COLUMN work_notifications.created_at IS 'Timestamp when notification was created. Never modified after initial creation. Required for compliance, audit trails, and historical reporting';
COMMENT ON COLUMN work_notifications.updated_at IS 'Timestamp of last modification. Auto-updated via database trigger on any column change. Useful for sync operations and debugging';
COMMENT ON COLUMN work_notifications.created_by IS 'User ID who created this notification (if internal user) or NULL for external reporters. Required for SOX compliance and security audits';
COMMENT ON COLUMN work_notifications.updated_by IS 'User ID who last modified this notification record. Tracks all changes for audit trail. Critical for investigating unauthorized modifications';

-- ============================================================================
-- SEED DATA (Optional: Demo notification for development)
-- ============================================================================

-- Uncomment below to seed a demo work notification for development/testing
-- Note: Replace 'TENANT-UUID-HERE', 'SITE-UUID-HERE', 'ASSET-UUID-HERE', 'USER-UUID-HERE' with actual UUIDs
/*
INSERT INTO work_notifications (
    tenant_id,
    site_id,
    code,
    title,
    description,
    asset_id,
    reporter_name,
    reporter_email,
    priority,
    status,
    created_by
) VALUES (
    'TENANT-UUID-HERE',
    'SITE-UUID-HERE',
    'WN-001',
    'Leaking pipe in Building A',
    'Water leak observed near the main entrance. Water pooling on floor.',
    'ASSET-UUID-HERE',
    'John Smith',
    'john.smith@example.com',
    'high',
    'open',
    'USER-UUID-HERE'
);
*/

