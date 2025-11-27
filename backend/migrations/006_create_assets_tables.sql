-- Migration: 006_create_assets_tables.sql
-- Description: Create functional_locations and assets tables with hierarchy support
-- Created: 2024-11-27
-- Author: Eureka CMMS Team

-- ============================================================================
-- FUNCTIONAL LOCATIONS AND ASSETS TABLES
-- Functional locations represent WHERE things are located (hierarchical structure:
-- Plant → Building → Floor → Area → Line → Station). Assets represent WHAT
-- equipment/machines are installed at those locations, with their own component
-- hierarchy (e.g., Motor → Bearings, Gearbox). This follows SAP PM pattern for
-- better integration and asset relocation tracking.
-- ============================================================================

-- Create enum types for constrained fields
CREATE TYPE location_type AS ENUM ('plant', 'building', 'floor', 'area', 'line', 'station', 'room', 'zone', 'other');
CREATE TYPE location_status AS ENUM ('active', 'inactive');

CREATE TYPE asset_type AS ENUM ('equipment', 'machine', 'component', 'tool', 'vehicle', 'facility', 'other');
CREATE TYPE asset_criticality AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE asset_status AS ENUM ('operational', 'downtime', 'maintenance', 'decommissioned');

-- ============================================================================
-- FUNCTIONAL LOCATIONS TABLE
-- Hierarchical structure representing physical locations where assets are
-- installed. Supports multi-level hierarchy (Plant → Building → Area → Line).
-- Each location can have a parent location, forming a tree structure.
-- ============================================================================

CREATE TABLE functional_locations (
    -- ========================================================================
    -- CORE IDENTIFICATION
    -- ========================================================================
    
    -- Unique identifier for the functional location. Used as foreign key reference
    -- in assets table and work_orders table
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to the parent tenant. All functional locations belong to a tenant
    -- for multi-tenant data isolation. Queries filter by tenant_id for security
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Foreign key to the site where this location exists. All functional locations
    -- belong to a specific site. PRD: "Each site operates independently with its
    -- own assets, work orders, and inventory"
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    
    -- Foreign key to parent functional location (self-reference). Forms hierarchy:
    -- Plant → Building → Floor → Area → Line → Station. NULL for root locations
    -- (top-level locations within a site). PRD: "Create and maintain asset
    -- hierarchies (functional locations and equipment)"
    parent_id UUID REFERENCES functional_locations(id) ON DELETE CASCADE,
    
    -- Human-readable location code (e.g., "FL-PLANT-A-LINE1"). Auto-generated on
    -- creation. Used in UI, reports, QR codes, and support communications. Must
    -- be unique within a site (same code can exist in different sites)
    code VARCHAR(50) NOT NULL,
    
    -- Display name shown throughout the application (e.g., "Production Line 1")
    name VARCHAR(255) NOT NULL,

    -- ========================================================================
    -- LOCATION CLASSIFICATION
    -- ========================================================================
    
    -- Type of location determines its role in the hierarchy and available
    -- workflows. plant: Top-level facility, building: Physical structure,
    -- floor: Building level, area: Functional area, line: Production line,
    -- station: Work station, room: Room within building, zone: Zone/region,
    -- other: Custom location types
    location_type location_type NOT NULL DEFAULT 'area',
    
    -- Detailed description of the location, its purpose, and any relevant notes.
    -- Used for documentation and technician reference
    description TEXT,

    -- ========================================================================
    -- HIERARCHY MANAGEMENT
    -- ========================================================================
    
    -- Hierarchy depth level (0 = root, 1 = first child, etc.). Calculated
    -- automatically based on parent_id chain. Used for tree queries and
    -- hierarchy validation. Root locations have level = 0
    level INTEGER NOT NULL DEFAULT 0,
    
    -- Materialized path for efficient tree queries (e.g., "/PLANT-A/BLDG-1/LINE-1").
    -- Updated automatically when parent changes. Enables fast ancestor/descendant
    -- queries without recursive CTEs. PRD: "Asset Hierarchy (Tree view of
    -- locations and equipment)"
    path TEXT NOT NULL DEFAULT '/',

    -- ========================================================================
    -- LOCATION INFORMATION
    -- ========================================================================
    
    -- GPS latitude coordinate (decimal degrees, precision to 7 decimal places
    -- for ~1cm accuracy). Used for EOC map view, technician dispatch, and
    -- location-based work order assignment. NULL if not applicable
    latitude DECIMAL(10, 7),
    
    -- GPS longitude coordinate (decimal degrees, precision to 7 decimal places
    -- for ~1cm accuracy). Used alongside latitude for mapping and dispatch
    longitude DECIMAL(10, 7),
    
    -- QR code string for mobile scanning. Auto-generated on creation or manually
    -- assigned. Technicians scan QR codes to quickly access location information
    -- and create work orders. PRD: "Scan QR codes to quickly access asset
    -- information and create work orders"
    qr_code VARCHAR(100) UNIQUE,

    -- ========================================================================
    -- SYSTEM MANAGEMENT
    -- ========================================================================
    
    -- Location operational status.
    -- active: Location is in use and appears in asset assignment and work orders
    -- inactive: Location is decommissioned or no longer used, data preserved
    --           for historical reporting but excluded from active operations
    status location_status NOT NULL DEFAULT 'active',
    
    -- Flexible JSON storage for location-specific configurations without schema
    -- changes. Common uses: custom attributes, integration data, workflow
    -- settings, notification preferences. PRD: "Define custom fields and
    -- attributes for assets, work orders, and inventory"
    settings JSONB NOT NULL DEFAULT '{}',

    -- ========================================================================
    -- AUDIT TRAIL
    -- ========================================================================
    
    -- Timestamp when location was created. Never modified after initial creation.
    -- Required for compliance, audit trails, and historical reporting
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Timestamp of last modification. Auto-updated via database trigger on any
    -- column change. Useful for sync operations and debugging
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- User ID of Site Manager or Tenant Admin who created this location.
    -- NULL for system-seeded records. Required for SOX compliance and security
    -- audits. Note: FK constraint added after users table is created
    created_by UUID,
    
    -- User ID who last modified this location record. Tracks all changes for
    -- audit trail. From PRD: "Achieve 100% audit trail coverage for safety and
    -- regulatory compliance". Note: FK constraint added after users table is created
    updated_by UUID,

    -- ========================================================================
    -- CONSTRAINTS
    -- ========================================================================
    
    -- Ensure location code is unique within a site (same code can exist in
    -- different sites, but not within the same site)
    CONSTRAINT uq_functional_locations_site_code UNIQUE (site_id, code),
    
    -- Ensure location cannot be its own parent (prevent circular references)
    CONSTRAINT chk_no_self_parent CHECK (parent_id IS NULL OR parent_id != id),
    
    -- Ensure level is non-negative
    CONSTRAINT chk_level_positive CHECK (level >= 0),
    
    -- Validate latitude is within valid range (-90 to 90 degrees)
    CONSTRAINT chk_latitude_range CHECK (
        latitude IS NULL OR (latitude >= -90 AND latitude <= 90)
    ),
    
    -- Validate longitude is within valid range (-180 to 180 degrees)
    CONSTRAINT chk_longitude_range CHECK (
        longitude IS NULL OR (longitude >= -180 AND longitude <= 180)
    )
);

-- ============================================================================
-- ASSETS TABLE
-- Physical equipment, machines, and components installed at functional locations.
-- Supports component hierarchy (e.g., Conveyor → Motor → Bearings). Each asset
-- is installed at a functional location and can have child assets (components).
-- ============================================================================

CREATE TABLE assets (
    -- ========================================================================
    -- CORE IDENTIFICATION
    -- ========================================================================
    
    -- Unique identifier for the asset. Used as foreign key reference in
    -- work_orders table and asset-related tables (asset_meters, asset_downtime, etc.)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to the parent tenant. All assets belong to a tenant for
    -- multi-tenant data isolation. Queries filter by tenant_id for security
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Foreign key to the site where this asset is located. All assets belong
    -- to a specific site. PRD: "Each site operates independently with its own
    -- assets, work orders, and inventory"
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    
    -- Foreign key to functional_locations table. Links asset to WHERE it is
    -- installed. NULL for assets not yet installed or mobile assets. PRD:
    -- "Link assets to their Bill of Materials (BOM) for spare parts" and
    -- "Create and maintain asset hierarchies (functional locations and equipment)"
    functional_location_id UUID REFERENCES functional_locations(id) ON DELETE SET NULL,
    
    -- Foreign key to parent asset (self-reference). Forms component hierarchy:
    -- Conveyor → Motor → Bearings. NULL for top-level assets (not components
    -- of another asset). PRD: "Create and maintain asset hierarchies (functional
    -- locations and equipment)"
    parent_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    
    -- Human-readable asset code (e.g., "AST-CV-101"). Auto-generated on creation.
    -- Used in UI, reports, QR codes, and support communications. Must be unique
    -- within a site (same code can exist in different sites)
    code VARCHAR(50) NOT NULL,
    
    -- Display name shown throughout the application (e.g., "Main Conveyor Belt")
    name VARCHAR(255) NOT NULL,

    -- ========================================================================
    -- ASSET CLASSIFICATION
    -- ========================================================================
    
    -- Type of asset determines its role and available workflows.
    -- equipment: Production equipment (conveyors, pumps, motors)
    -- machine: Complex machinery (robots, CNC machines, assembly lines)
    -- component: Sub-component of another asset (bearings, gears, sensors)
    -- tool: Tools and instruments (measuring devices, hand tools)
    -- vehicle: Mobile assets (forklifts, trucks, carts)
    -- facility: Building systems (HVAC, electrical, plumbing)
    -- other: Custom asset types
    asset_type asset_type NOT NULL DEFAULT 'equipment',
    
    -- Asset category for grouping and reporting (e.g., "Conveyor Systems",
    -- "Pumps", "Motors", "Robotics"). Used for asset register filtering and
    -- category-based maintenance strategies
    category VARCHAR(100),
    
    -- Criticality level determines priority for maintenance and resource
    -- allocation. Used by Site Managers for work order prioritization and EOC
    -- for emergency coordination. PRD: "Define asset classifications and
    -- criticality rankings using RCM or FMEA" and "Set priorities using asset
    -- criticality and production impact"
    -- critical: Production-stopping equipment requiring immediate response
    -- high: Important equipment with significant business impact
    -- medium: Standard operational equipment
    -- low: Non-critical or backup equipment
    criticality asset_criticality NOT NULL DEFAULT 'medium',
    
    -- Current operational status of the asset.
    -- operational: Asset is running normally
    -- downtime: Asset is not operational (breakdown, failure)
    -- maintenance: Asset is under maintenance or repair
    -- decommissioned: Asset is permanently removed from service
    status asset_status NOT NULL DEFAULT 'operational',

    -- ========================================================================
    -- MANUFACTURER & IDENTIFICATION
    -- ========================================================================
    
    -- Manufacturer name (e.g., "Siemens", "ABB", "Kuka"). Used for warranty
    -- tracking, supplier management, and technical support contact
    manufacturer VARCHAR(255),
    
    -- Model number or designation (e.g., "CV-2000", "KR-16"). Used for parts
    -- catalog lookup, technical documentation, and BOM management. PRD: "Link
    -- assets to their Bill of Materials (BOM) for spare parts"
    model VARCHAR(255),
    
    -- Serial number from manufacturer. Unique identifier for warranty claims,
    -- service history tracking, and asset identification. NULL if not available
    serial_number VARCHAR(100),

    -- ========================================================================
    -- HEALTH & PERFORMANCE
    -- ========================================================================
    
    -- Calculated health score (0-100) based on recent work orders, downtime
    -- events, and maintenance history. Updated automatically or manually entered.
    -- Used for asset performance dashboards and predictive maintenance triggers.
    -- PRD: "View asset performance dashboards and downtime reports"
    health_score INTEGER DEFAULT 100,
    
    -- Constraint: health_score must be between 0 and 100
    CONSTRAINT chk_health_score_range CHECK (health_score >= 0 AND health_score <= 100),

    -- ========================================================================
    -- INSTALLATION & WARRANTY
    -- ========================================================================
    
    -- Date when asset was installed at current location. Used for asset age
    -- calculations, warranty tracking, and maintenance scheduling. NULL if unknown
    installation_date DATE,
    
    -- Warranty expiration date. System sends alerts when warranty is expiring
    -- (30/7 days before). Used for warranty claim management and service
    -- contract planning. PRD: "Track asset warranty information and set
    -- expiration alerts"
    warranty_expiry DATE,
    
    -- Constraint: warranty_expiry should be after installation_date (if both provided)
    CONSTRAINT chk_warranty_after_installation CHECK (
        warranty_expiry IS NULL OR 
        installation_date IS NULL OR 
        warranty_expiry >= installation_date
    ),

    -- ========================================================================
    -- FINANCIAL INFORMATION
    -- ========================================================================
    
    -- Original purchase/acquisition cost in tenant currency. Used for Total Cost
    -- of Ownership (TCO) calculations, depreciation, and financial reporting.
    -- PRD: "Record asset acquisition costs and calculate Total Cost of Ownership (TCO)"
    acquisition_cost DECIMAL(12, 2),
    
    -- Constraint: acquisition_cost must be non-negative
    CONSTRAINT chk_acquisition_cost_positive CHECK (
        acquisition_cost IS NULL OR acquisition_cost >= 0
    ),

    -- ========================================================================
    -- TECHNICAL SPECIFICATIONS
    -- ========================================================================
    
    -- Flexible JSON storage for technical specifications without schema changes.
    -- Common uses: power rating, capacity, dimensions, operating parameters,
    -- certifications, compliance data. PRD: "Attach technical specifications,
    -- manuals, and drawings to assets"
    specifications JSONB NOT NULL DEFAULT '{}',

    -- ========================================================================
    -- MOBILE & DOCUMENTATION
    -- ========================================================================
    
    -- QR code string for mobile scanning. Auto-generated on creation or manually
    -- assigned. Technicians scan QR codes to quickly access asset information,
    -- view maintenance history, and create work orders. PRD: "Scan asset QR codes
    -- to instantly access asset history and specifications"
    qr_code VARCHAR(100) UNIQUE,
    
    -- Array of image IDs (stored in MinIO/S3) attached to the asset.
    -- Used for visual identification, documentation, and reference. PRD:
    -- "Attach technical specifications, manuals, and drawings to assets"
    image_ids TEXT[] DEFAULT '{}',

    -- ========================================================================
    -- SYSTEM MANAGEMENT
    -- ========================================================================
    
    -- Flexible JSON storage for asset-specific configurations without schema
    -- changes. Common uses: custom attributes, integration data, workflow
    -- settings, notification preferences, IoT device mappings. PRD: "Define
    -- custom fields and attributes for assets, work orders, and inventory"
    settings JSONB NOT NULL DEFAULT '{}',

    -- ========================================================================
    -- AUDIT TRAIL
    -- ========================================================================
    
    -- Timestamp when asset was created. Never modified after initial creation.
    -- Required for compliance, audit trails, and historical reporting
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Timestamp of last modification. Auto-updated via database trigger on any
    -- column change. Useful for sync operations and debugging
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- User ID of Site Manager or Tenant Admin who created this asset.
    -- NULL for system-seeded records. Required for SOX compliance and security
    -- audits. Note: FK constraint added after users table is created
    created_by UUID,
    
    -- User ID who last modified this asset record. Tracks all changes for audit
    -- trail. From PRD: "Achieve 100% audit trail coverage for safety and
    -- regulatory compliance". Note: FK constraint added after users table is created
    updated_by UUID,

    -- ========================================================================
    -- CONSTRAINTS
    -- ========================================================================
    
    -- Ensure asset code is unique within a site (same code can exist in
    -- different sites, but not within the same site)
    CONSTRAINT uq_assets_site_code UNIQUE (site_id, code),
    
    -- Ensure asset cannot be its own parent (prevent circular references)
    CONSTRAINT chk_no_self_parent CHECK (parent_id IS NULL OR parent_id != id)
);

-- ============================================================================
-- INDEXES FOR FUNCTIONAL_LOCATIONS
-- ============================================================================

-- Most common query: Get all functional locations for a tenant. Critical for
-- multi-tenant data isolation and performance
CREATE INDEX idx_functional_locations_tenant_id ON functional_locations(tenant_id);

-- Get all functional locations for a specific site. Used for site-level asset
-- hierarchy views and location management
CREATE INDEX idx_functional_locations_site_id ON functional_locations(site_id);

-- Get child locations of a parent (hierarchy queries). Critical for tree
-- navigation and asset hierarchy display
CREATE INDEX idx_functional_locations_parent_id ON functional_locations(parent_id) WHERE parent_id IS NOT NULL;

-- Filter locations by type for reporting and workflow routing
CREATE INDEX idx_functional_locations_location_type ON functional_locations(location_type);

-- Filter active locations (most common query pattern for asset assignment)
CREATE INDEX idx_functional_locations_status ON functional_locations(status);

-- Lookup location by code within site (enforced by UNIQUE constraint, but
-- explicit index for documentation and performance)
CREATE INDEX idx_functional_locations_site_code ON functional_locations(site_id, code);

-- Fast path-based queries for ancestor/descendant lookups (prefix matching)
CREATE INDEX idx_functional_locations_path ON functional_locations(path);

-- Lookup location by QR code for mobile scanning
CREATE INDEX idx_functional_locations_qr_code ON functional_locations(qr_code) WHERE qr_code IS NOT NULL;

-- Composite index for common query: Get locations by site and status
CREATE INDEX idx_functional_locations_site_status ON functional_locations(site_id, status);

-- ============================================================================
-- INDEXES FOR ASSETS
-- ============================================================================

-- Most common query: Get all assets for a tenant. Critical for multi-tenant
-- data isolation and performance
CREATE INDEX idx_assets_tenant_id ON assets(tenant_id);

-- Get all assets for a specific site. Used for site-level asset register and
-- asset management
CREATE INDEX idx_assets_site_id ON assets(site_id);

-- Get assets installed at a specific functional location. Used for location-based
-- asset views and work order assignment
CREATE INDEX idx_assets_functional_location_id ON assets(functional_location_id) WHERE functional_location_id IS NOT NULL;

-- Get child assets of a parent (component hierarchy queries). Critical for
-- asset component tree navigation
CREATE INDEX idx_assets_parent_id ON assets(parent_id) WHERE parent_id IS NOT NULL;

-- Filter assets by type for reporting and categorization
CREATE INDEX idx_assets_asset_type ON assets(asset_type);

-- Filter assets by criticality for priority-based work order assignment and
-- EOC emergency coordination
CREATE INDEX idx_assets_criticality ON assets(criticality);

-- Filter assets by status for operational dashboards and asset availability
CREATE INDEX idx_assets_status ON assets(status);

-- Lookup asset by code within site (enforced by UNIQUE constraint, but explicit
-- index for documentation and performance)
CREATE INDEX idx_assets_site_code ON assets(site_id, code);

-- Find assets by manufacturer and model for parts catalog and BOM management
CREATE INDEX idx_assets_manufacturer_model ON assets(manufacturer, model) WHERE manufacturer IS NOT NULL AND model IS NOT NULL;

-- Lookup asset by serial number for warranty tracking and service history
CREATE INDEX idx_assets_serial_number ON assets(serial_number) WHERE serial_number IS NOT NULL;

-- Lookup asset by QR code for mobile scanning
CREATE INDEX idx_assets_qr_code ON assets(qr_code) WHERE qr_code IS NOT NULL;

-- Composite index for common query: Get critical assets by site and status
CREATE INDEX idx_assets_site_criticality_status ON assets(site_id, criticality, status);

-- Composite index for health score queries (low health assets requiring attention)
CREATE INDEX idx_assets_health_score ON assets(health_score) WHERE health_score < 70;

-- Find assets with expiring warranties for alert generation
CREATE INDEX idx_assets_warranty_expiry ON assets(warranty_expiry) WHERE warranty_expiry IS NOT NULL;

-- ============================================================================
-- TRIGGERS: Auto-update updated_at timestamp
-- ============================================================================

-- Function for functional_locations
CREATE OR REPLACE FUNCTION update_functional_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_functional_locations_updated_at
    BEFORE UPDATE ON functional_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_functional_locations_updated_at();

-- Function for assets
CREATE OR REPLACE FUNCTION update_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_assets_updated_at();

-- ============================================================================
-- COMMENTS (Database-level documentation)
-- ============================================================================

-- FUNCTIONAL_LOCATIONS TABLE COMMENTS
COMMENT ON TABLE functional_locations IS 'Hierarchical structure representing physical locations where assets are installed. Supports multi-level hierarchy (Plant → Building → Area → Line).';

COMMENT ON COLUMN functional_locations.id IS 'Unique identifier for the functional location. Used as foreign key reference in assets table and work_orders table';
COMMENT ON COLUMN functional_locations.tenant_id IS 'Foreign key to the parent tenant. All functional locations belong to a tenant for multi-tenant data isolation. Queries filter by tenant_id for security';
COMMENT ON COLUMN functional_locations.site_id IS 'Foreign key to the site where this location exists. All functional locations belong to a specific site. Each site operates independently with its own assets';
COMMENT ON COLUMN functional_locations.parent_id IS 'Foreign key to parent functional location (self-reference). Forms hierarchy: Plant → Building → Floor → Area → Line → Station. NULL for root locations';
COMMENT ON COLUMN functional_locations.code IS 'Human-readable location code (e.g., "FL-PLANT-A-LINE1"). Auto-generated on creation. Used in UI, reports, QR codes. Unique within site';
COMMENT ON COLUMN functional_locations.name IS 'Display name shown throughout the application (e.g., "Production Line 1")';
COMMENT ON COLUMN functional_locations.location_type IS 'Type of location determines its role in the hierarchy. Values: plant, building, floor, area, line, station, room, zone, other';
COMMENT ON COLUMN functional_locations.description IS 'Detailed description of the location, its purpose, and any relevant notes. Used for documentation and technician reference';
COMMENT ON COLUMN functional_locations.level IS 'Hierarchy depth level (0 = root, 1 = first child, etc.). Calculated automatically based on parent_id chain. Used for tree queries';
COMMENT ON COLUMN functional_locations.path IS 'Materialized path for efficient tree queries (e.g., "/PLANT-A/BLDG-1/LINE-1"). Updated automatically when parent changes. Enables fast ancestor/descendant queries';
COMMENT ON COLUMN functional_locations.latitude IS 'GPS latitude coordinate (decimal degrees, precision to 7 decimal places for ~1cm accuracy). Used for EOC map view and technician dispatch';
COMMENT ON COLUMN functional_locations.longitude IS 'GPS longitude coordinate (decimal degrees, precision to 7 decimal places for ~1cm accuracy). Used alongside latitude for mapping and dispatch';
COMMENT ON COLUMN functional_locations.qr_code IS 'QR code string for mobile scanning. Auto-generated on creation or manually assigned. Technicians scan QR codes to quickly access location information';
COMMENT ON COLUMN functional_locations.status IS 'Location operational status. Values: active (location is in use), inactive (decommissioned, data preserved for historical reporting)';
COMMENT ON COLUMN functional_locations.settings IS 'Flexible JSON storage for location-specific configurations without schema changes. Common uses: custom attributes, integration data, workflow settings';
COMMENT ON COLUMN functional_locations.created_at IS 'Timestamp when location was created. Never modified after initial creation. Required for compliance, audit trails, and historical reporting';
COMMENT ON COLUMN functional_locations.updated_at IS 'Timestamp of last modification. Auto-updated via database trigger on any column change. Useful for sync operations and debugging';
COMMENT ON COLUMN functional_locations.created_by IS 'User ID of Site Manager or Tenant Admin who created this location. NULL for system-seeded records. Required for SOX compliance';
COMMENT ON COLUMN functional_locations.updated_by IS 'User ID who last modified this location record. Tracks all changes for audit trail. Required for 100% audit trail coverage';

-- ASSETS TABLE COMMENTS
COMMENT ON TABLE assets IS 'Physical equipment, machines, and components installed at functional locations. Supports component hierarchy (e.g., Conveyor → Motor → Bearings).';

COMMENT ON COLUMN assets.id IS 'Unique identifier for the asset. Used as foreign key reference in work_orders table and asset-related tables';
COMMENT ON COLUMN assets.tenant_id IS 'Foreign key to the parent tenant. All assets belong to a tenant for multi-tenant data isolation. Queries filter by tenant_id for security';
COMMENT ON COLUMN assets.site_id IS 'Foreign key to the site where this asset is located. All assets belong to a specific site. Each site operates independently with its own assets';
COMMENT ON COLUMN assets.functional_location_id IS 'Foreign key to functional_locations table. Links asset to WHERE it is installed. NULL for assets not yet installed or mobile assets';
COMMENT ON COLUMN assets.parent_id IS 'Foreign key to parent asset (self-reference). Forms component hierarchy: Conveyor → Motor → Bearings. NULL for top-level assets';
COMMENT ON COLUMN assets.code IS 'Human-readable asset code (e.g., "AST-CV-101"). Auto-generated on creation. Used in UI, reports, QR codes. Unique within site';
COMMENT ON COLUMN assets.name IS 'Display name shown throughout the application (e.g., "Main Conveyor Belt")';
COMMENT ON COLUMN assets.asset_type IS 'Type of asset determines its role and available workflows. Values: equipment, machine, component, tool, vehicle, facility, other';
COMMENT ON COLUMN assets.category IS 'Asset category for grouping and reporting (e.g., "Conveyor Systems", "Pumps", "Motors"). Used for asset register filtering';
COMMENT ON COLUMN assets.criticality IS 'Criticality level determines priority for maintenance and resource allocation. Values: critical, high, medium, low. Used for work order prioritization';
COMMENT ON COLUMN assets.status IS 'Current operational status of the asset. Values: operational (running normally), downtime (not operational), maintenance (under repair), decommissioned (removed from service)';
COMMENT ON COLUMN assets.manufacturer IS 'Manufacturer name (e.g., "Siemens", "ABB", "Kuka"). Used for warranty tracking, supplier management, and technical support contact';
COMMENT ON COLUMN assets.model IS 'Model number or designation (e.g., "CV-2000", "KR-16"). Used for parts catalog lookup, technical documentation, and BOM management';
COMMENT ON COLUMN assets.serial_number IS 'Serial number from manufacturer. Unique identifier for warranty claims, service history tracking, and asset identification';
COMMENT ON COLUMN assets.health_score IS 'Calculated health score (0-100) based on recent work orders, downtime events, and maintenance history. Used for asset performance dashboards';
COMMENT ON COLUMN assets.installation_date IS 'Date when asset was installed at current location. Used for asset age calculations, warranty tracking, and maintenance scheduling';
COMMENT ON COLUMN assets.warranty_expiry IS 'Warranty expiration date. System sends alerts when warranty is expiring (30/7 days before). Used for warranty claim management';
COMMENT ON COLUMN assets.acquisition_cost IS 'Original purchase/acquisition cost in tenant currency. Used for Total Cost of Ownership (TCO) calculations, depreciation, and financial reporting';
COMMENT ON COLUMN assets.specifications IS 'Flexible JSON storage for technical specifications without schema changes. Common uses: power rating, capacity, dimensions, operating parameters, certifications';
COMMENT ON COLUMN assets.qr_code IS 'QR code string for mobile scanning. Auto-generated on creation or manually assigned. Technicians scan QR codes to quickly access asset information and view maintenance history';
COMMENT ON COLUMN assets.image_ids IS 'Array of image IDs (stored in MinIO/S3) attached to the asset. Used for visual identification, documentation, and reference';
COMMENT ON COLUMN assets.settings IS 'Flexible JSON storage for asset-specific configurations without schema changes. Common uses: custom attributes, integration data, workflow settings, IoT device mappings';
COMMENT ON COLUMN assets.created_at IS 'Timestamp when asset was created. Never modified after initial creation. Required for compliance, audit trails, and historical reporting';
COMMENT ON COLUMN assets.updated_at IS 'Timestamp of last modification. Auto-updated via database trigger on any column change. Useful for sync operations and debugging';
COMMENT ON COLUMN assets.created_by IS 'User ID of Site Manager or Tenant Admin who created this asset. NULL for system-seeded records. Required for SOX compliance and security audits';
COMMENT ON COLUMN assets.updated_by IS 'User ID who last modified this asset record. Tracks all changes for audit trail. Required for 100% audit trail coverage';

-- ============================================================================
-- SEED DATA (Optional: Demo data for development)
-- ============================================================================

-- Uncomment below to seed demo functional locations and assets for development/testing
-- Note: Replace 'TENANT-UUID-HERE', 'SITE-UUID-HERE', 'USER-UUID-HERE' with actual UUIDs
/*
-- Create functional location hierarchy
INSERT INTO functional_locations (
    tenant_id,
    site_id,
    code,
    name,
    location_type,
    description,
    level,
    path,
    created_by
) VALUES
-- Root location: Plant A
(
    'TENANT-UUID-HERE',
    'SITE-UUID-HERE',
    'FL-PLANT-A',
    'Plant A - Main Assembly',
    'plant',
    'Main production facility',
    0,
    '/FL-PLANT-A',
    'USER-UUID-HERE'
),
-- Building 1
(
    'TENANT-UUID-HERE',
    'SITE-UUID-HERE',
    'FL-BLDG-1',
    'Building 1',
    'building',
    'Production building',
    1,
    '/FL-PLANT-A/FL-BLDG-1',
    'USER-UUID-HERE'
),
-- Production Line 1
(
    'TENANT-UUID-HERE',
    'SITE-UUID-HERE',
    'FL-LINE-1',
    'Production Line 1',
    'line',
    'Main assembly line',
    2,
    '/FL-PLANT-A/FL-BLDG-1/FL-LINE-1',
    'USER-UUID-HERE'
);

-- Create assets
INSERT INTO assets (
    tenant_id,
    site_id,
    functional_location_id,
    code,
    name,
    asset_type,
    category,
    manufacturer,
    model,
    criticality,
    status,
    health_score,
    installation_date,
    created_by
) VALUES
-- Conveyor at Line 1
(
    'TENANT-UUID-HERE',
    'SITE-UUID-HERE',
    (SELECT id FROM functional_locations WHERE code = 'FL-LINE-1'),
    'AST-CV-101',
    'Main Conveyor Belt',
    'equipment',
    'Conveyor Systems',
    'Siemens',
    'CV-2000',
    'high',
    'operational',
    88,
    '2021-05-15',
    'USER-UUID-HERE'
),
-- Robot Arm at Line 1
(
    'TENANT-UUID-HERE',
    'SITE-UUID-HERE',
    (SELECT id FROM functional_locations WHERE code = 'FL-LINE-1'),
    'AST-RB-202',
    'Assembly Robot Arm',
    'machine',
    'Robotics',
    'Kuka',
    'KR-16',
    'critical',
    'operational',
    98,
    '2022-01-10',
    'USER-UUID-HERE'
);
*/

