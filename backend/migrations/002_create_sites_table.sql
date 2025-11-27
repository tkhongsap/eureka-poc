-- Migration: 002_create_sites_table.sql
-- Description: Create the sites table for multi-site management within tenants
-- Created: 2024-11-27
-- Author: Eureka CMMS Team

-- ============================================================================
-- SITES TABLE
-- Represents factories, warehouses, offices, and facilities within each tenant
-- organization. Each tenant can have multiple sites, and each site operates
-- independently with its own assets, work orders, and inventory.
-- ============================================================================

-- Create enum types for constrained fields
CREATE TYPE site_type AS ENUM ('factory', 'warehouse', 'office', 'distribution_center', 'other');
CREATE TYPE site_status AS ENUM ('active', 'inactive', 'maintenance');
CREATE TYPE site_criticality AS ENUM ('critical', 'high', 'medium', 'low');

-- Create the sites table
CREATE TABLE sites (
    -- ========================================================================
    -- CORE IDENTIFICATION
    -- ========================================================================
    
    -- Unique identifier for the site. Used as foreign key reference in 
    -- work_orders, assets, users, inventory, and other site-scoped tables
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to the parent tenant. All sites belong to a tenant for
    -- multi-tenant data isolation. Queries filter by tenant_id for security
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Human-readable site code (e.g., SITE-BKK-001). Auto-generated on creation.
    -- Used in UI, reports, QR codes, and support communications
    code VARCHAR(20) NOT NULL,
    
    -- Display name shown throughout the application 
    -- (e.g., "Bangkok Manufacturing Plant")
    name VARCHAR(255) NOT NULL,

    -- ========================================================================
    -- SITE CLASSIFICATION
    -- ========================================================================
    
    -- Type of site determines available workflows and features.
    -- factory: Production facilities with equipment maintenance focus
    -- warehouse: Material storage with handling equipment
    -- office: Administrative buildings with HVAC/facilities focus
    -- distribution_center: Logistics hubs with material handling
    -- other: Custom site types
    site_type site_type NOT NULL DEFAULT 'factory',
    
    -- Criticality level for resource prioritization during emergencies.
    -- Used by Enterprise Operations Center (EOC) for cross-site dispatch.
    -- critical: Main production sites requiring immediate response
    -- high: Important facilities with significant business impact
    -- medium: Standard operational sites
    -- low: Backup or non-critical locations
    criticality site_criticality NOT NULL DEFAULT 'medium',

    -- ========================================================================
    -- LOCATION INFORMATION
    -- ========================================================================
    
    -- Street address line 1. Required for shipping spare parts, legal 
    -- documents, and regulatory compliance
    address_line1 VARCHAR(255),
    
    -- Street address line 2 (suite, building, floor). Optional additional
    -- address details for complex locations
    address_line2 VARCHAR(255),
    
    -- City name. Used for geographic reporting and supplier deliveries
    city VARCHAR(100),
    
    -- State or province name. Required for multi-state/country operations
    state_province VARCHAR(100),
    
    -- Postal or ZIP code. Used for shipping and address validation
    postal_code VARCHAR(20),
    
    -- Country name. Required for international operations and compliance
    country VARCHAR(100),
    
    -- GPS latitude coordinate (decimal degrees, precision to 7 decimal places
    -- for ~1cm accuracy). Used for EOC map view, technician dispatch, and
    -- calculating travel time for cross-site assignments
    latitude DECIMAL(10, 7),
    
    -- GPS longitude coordinate (decimal degrees, precision to 7 decimal places
    -- for ~1cm accuracy). Used alongside latitude for mapping and dispatch
    longitude DECIMAL(10, 7),

    -- ========================================================================
    -- CONTACT INFORMATION
    -- ========================================================================
    
    -- Name of the Site Manager responsible for this location. Primary point
    -- of contact for site operations, work order management, and supervision
    site_manager_name VARCHAR(255),
    
    -- Email address of the Site Manager. System sends notifications here for
    -- critical events, work order assignments, and site-level alerts
    site_manager_email VARCHAR(255),
    
    -- Phone number of the Site Manager. Include country code (e.g., +66-2-xxx-xxxx).
    -- Used for urgent escalations and operational coordination
    site_manager_phone VARCHAR(50),
    
    -- Name of the emergency contact person. Different from Site Manager as
    -- this person must be available 24/7 for major incidents
    emergency_contact_name VARCHAR(255),
    
    -- Phone number of the emergency contact. Used by Enterprise Operations
    -- Center (EOC) for coordinating with external agencies (fire department,
    -- ambulance, police) during critical situations
    emergency_contact_phone VARCHAR(50),

    -- ========================================================================
    -- LICENSING (Subset of Tenant Pool)
    -- ========================================================================
    
    -- Number of user licenses allocated from the tenant's license pool to
    -- this site. Tenant Admin distributes licenses across sites (e.g., 50 to
    -- Bangkok site, 30 to Chonburi site). Prevents one site from consuming
    -- all available licenses
    license_allocation INTEGER NOT NULL DEFAULT 0,
    
    -- Current count of active user licenses at this site. Must not exceed
    -- license_allocation. Updated automatically when users are created or
    -- deactivated at this site. Enables license usage reporting per site
    licenses_used INTEGER NOT NULL DEFAULT 0,

    -- ========================================================================
    -- REGIONAL CONFIGURATION (Can Override Tenant Defaults)
    -- ========================================================================
    
    -- Default timezone for this site in IANA format (e.g., Asia/Bangkok).
    -- Can differ from tenant default if sites span multiple timezones.
    -- Used for work order scheduling, PM calendar, and report timestamps.
    -- If NULL, inherits from tenant timezone
    timezone VARCHAR(50),
    
    -- ISO 4217 currency code for cost calculations, inventory valuation, and
    -- financial reports at this site. Can differ from tenant default for
    -- multi-national operations (e.g., Bangkok site uses THB, US site uses USD).
    -- If NULL, inherits from tenant currency
    currency VARCHAR(3),
    
    -- Default UI language code (ISO 639-1) for site users. Site workers may
    -- prefer different language than tenant default (e.g., Thai factory uses
    -- 'th', English is fallback). Users can override in personal preferences.
    -- If NULL, inherits from tenant language
    language VARCHAR(10),
    
    -- Date display format preference for this site. Regional conventions vary
    -- (US: MM/DD/YYYY, Thailand: DD/MM/YYYY). Critical for work order due dates
    -- to avoid confusion (e.g., 01/02/2024 meaning Jan 2 vs Feb 1).
    -- If NULL, inherits from tenant date_format
    date_format VARCHAR(20),

    -- ========================================================================
    -- SYSTEM MANAGEMENT
    -- ========================================================================
    
    -- Site operational status.
    -- active: Normal operations, site appears in dashboards and assignments
    -- inactive: Permanently closed, data archived but preserved for compliance.
    --           Excluded from active dashboards but accessible for reporting
    -- maintenance: Temporarily offline (planned shutdown, maintenance window).
    --              Work orders can be created but not assigned
    status site_status NOT NULL DEFAULT 'active',
    
    -- Flexible JSON storage for site-specific configurations without schema
    -- changes. Common uses: workflow customizations, notification preferences,
    -- integration keys (site-specific IoT endpoints), feature flags, custom
    -- approval processes. From PRD: "Configure site-specific workflows"
    settings JSONB NOT NULL DEFAULT '{}',

    -- ========================================================================
    -- AUDIT TRAIL
    -- ========================================================================
    
    -- Timestamp when site was created. Never modified after initial creation.
    -- Required for compliance, audit trails, and historical reporting
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Timestamp of last modification. Auto-updated via database trigger 
    -- on any column change. Useful for sync operations and debugging
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- User ID of Tenant Admin or Site Manager who created this site.
    -- NULL for system-seeded records. Required for SOX compliance and
    -- security audits. Note: FK constraint added after users table is created
    created_by UUID,
    
    -- User ID who last modified this site record. Tracks all changes for
    -- audit trail. From PRD: "Achieve 100% audit trail coverage for safety
    -- and regulatory compliance". Note: FK constraint added after users table
    -- is created
    updated_by UUID,

    -- ========================================================================
    -- CONSTRAINTS
    -- ========================================================================
    
    -- Ensure site code is unique within a tenant (same code can exist in
    -- different tenants, but not within the same tenant)
    CONSTRAINT uq_sites_tenant_code UNIQUE (tenant_id, code),
    
    -- Ensure licenses_used never exceeds license_allocation
    CONSTRAINT chk_licenses_not_exceeded CHECK (licenses_used <= license_allocation),
    
    -- Ensure license values are non-negative
    CONSTRAINT chk_license_allocation_positive CHECK (license_allocation >= 0),
    CONSTRAINT chk_licenses_used_positive CHECK (licenses_used >= 0),
    
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
-- INDEXES
-- ============================================================================

-- Most common query: Get all sites for a tenant. Critical for multi-tenant
-- data isolation and performance
CREATE INDEX idx_sites_tenant_id ON sites(tenant_id);

-- Filter active sites (most common query pattern for dashboards and assignments)
CREATE INDEX idx_sites_status ON sites(status);

-- Find sites by type for reporting and workflow routing
CREATE INDEX idx_sites_site_type ON sites(site_type);

-- Lookup site by code within tenant (enforced by UNIQUE constraint, but
-- explicit index for documentation and performance)
CREATE INDEX idx_sites_tenant_code ON sites(tenant_id, code);

-- Find sites by criticality for EOC emergency prioritization
CREATE INDEX idx_sites_criticality ON sites(criticality);

-- Geographic queries: Find sites near a location (for cross-site dispatch)
-- Using GIST index for spatial queries if PostGIS is available
-- CREATE INDEX idx_sites_location ON sites USING GIST (ll_to_earth(latitude, longitude));

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_sites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sites_updated_at
    BEFORE UPDATE ON sites
    FOR EACH ROW
    EXECUTE FUNCTION update_sites_updated_at();

-- ============================================================================
-- COMMENTS (Database-level documentation)
-- ============================================================================

COMMENT ON TABLE sites IS 'Factories, warehouses, offices, and facilities within tenant organizations. Each tenant can have multiple sites with independent operations.';

COMMENT ON COLUMN sites.id IS 'Unique identifier for the site. Used as foreign key reference in work_orders, assets, users, inventory, and other site-scoped tables';
COMMENT ON COLUMN sites.tenant_id IS 'Foreign key to the parent tenant. All sites belong to a tenant for multi-tenant data isolation. Queries filter by tenant_id for security';
COMMENT ON COLUMN sites.code IS 'Human-readable site code (e.g., SITE-BKK-001). Auto-generated on creation. Used in UI, reports, QR codes, and support communications';
COMMENT ON COLUMN sites.name IS 'Display name shown throughout the application (e.g., "Bangkok Manufacturing Plant")';
COMMENT ON COLUMN sites.site_type IS 'Type of site determines available workflows and features. Values: factory, warehouse, office, distribution_center, other';
COMMENT ON COLUMN sites.criticality IS 'Criticality level for resource prioritization during emergencies. Used by EOC for cross-site dispatch. Values: critical, high, medium, low';
COMMENT ON COLUMN sites.address_line1 IS 'Street address line 1. Required for shipping spare parts, legal documents, and regulatory compliance';
COMMENT ON COLUMN sites.address_line2 IS 'Street address line 2 (suite, building, floor). Optional additional address details for complex locations';
COMMENT ON COLUMN sites.city IS 'City name. Used for geographic reporting and supplier deliveries';
COMMENT ON COLUMN sites.state_province IS 'State or province name. Required for multi-state/country operations';
COMMENT ON COLUMN sites.postal_code IS 'Postal or ZIP code. Used for shipping and address validation';
COMMENT ON COLUMN sites.country IS 'Country name. Required for international operations and compliance';
COMMENT ON COLUMN sites.latitude IS 'GPS latitude coordinate (decimal degrees, precision to 7 decimal places for ~1cm accuracy). Used for EOC map view, technician dispatch, and calculating travel time for cross-site assignments';
COMMENT ON COLUMN sites.longitude IS 'GPS longitude coordinate (decimal degrees, precision to 7 decimal places for ~1cm accuracy). Used alongside latitude for mapping and dispatch';
COMMENT ON COLUMN sites.site_manager_name IS 'Name of the Site Manager responsible for this location. Primary point of contact for site operations, work order management, and supervision';
COMMENT ON COLUMN sites.site_manager_email IS 'Email address of the Site Manager. System sends notifications here for critical events, work order assignments, and site-level alerts';
COMMENT ON COLUMN sites.site_manager_phone IS 'Phone number of the Site Manager. Include country code (e.g., +66-2-xxx-xxxx). Used for urgent escalations and operational coordination';
COMMENT ON COLUMN sites.emergency_contact_name IS 'Name of the emergency contact person. Different from Site Manager as this person must be available 24/7 for major incidents';
COMMENT ON COLUMN sites.emergency_contact_phone IS 'Phone number of the emergency contact. Used by Enterprise Operations Center (EOC) for coordinating with external agencies (fire department, ambulance, police) during critical situations';
COMMENT ON COLUMN sites.license_allocation IS 'Number of user licenses allocated from the tenant''s license pool to this site. Tenant Admin distributes licenses across sites. Prevents one site from consuming all available licenses';
COMMENT ON COLUMN sites.licenses_used IS 'Current count of active user licenses at this site. Must not exceed license_allocation. Updated automatically when users are created or deactivated at this site';
COMMENT ON COLUMN sites.timezone IS 'Default timezone for this site in IANA format (e.g., Asia/Bangkok). Can differ from tenant default if sites span multiple timezones. Used for work order scheduling, PM calendar, and report timestamps. If NULL, inherits from tenant timezone';
COMMENT ON COLUMN sites.currency IS 'ISO 4217 currency code for cost calculations, inventory valuation, and financial reports at this site. Can differ from tenant default for multi-national operations. If NULL, inherits from tenant currency';
COMMENT ON COLUMN sites.language IS 'Default UI language code (ISO 639-1) for site users. Site workers may prefer different language than tenant default. Users can override in personal preferences. If NULL, inherits from tenant language';
COMMENT ON COLUMN sites.date_format IS 'Date display format preference for this site. Regional conventions vary (US: MM/DD/YYYY, Thailand: DD/MM/YYYY). Critical for work order due dates to avoid confusion. If NULL, inherits from tenant date_format';
COMMENT ON COLUMN sites.status IS 'Site operational status. Values: active (normal operations), inactive (permanently closed, data archived), maintenance (temporarily offline)';
COMMENT ON COLUMN sites.settings IS 'Flexible JSON storage for site-specific configurations without schema changes. Common uses: workflow customizations, notification preferences, integration keys, feature flags, custom approval processes';
COMMENT ON COLUMN sites.created_at IS 'Timestamp when site was created. Never modified after initial creation. Required for compliance, audit trails, and historical reporting';
COMMENT ON COLUMN sites.updated_at IS 'Timestamp of last modification. Auto-updated via database trigger on any column change. Useful for sync operations and debugging';
COMMENT ON COLUMN sites.created_by IS 'User ID of Tenant Admin or Site Manager who created this site. NULL for system-seeded records. Required for SOX compliance and security audits';
COMMENT ON COLUMN sites.updated_by IS 'User ID who last modified this site record. Tracks all changes for audit trail. Required for 100% audit trail coverage for safety and regulatory compliance';

-- ============================================================================
-- SEED DATA (Optional: Demo site for development)
-- ============================================================================

-- Uncomment below to seed a demo site for development/testing
-- Note: Replace 'TENANT-UUID-HERE' with actual tenant UUID from tenants table
/*
INSERT INTO sites (
    tenant_id,
    code,
    name,
    site_type,
    criticality,
    address_line1,
    city,
    country,
    timezone,
    currency,
    language,
    license_allocation
) VALUES (
    'TENANT-UUID-HERE',
    'SITE-001',
    'Demo Manufacturing Plant',
    'factory',
    'critical',
    '123 Industrial Road',
    'Bangkok',
    'Thailand',
    'Asia/Bangkok',
    'THB',
    'th',
    50
);
*/

