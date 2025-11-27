-- Migration: 001_create_tenants_table.sql
-- Description: Create the tenants table for multi-tenant architecture
-- Created: 2024-11-27
-- Author: Eureka CMMS Team

-- ============================================================================
-- TENANTS TABLE
-- Foundation table for multi-tenant SaaS architecture. Each tenant represents
-- an organization (company) that uses the Eureka CMMS platform.
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types for constrained fields
CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'deactivated');
CREATE TYPE subscription_plan AS ENUM ('starter', 'professional', 'enterprise');

-- Create the tenants table
CREATE TABLE tenants (
    -- ========================================================================
    -- CORE IDENTIFICATION
    -- ========================================================================
    
    -- Unique identifier for the tenant. Used as foreign key reference in all 
    -- tenant-scoped tables (sites, users, work_orders, etc.)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Human-readable tenant code (e.g., TNT-001). Auto-generated on creation.
    -- Used in UI, reports, and support communications
    code VARCHAR(20) NOT NULL UNIQUE,
    
    -- Official organization name displayed throughout the application 
    -- (e.g., "Acme Manufacturing Corp")
    name VARCHAR(255) NOT NULL,

    -- ========================================================================
    -- BUSINESS & LEGAL INFORMATION
    -- ========================================================================
    
    -- Legal company registration or tax ID number. Required for invoicing 
    -- and compliance in many jurisdictions
    company_registration_number VARCHAR(100),
    
    -- Name of the primary contact person responsible for the tenant account
    primary_contact_name VARCHAR(255),
    
    -- Email address for billing notifications, system alerts, and account 
    -- management communications
    primary_contact_email VARCHAR(255) NOT NULL,
    
    -- Phone number for urgent support escalations. Include country code 
    -- (e.g., +66-2-xxx-xxxx)
    primary_contact_phone VARCHAR(50),
    
    -- Full postal address for invoicing and legal correspondence
    billing_address TEXT,

    -- ========================================================================
    -- LICENSING & SUBSCRIPTION
    -- ========================================================================
    
    -- Subscription tier determining feature access and pricing.
    -- Values: starter, professional, enterprise
    subscription_plan subscription_plan NOT NULL DEFAULT 'starter',
    
    -- Total number of user licenses allocated to this tenant by Super Admin
    license_pool INTEGER NOT NULL DEFAULT 0,
    
    -- Current count of active user licenses. Must not exceed license_pool.
    -- Updated automatically on user create/deactivate
    licenses_used INTEGER NOT NULL DEFAULT 0,
    
    -- Subscription effective start date. Used for billing cycle calculations
    contract_start_date DATE,
    
    -- Subscription expiration date. System sends renewal reminders 
    -- 30/7 days before expiry
    contract_end_date DATE,

    -- ========================================================================
    -- REGIONAL CONFIGURATION
    -- ========================================================================
    
    -- Default timezone for the tenant (IANA format, e.g., Asia/Bangkok).
    -- Used for work order scheduling and report timestamps
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    
    -- ISO 4217 currency code for cost calculations, inventory valuation, 
    -- and financial reports
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Default UI language code (ISO 639-1). Users can override in 
    -- personal preferences
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    
    -- Date display format preference. 
    -- Common values: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
    date_format VARCHAR(20) NOT NULL DEFAULT 'YYYY-MM-DD',

    -- ========================================================================
    -- BRANDING
    -- ========================================================================
    
    -- URL to tenant logo image (stored in MinIO/S3). Displayed in 
    -- application header and reports
    logo_url VARCHAR(500),
    
    -- Primary brand color in hex format. Applied to buttons, links, 
    -- and accent elements
    branding_primary_color VARCHAR(7) DEFAULT '#2563EB',
    
    -- Secondary brand color in hex format. Used for hover states and 
    -- secondary UI elements
    branding_secondary_color VARCHAR(7),

    -- ========================================================================
    -- SYSTEM MANAGEMENT
    -- ========================================================================
    
    -- Tenant account status.
    -- Values: active (normal operation), suspended (temporary block, data preserved), 
    -- deactivated (permanent, data archived)
    status tenant_status NOT NULL DEFAULT 'active',
    
    -- Flexible JSON storage for tenant-specific configurations:
    -- feature_flags, notification_preferences, integration_keys, workflow_settings
    settings JSONB NOT NULL DEFAULT '{}',

    -- ========================================================================
    -- AUDIT TRAIL
    -- ========================================================================
    
    -- Timestamp when tenant was onboarded. Never modified after initial creation
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Timestamp of last modification. Auto-updated via database trigger 
    -- on any column change
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- User ID of Super Admin who created this tenant. NULL for system-seeded records
    -- Note: FK constraint added after users table is created
    created_by UUID,
    
    -- User ID who last modified this tenant record
    -- Note: FK constraint added after users table is created
    updated_by UUID,

    -- ========================================================================
    -- CONSTRAINTS
    -- ========================================================================
    
    -- Ensure licenses_used never exceeds license_pool
    CONSTRAINT chk_licenses_not_exceeded CHECK (licenses_used <= license_pool),
    
    -- Ensure license values are non-negative
    CONSTRAINT chk_license_pool_positive CHECK (license_pool >= 0),
    CONSTRAINT chk_licenses_used_positive CHECK (licenses_used >= 0),
    
    -- Ensure contract dates are logical (start before end)
    CONSTRAINT chk_contract_dates CHECK (
        contract_start_date IS NULL OR 
        contract_end_date IS NULL OR 
        contract_start_date <= contract_end_date
    ),
    
    -- Validate hex color format for branding colors
    CONSTRAINT chk_primary_color_format CHECK (
        branding_primary_color IS NULL OR 
        branding_primary_color ~ '^#[0-9A-Fa-f]{6}$'
    ),
    CONSTRAINT chk_secondary_color_format CHECK (
        branding_secondary_color IS NULL OR 
        branding_secondary_color ~ '^#[0-9A-Fa-f]{6}$'
    )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Unique lookup by tenant code (already enforced by UNIQUE constraint, 
-- but explicit index for documentation)
CREATE INDEX idx_tenants_code ON tenants(code);

-- Filter active tenants (most common query pattern)
CREATE INDEX idx_tenants_status ON tenants(status);

-- Reporting and analytics by subscription plan
CREATE INDEX idx_tenants_subscription_plan ON tenants(subscription_plan);

-- Find tenants by primary contact email
CREATE INDEX idx_tenants_primary_contact_email ON tenants(primary_contact_email);

-- Find expiring contracts for renewal notifications
CREATE INDEX idx_tenants_contract_end_date ON tenants(contract_end_date) 
    WHERE contract_end_date IS NOT NULL;

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_tenants_updated_at();

-- ============================================================================
-- COMMENTS (Database-level documentation)
-- ============================================================================

COMMENT ON TABLE tenants IS 'Multi-tenant organizations using Eureka CMMS platform. Each tenant can have multiple sites.';

COMMENT ON COLUMN tenants.id IS 'Unique identifier for the tenant. Used as foreign key reference in all tenant-scoped tables (sites, users, work_orders, etc.)';
COMMENT ON COLUMN tenants.code IS 'Human-readable tenant code (e.g., TNT-001). Auto-generated on creation. Used in UI, reports, and support communications';
COMMENT ON COLUMN tenants.name IS 'Official organization name displayed throughout the application (e.g., "Acme Manufacturing Corp")';
COMMENT ON COLUMN tenants.company_registration_number IS 'Legal company registration or tax ID number. Required for invoicing and compliance in many jurisdictions';
COMMENT ON COLUMN tenants.primary_contact_name IS 'Name of the primary contact person responsible for the tenant account';
COMMENT ON COLUMN tenants.primary_contact_email IS 'Email address for billing notifications, system alerts, and account management communications';
COMMENT ON COLUMN tenants.primary_contact_phone IS 'Phone number for urgent support escalations. Include country code (e.g., +66-2-xxx-xxxx)';
COMMENT ON COLUMN tenants.billing_address IS 'Full postal address for invoicing and legal correspondence';
COMMENT ON COLUMN tenants.subscription_plan IS 'Subscription tier determining feature access and pricing. Values: starter, professional, enterprise';
COMMENT ON COLUMN tenants.license_pool IS 'Total number of user licenses allocated to this tenant by Super Admin';
COMMENT ON COLUMN tenants.licenses_used IS 'Current count of active user licenses. Must not exceed license_pool. Updated automatically on user create/deactivate';
COMMENT ON COLUMN tenants.contract_start_date IS 'Subscription effective start date. Used for billing cycle calculations';
COMMENT ON COLUMN tenants.contract_end_date IS 'Subscription expiration date. System sends renewal reminders 30/7 days before expiry';
COMMENT ON COLUMN tenants.timezone IS 'Default timezone for the tenant (IANA format, e.g., Asia/Bangkok). Used for work order scheduling and report timestamps';
COMMENT ON COLUMN tenants.currency IS 'ISO 4217 currency code for cost calculations, inventory valuation, and financial reports';
COMMENT ON COLUMN tenants.language IS 'Default UI language code (ISO 639-1). Users can override in personal preferences';
COMMENT ON COLUMN tenants.date_format IS 'Date display format preference. Common values: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY';
COMMENT ON COLUMN tenants.logo_url IS 'URL to tenant logo image (stored in MinIO/S3). Displayed in application header and reports';
COMMENT ON COLUMN tenants.branding_primary_color IS 'Primary brand color in hex format. Applied to buttons, links, and accent elements';
COMMENT ON COLUMN tenants.branding_secondary_color IS 'Secondary brand color in hex format. Used for hover states and secondary UI elements';
COMMENT ON COLUMN tenants.status IS 'Tenant account status. Values: active (normal operation), suspended (temporary block, data preserved), deactivated (permanent, data archived)';
COMMENT ON COLUMN tenants.settings IS 'Flexible JSON storage for tenant-specific configurations: feature_flags, notification_preferences, integration_keys, workflow_settings';
COMMENT ON COLUMN tenants.created_at IS 'Timestamp when tenant was onboarded. Never modified after initial creation';
COMMENT ON COLUMN tenants.updated_at IS 'Timestamp of last modification. Auto-updated via database trigger on any column change';
COMMENT ON COLUMN tenants.created_by IS 'User ID of Super Admin who created this tenant. NULL for system-seeded records';
COMMENT ON COLUMN tenants.updated_by IS 'User ID who last modified this tenant record';

-- ============================================================================
-- SEED DATA (Optional: Demo tenant for development)
-- ============================================================================

-- Uncomment below to seed a demo tenant for development/testing
/*
INSERT INTO tenants (
    code,
    name,
    primary_contact_email,
    primary_contact_name,
    subscription_plan,
    license_pool,
    timezone,
    currency,
    language
) VALUES (
    'TNT-001',
    'Demo Manufacturing Co.',
    'admin@demo.eureka-cmms.com',
    'Demo Admin',
    'enterprise',
    100,
    'Asia/Bangkok',
    'THB',
    'th'
);
*/

