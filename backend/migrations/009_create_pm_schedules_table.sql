-- Migration: 009_create_pm_schedules_table.sql
-- Description: Create the pm_schedules table for preventive maintenance schedule management
-- Created: 2024-11-27
-- Author: Eureka CMMS Team

-- ============================================================================
-- PM SCHEDULES TABLE
-- Core table for managing preventive maintenance schedules across all tenants
-- and sites. Supports time-based scheduling, meter-based triggers, route-based
-- maintenance, job plan templates, and automatic work order generation.
-- ============================================================================

-- Create enum types for constrained fields
CREATE TYPE pm_trigger_type AS ENUM (
    'time_based',        -- Scheduled by calendar frequency (daily, weekly, monthly, etc.)
    'meter_based',       -- Triggered by meter reading threshold (hours, cycles, etc.)
    'route_based'        -- Inspection route with checkpoints for daily rounds
);

CREATE TYPE pm_frequency AS ENUM (
    'daily',            -- Every day
    'weekly',           -- Every week
    'biweekly',         -- Every 2 weeks
    'monthly',          -- Every month
    'quarterly',        -- Every 3 months
    'semiannually',     -- Every 6 months
    'annually',         -- Every year
    'custom'            -- Custom interval using frequency_interval
);

CREATE TYPE pm_status AS ENUM (
    'active',           -- Schedule is active and generating work orders
    'suspended',        -- Schedule is temporarily suspended (asset maintenance, etc.)
    'completed'         -- Schedule has ended (end_date reached)
);

-- Create the pm_schedules table
CREATE TABLE pm_schedules (
    -- ========================================================================
    -- CORE IDENTIFICATION
    -- ========================================================================
    
    -- Unique identifier for the PM schedule. Used as foreign key reference
    -- in work_orders table (pm_schedule_id) to link generated work orders
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to the parent tenant. All PM schedules belong to a tenant
    -- for multi-tenant data isolation. Queries filter by tenant_id for security
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Foreign key to the site where this PM schedule is active. All PM schedules
    -- belong to a specific site. PRD: "Each site operates independently with
    -- its own assets, work orders, and inventory"
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    
    -- Human-readable PM schedule code (e.g., "PM-001"). Auto-generated on creation.
    -- Used in UI, reports, and support communications. Must be unique within a
    -- site (same code can exist in different sites)
    code VARCHAR(50) NOT NULL,
    
    -- Display name shown throughout the application (e.g., "Monthly Pump Inspection")
    name VARCHAR(255) NOT NULL,
    
    -- Detailed description of the PM schedule, its purpose, and maintenance tasks.
    -- Used for documentation and technician reference. PRD: "Build reusable job
    -- plans with standard procedures and checklists"
    description TEXT,

    -- ========================================================================
    -- ASSET REFERENCE
    -- ========================================================================
    
    -- Foreign key to assets table. Links PM schedule to specific equipment.
    -- NULL for location-based PM or route-based maintenance. PRD: "Schedule PM
    -- tasks based on time intervals" and "Trigger PM based on meter readings
    -- exceeding thresholds"
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    
    -- Foreign key to functional_locations table. Links PM schedule to location
    -- for location-based maintenance or route-based inspection. NULL if PM is
    -- asset-specific only. PRD: "Create route-based maintenance plans for daily
    -- inspection rounds"
    functional_location_id UUID REFERENCES functional_locations(id) ON DELETE CASCADE,

    -- ========================================================================
    -- TRIGGER CONFIGURATION
    -- ========================================================================
    
    -- Type of trigger determines how PM work orders are generated.
    -- time_based: Scheduled by calendar frequency (daily, weekly, monthly, etc.)
    -- meter_based: Triggered when meter reading exceeds threshold
    -- route_based: Inspection route with checkpoints for daily rounds
    trigger_type pm_trigger_type NOT NULL DEFAULT 'time_based',
    
    -- Frequency for time-based schedules. Used to calculate next_due_date.
    -- For custom frequency, use frequency_interval. PRD: "Schedule PM tasks
    -- based on time intervals (daily, weekly, monthly)"
    frequency pm_frequency NOT NULL DEFAULT 'monthly',
    
    -- Custom frequency interval (e.g., every 3 weeks). Used when frequency
    -- is 'custom'. Specifies number of days/weeks/months between PM tasks.
    -- NULL for standard frequencies. PRD: "Schedule PM tasks based on time
    -- intervals" - supports custom intervals
    frequency_interval INTEGER,
    
    -- Type of meter for meter-based triggers (e.g., "operating_hours", "cycles",
    -- "kilometers", "temperature"). NULL for non-meter-based schedules. PRD:
    -- "Trigger PM based on meter readings exceeding thresholds (hours, cycles,
    -- temperature)"
    meter_type VARCHAR(50),
    
    -- Meter threshold value that triggers PM work order generation. When meter
    -- reading exceeds this value, system generates work order. NULL for
    -- non-meter-based schedules. PRD: "Trigger PM based on meter readings
    -- exceeding thresholds"
    meter_threshold INTEGER,

    -- ========================================================================
    -- SCHEDULING
    -- ========================================================================
    
    -- Date when PM schedule becomes active. Work orders are generated starting
    -- from this date. Used for scheduling calculations. PRD: "Use drag-and-drop
    -- PM calendar for scheduling"
    start_date DATE NOT NULL,
    
    -- Date when PM schedule ends (optional). NULL for indefinite schedules.
    -- After this date, no new work orders are generated. Used for temporary
    -- PM schedules or asset decommissioning
    end_date DATE,
    
    -- Next scheduled execution date. Calculated automatically based on
    -- frequency and last_executed_at. Updated when work order is generated.
    -- Used for PM calendar view and upcoming tasks dashboard. PRD: "View PM
    -- compliance rates and upcoming scheduled tasks"
    next_due_date DATE,
    
    -- Timestamp when last work order was generated from this schedule. Used
    -- for calculating next_due_date and PM compliance tracking. NULL if no
    -- work orders have been generated yet
    last_executed_at TIMESTAMPTZ,
    
    -- Lead time in days before due date to generate work order. For example,
    -- if lead_time_days = 7 and next_due_date = 2024-12-01, work order is
    -- generated on 2024-11-24. PRD: "Lead Time: Days before due to generate
    -- WO (e.g., 7 days)"
    lead_time_days INTEGER NOT NULL DEFAULT 7,

    -- ========================================================================
    -- ASSIGNMENT
    -- ========================================================================
    
    -- Foreign key to users table. Technician or team lead assigned to perform
    -- PM tasks. NULL for unassigned schedules (work orders can be assigned
    -- later). PRD: "Assign PM schedules to specific technicians or teams"
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Work order type for generated work orders. Typically 'preventive_maintenance'.
    -- Used when creating work orders from this schedule. PRD: "Work Type:
    -- Preventive Maintenance"
    work_type VARCHAR(50) NOT NULL DEFAULT 'preventive_maintenance',
    
    -- Estimated labor hours required to complete PM task. Used for resource
    -- planning and work order estimation. PRD: "Estimated Duration: Hours per task"
    estimated_hours DECIMAL(6, 2),
    
    -- Default priority for generated work orders. Can be overridden when work
    -- order is created. PRD: "Set priorities using asset criticality and
    -- production impact"
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',

    -- ========================================================================
    -- CONFIGURATION
    -- ========================================================================
    
    -- Auto-assign generated work orders to assigned_to technician. If false,
    -- work orders are created unassigned and must be assigned manually. PRD:
    -- "Auto-Assign: Enable/Disable"
    auto_assign BOOLEAN NOT NULL DEFAULT false,
    
    -- Auto-generate work orders when due date is reached. If false, work orders
    -- must be created manually. PRD: "System creates first work order based
    -- on schedule"
    auto_generate BOOLEAN NOT NULL DEFAULT true,
    
    -- Send notification when work order is generated. Notifies assigned
    -- technician or Site Manager. PRD: "Notification: Email/Push when WO created"
    notify_on_create BOOLEAN NOT NULL DEFAULT true,
    
    -- Flexible JSON storage for job plan templates, checklists, procedures,
    -- and instructions. Contains structured data for work order creation.
    -- PRD: "Build reusable job plans with standard procedures and checklists"
    -- and "Attach job plans to PM schedules"
    job_plan JSONB NOT NULL DEFAULT '{}',

    -- ========================================================================
    -- SYSTEM MANAGEMENT
    -- ========================================================================
    
    -- PM schedule status determines whether work orders are generated.
    -- active: Schedule is active and generating work orders
    -- suspended: Schedule is temporarily suspended (asset maintenance, etc.)
    -- completed: Schedule has ended (end_date reached)
    status pm_status NOT NULL DEFAULT 'active',
    
    -- Flexible JSON storage for PM schedule-specific configurations without
    -- schema changes. Common uses: custom attributes, integration data, workflow
    -- settings, notification preferences. PRD: "Define custom fields and
    -- attributes for assets, work orders, and inventory"
    settings JSONB NOT NULL DEFAULT '{}',

    -- ========================================================================
    -- AUDIT TRAIL
    -- ========================================================================
    
    -- Timestamp when PM schedule was created. Never modified after initial
    -- creation. Required for compliance, audit trails, and historical reporting
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Timestamp of last modification. Auto-updated via database trigger on any
    -- column change. Useful for sync operations and debugging
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- User ID of Site Manager who created this PM schedule. NULL for system-seeded
    -- records. Required for SOX compliance and security audits. Note: FK constraint
    -- added after users table is created
    created_by UUID,
    
    -- User ID who last modified this PM schedule record. Tracks all changes for
    -- audit trail. From PRD: "Achieve 100% audit trail coverage for safety and
    -- regulatory compliance". Note: FK constraint added after users table is created
    updated_by UUID,

    -- ========================================================================
    -- CONSTRAINTS
    -- ========================================================================
    
    -- Ensure PM schedule code is unique within a site (same code can exist in
    -- different sites, but not within the same site)
    CONSTRAINT uq_pm_schedules_site_code UNIQUE (site_id, code),
    
    -- Ensure at least one asset reference is provided (asset_id or functional_location_id)
    CONSTRAINT chk_asset_or_location CHECK (
        asset_id IS NOT NULL OR functional_location_id IS NOT NULL
    ),
    
    -- Ensure frequency_interval is provided when frequency is 'custom'
    CONSTRAINT chk_custom_frequency_interval CHECK (
        frequency != 'custom' OR frequency_interval IS NOT NULL
    ),
    
    -- Ensure meter fields are provided when trigger_type is 'meter_based'
    CONSTRAINT chk_meter_based_fields CHECK (
        trigger_type != 'meter_based' OR (meter_type IS NOT NULL AND meter_threshold IS NOT NULL)
    ),
    
    -- Ensure meter fields are NULL when trigger_type is not 'meter_based'
    CONSTRAINT chk_non_meter_fields_null CHECK (
        trigger_type = 'meter_based' OR (meter_type IS NULL AND meter_threshold IS NULL)
    ),
    
    -- Ensure end_date is after start_date if both provided
    CONSTRAINT chk_schedule_dates CHECK (
        end_date IS NULL OR start_date <= end_date
    ),
    
    -- Ensure next_due_date is after start_date if provided
    CONSTRAINT chk_next_due_after_start CHECK (
        next_due_date IS NULL OR next_due_date >= start_date
    ),
    
    -- Ensure lead_time_days is non-negative
    CONSTRAINT chk_lead_time_positive CHECK (lead_time_days >= 0),
    
    -- Ensure estimated_hours is non-negative if provided
    CONSTRAINT chk_estimated_hours_positive CHECK (
        estimated_hours IS NULL OR estimated_hours >= 0
    )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Most common query: Get all PM schedules for a tenant. Critical for
-- multi-tenant data isolation and performance
CREATE INDEX idx_pm_schedules_tenant_id ON pm_schedules(tenant_id);

-- Get all PM schedules for a specific site. Used for site-level PM management
CREATE INDEX idx_pm_schedules_site_id ON pm_schedules(site_id);

-- Get PM schedules for a specific asset. Used for asset PM history and
-- schedule management. PRD: "Schedule PM tasks based on time intervals"
CREATE INDEX idx_pm_schedules_asset_id ON pm_schedules(asset_id) WHERE asset_id IS NOT NULL;

-- Get PM schedules for a specific functional location. Used for location-based
-- PM and route-based maintenance. PRD: "Create route-based maintenance plans"
CREATE INDEX idx_pm_schedules_functional_location_id ON pm_schedules(functional_location_id) 
    WHERE functional_location_id IS NOT NULL;

-- Filter PM schedules by trigger type for type-based reporting and filtering
CREATE INDEX idx_pm_schedules_trigger_type ON pm_schedules(trigger_type);

-- Filter active PM schedules (most common query pattern for PM calendar)
CREATE INDEX idx_pm_schedules_status ON pm_schedules(status);

-- Find PM schedules due soon (next_due_date within lead_time_days). Used for
-- work order generation cron job. PRD: "Auto-generate work orders based on schedule"
CREATE INDEX idx_pm_schedules_next_due ON pm_schedules(next_due_date, status) 
    WHERE status = 'active' AND next_due_date IS NOT NULL;

-- Get PM schedules assigned to a specific technician. Used for technician
-- workload planning and PM calendar filtering. PRD: "Assign PM schedules to
-- specific technicians or teams"
CREATE INDEX idx_pm_schedules_assigned_to ON pm_schedules(assigned_to) 
    WHERE assigned_to IS NOT NULL;

-- Lookup PM schedule by code within site (enforced by UNIQUE constraint, but
-- explicit index for documentation and performance)
CREATE INDEX idx_pm_schedules_site_code ON pm_schedules(site_id, code);

-- Composite index for common query: Get active PM schedules by site and next due date
CREATE INDEX idx_pm_schedules_site_status_due ON pm_schedules(site_id, status, next_due_date) 
    WHERE status = 'active';

-- Find meter-based PM schedules for meter reading monitoring
CREATE INDEX idx_pm_schedules_meter_based ON pm_schedules(trigger_type, meter_type) 
    WHERE trigger_type = 'meter_based';

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_pm_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pm_schedules_updated_at
    BEFORE UPDATE ON pm_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_pm_schedules_updated_at();

-- ============================================================================
-- COMMENTS (Database-level documentation)
-- ============================================================================

COMMENT ON TABLE pm_schedules IS 'Preventive maintenance schedules across all tenants and sites. Supports time-based scheduling, meter-based triggers, route-based maintenance, and automatic work order generation.';

COMMENT ON COLUMN pm_schedules.id IS 'Unique identifier for the PM schedule. Used as foreign key reference in work_orders table (pm_schedule_id) to link generated work orders';
COMMENT ON COLUMN pm_schedules.tenant_id IS 'Foreign key to the parent tenant. All PM schedules belong to a tenant for multi-tenant data isolation. Queries filter by tenant_id for security';
COMMENT ON COLUMN pm_schedules.site_id IS 'Foreign key to the site where this PM schedule is active. All PM schedules belong to a specific site. Each site operates independently with its own PM schedules';
COMMENT ON COLUMN pm_schedules.code IS 'Human-readable PM schedule code (e.g., "PM-001"). Auto-generated on creation. Used in UI, reports. Unique within site';
COMMENT ON COLUMN pm_schedules.name IS 'Display name shown throughout the application (e.g., "Monthly Pump Inspection")';
COMMENT ON COLUMN pm_schedules.description IS 'Detailed description of the PM schedule, its purpose, and maintenance tasks. Used for documentation and technician reference';
COMMENT ON COLUMN pm_schedules.asset_id IS 'Foreign key to assets table. Links PM schedule to specific equipment. NULL for location-based PM or route-based maintenance';
COMMENT ON COLUMN pm_schedules.functional_location_id IS 'Foreign key to functional_locations table. Links PM schedule to location for location-based maintenance or route-based inspection';
COMMENT ON COLUMN pm_schedules.trigger_type IS 'Type of trigger determines how PM work orders are generated. Values: time_based (scheduled by calendar), meter_based (meter threshold), route_based (inspection route)';
COMMENT ON COLUMN pm_schedules.frequency IS 'Frequency for time-based schedules. Used to calculate next_due_date. Values: daily, weekly, biweekly, monthly, quarterly, semiannually, annually, custom';
COMMENT ON COLUMN pm_schedules.frequency_interval IS 'Custom frequency interval (e.g., every 3 weeks). Used when frequency is ''custom''. Specifies number of days/weeks/months between PM tasks';
COMMENT ON COLUMN pm_schedules.meter_type IS 'Type of meter for meter-based triggers (e.g., "operating_hours", "cycles", "kilometers"). NULL for non-meter-based schedules';
COMMENT ON COLUMN pm_schedules.meter_threshold IS 'Meter threshold value that triggers PM work order generation. When meter reading exceeds this value, system generates work order';
COMMENT ON COLUMN pm_schedules.start_date IS 'Date when PM schedule becomes active. Work orders are generated starting from this date. Used for scheduling calculations';
COMMENT ON COLUMN pm_schedules.end_date IS 'Date when PM schedule ends (optional). NULL for indefinite schedules. After this date, no new work orders are generated';
COMMENT ON COLUMN pm_schedules.next_due_date IS 'Next scheduled execution date. Calculated automatically based on frequency and last_executed_at. Used for PM calendar view';
COMMENT ON COLUMN pm_schedules.last_executed_at IS 'Timestamp when last work order was generated from this schedule. Used for calculating next_due_date and PM compliance tracking';
COMMENT ON COLUMN pm_schedules.lead_time_days IS 'Lead time in days before due date to generate work order. For example, if lead_time_days = 7 and next_due_date = 2024-12-01, work order is generated on 2024-11-24';
COMMENT ON COLUMN pm_schedules.assigned_to IS 'Foreign key to users table. Technician or team lead assigned to perform PM tasks. NULL for unassigned schedules';
COMMENT ON COLUMN pm_schedules.work_type IS 'Work order type for generated work orders. Typically ''preventive_maintenance''. Used when creating work orders from this schedule';
COMMENT ON COLUMN pm_schedules.estimated_hours IS 'Estimated labor hours required to complete PM task. Used for resource planning and work order estimation';
COMMENT ON COLUMN pm_schedules.priority IS 'Default priority for generated work orders. Can be overridden when work order is created. Values: emergency, high, medium, low';
COMMENT ON COLUMN pm_schedules.auto_assign IS 'Auto-assign generated work orders to assigned_to technician. If false, work orders are created unassigned and must be assigned manually';
COMMENT ON COLUMN pm_schedules.auto_generate IS 'Auto-generate work orders when due date is reached. If false, work orders must be created manually';
COMMENT ON COLUMN pm_schedules.notify_on_create IS 'Send notification when work order is generated. Notifies assigned technician or Site Manager';
COMMENT ON COLUMN pm_schedules.job_plan IS 'Flexible JSON storage for job plan templates, checklists, procedures, and instructions. Contains structured data for work order creation';
COMMENT ON COLUMN pm_schedules.status IS 'PM schedule status determines whether work orders are generated. Values: active (generating WOs), suspended (temporarily stopped), completed (ended)';
COMMENT ON COLUMN pm_schedules.settings IS 'Flexible JSON storage for PM schedule-specific configurations without schema changes. Common uses: custom attributes, integration data, workflow settings';
COMMENT ON COLUMN pm_schedules.created_at IS 'Timestamp when PM schedule was created. Never modified after initial creation. Required for compliance, audit trails, and historical reporting';
COMMENT ON COLUMN pm_schedules.updated_at IS 'Timestamp of last modification. Auto-updated via database trigger on any column change. Useful for sync operations and debugging';
COMMENT ON COLUMN pm_schedules.created_by IS 'User ID of Site Manager who created this PM schedule. NULL for system-seeded records. Required for SOX compliance and security audits';
COMMENT ON COLUMN pm_schedules.updated_by IS 'User ID who last modified this PM schedule record. Tracks all changes for audit trail. Required for 100% audit trail coverage';

-- ============================================================================
-- SEED DATA (Optional: Demo PM schedule for development)
-- ============================================================================

-- Uncomment below to seed a demo PM schedule for development/testing
-- Note: Replace 'TENANT-UUID-HERE', 'SITE-UUID-HERE', 'ASSET-UUID-HERE', 'USER-UUID-HERE' with actual UUIDs
/*
INSERT INTO pm_schedules (
    tenant_id,
    site_id,
    code,
    name,
    description,
    asset_id,
    trigger_type,
    frequency,
    start_date,
    next_due_date,
    lead_time_days,
    assigned_to,
    work_type,
    estimated_hours,
    priority,
    auto_assign,
    auto_generate,
    created_by
) VALUES (
    'TENANT-UUID-HERE',
    'SITE-UUID-HERE',
    'PM-001',
    'Monthly Pump Inspection',
    'Monthly preventive maintenance inspection for all production pumps. Includes lubrication, vibration check, and seal inspection.',
    'ASSET-UUID-HERE',
    'time_based',
    'monthly',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 month',
    7,
    'USER-UUID-HERE',
    'preventive_maintenance',
    2.0,
    'medium',
    true,
    true,
    'USER-UUID-HERE'
);
*/

