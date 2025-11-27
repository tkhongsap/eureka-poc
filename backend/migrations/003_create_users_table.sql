-- Migration: 003_create_users_table.sql
-- Description: Create the users table for user management and authentication
-- Created: 2024-11-27
-- Author: Eureka CMMS Team

-- ============================================================================
-- USERS TABLE
-- Represents all users of the Eureka CMMS platform across all tenants and sites.
-- Each user has a role that determines their permissions and data access scope.
-- Users belong to a tenant (except super_admin) and optionally to a specific site.
-- ============================================================================

-- Create enum types for constrained fields
CREATE TYPE user_role AS ENUM (
    'super_admin',
    'tenant_admin',
    'tenant_config_manager',
    'site_manager',
    'site_store_manager',
    'technician',
    'tenant_eoc',
    'tenant_spare_part_center'
);

CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deactivated');

-- Create the users table
CREATE TABLE users (
    -- ========================================================================
    -- CORE IDENTIFICATION
    -- ========================================================================
    
    -- Unique identifier for the user. Used as foreign key reference in
    -- work_orders.assigned_to, audit trails (created_by, updated_by), and
    -- other user-scoped relationships. UUID prevents ID collision across
    -- distributed systems and hides sequential ordering for security
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Human-readable user code (e.g., USR-001). Auto-generated on creation.
    -- Used in UI, reports, support tickets, and user references. Follows
    -- the pattern from tenants (TNT-XXX) and sites (SITE-XXX). Must be unique
    -- within a tenant (same code can exist in different tenants)
    code VARCHAR(20) NOT NULL,
    
    -- Primary login credential. Used for authentication, password reset,
    -- system notifications, and email alerts. Must be globally unique across
    -- all tenants to prevent login conflicts. Validated for proper email format
    email VARCHAR(255) NOT NULL UNIQUE,
    
    -- Hashed password using bcrypt or argon2. Never stores plain text passwords.
    -- Used for PASETO/JWT authentication in Phase 1. Password hashing is
    -- performed by the application layer before storage
    password_hash VARCHAR(255) NOT NULL,

    -- ========================================================================
    -- PROFILE INFORMATION
    -- ========================================================================
    
    -- User's first name. Displayed in UI greetings ("Hello, John"), work order
    -- assignments, reports, and user listings. Stored separately from last_name
    -- for proper sorting and internationalization (some cultures show last name first)
    first_name VARCHAR(100) NOT NULL,
    
    -- User's last name. Required for formal reports, compliance documents,
    -- and proper name display in different cultures. Used alongside first_name
    -- for full name construction
    last_name VARCHAR(100) NOT NULL,
    
    -- Cached full display name for efficient queries. Computed from first_name
    -- and last_name but can be overridden to support nicknames or preferred names.
    -- Avoids concatenating first+last on every display operation. Updated
    -- automatically when first_name or last_name changes
    display_name VARCHAR(255) NOT NULL,
    
    -- Contact phone number. Critical for operations: emergency dispatch, work order
    -- assignments, Enterprise Operations Center (EOC) coordination with external
    -- agencies (fire department, ambulance, police). Include country code
    -- (e.g., +66-2-xxx-xxxx) for international operations
    phone VARCHAR(50),
    
    -- URL to user's profile image (stored in MinIO/S3). Displayed in work order
    -- cards, Kanban board, comments, and user assignments. PRD emphasizes modern
    -- consumer-grade UI with "assigned technician avatar" in work order cards
    avatar_url VARCHAR(500),
    
    -- Employee identifier from HR/ERP systems. Links CMMS user identity to
    -- corporate identity. PRD mentions: "Register as a mobile app user using
    -- my employee credentials" - this field bridges the two systems. Used for
    -- integration with external HR systems and employee directory lookups
    employee_id VARCHAR(50),
    
    -- User's job title or position. Provides role context in UI and helps
    -- Site Managers make informed work order assignments. A "Senior Maintenance
    -- Technician" vs "Junior Technician" helps with skill-based task allocation.
    -- Also useful for reports, compliance, and organizational charts
    job_title VARCHAR(100),

    -- ========================================================================
    -- ROLE & MULTI-TENANT ASSIGNMENT
    -- ========================================================================
    
    -- User's role determines what actions they can perform and what data they
    -- can access. Maps directly to the permission matrix in workflow-implementation.md.
    -- Each role has distinct permissions: Super Admin can onboard tenants,
    -- Technician can only update assigned work orders, etc. Single role per user
    -- in Phase 1 (multi-role support can be added in Phase 2 via junction table)
    role user_role NOT NULL,
    
    -- Foreign key to the parent tenant. Required for all users except super_admin
    -- (platform-level role). All queries filter by tenant_id for multi-tenant
    -- data isolation and security. Tenant Admin, EOC, and Spare Part Center
    -- roles work at tenant level (across all sites). Site-level roles (Technician,
    -- Site Manager) also require tenant_id for proper data scoping
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Foreign key to the assigned site. Required for site-level roles:
    -- technician, site_manager, site_store_manager. These users operate within
    -- a specific site and their data access is scoped to that site. NULL for
    -- tenant-level roles (tenant_admin, tenant_eoc, tenant_spare_part_center)
    -- and platform-level roles (super_admin). PRD: "Each site operates
    -- independently with its own assets, work orders, and inventory"
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,

    -- ========================================================================
    -- SYSTEM & STATUS MANAGEMENT
    -- ========================================================================
    
    -- User account status. Controls access to the platform.
    -- active: Normal operation, user can login and perform actions
    -- suspended: Temporary block (e.g., payment issues, investigation), data
    --            preserved but login disabled. Used for license reclamation
    --            without data loss
    -- deactivated: Permanent removal, account cannot login. Data preserved for
    --              compliance and audit history. Used when employee leaves company
    status user_status NOT NULL DEFAULT 'active',
    
    -- Timestamp of last successful login. Used for security audits, identifying
    -- inactive accounts for license reclamation, and detecting dormant accounts.
    -- PRD mentions "Allocate licenses to active users" - this field helps
    -- determine which accounts are truly active. NULL if user has never logged in
    last_login_at TIMESTAMPTZ,
    
    -- Flexible JSON storage for user preferences without schema changes.
    -- Common uses: theme preference (light/dark), language override (ISO 639-1),
    -- notification preferences (email, SMS, in-app), default Kanban board filters,
    -- saved board views, dashboard layout preferences. PRD mentions "Language selector,
    -- Theme toggle" in user menu - these preferences are stored here. Updated
    -- when user changes settings in their profile
    settings JSONB NOT NULL DEFAULT '{}',

    -- ========================================================================
    -- AUDIT TRAIL
    -- ========================================================================
    
    -- Timestamp when user account was created. Never modified after initial
    -- creation. Required for compliance, audit trails, and historical reporting.
    -- Used to track user onboarding timeline and account age
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Timestamp of last modification to user record. Auto-updated via database
    -- trigger on any column change. Useful for sync operations, debugging, and
    -- identifying when user profiles were last updated
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- User ID of the admin who created this user account. NULL for system-seeded
    -- records (e.g., initial super_admin). Required for SOX compliance and
    -- security audits. Tracks accountability: which admin onboarded this user?
    -- Note: FK constraint added after users table is created (self-reference)
    created_by UUID,
    
    -- User ID who last modified this user record. Tracks all changes for audit
    -- trail. Critical when investigating unauthorized role changes or profile
    -- modifications. From PRD: "Achieve 100% audit trail coverage for safety
    -- and regulatory compliance". Note: FK constraint added after users table
    -- is created (self-reference)
    updated_by UUID,

    -- ========================================================================
    -- CONSTRAINTS
    -- ========================================================================
    
    -- Ensure user code is unique within a tenant (same code can exist in
    -- different tenants, but not within the same tenant)
    CONSTRAINT uq_users_tenant_code UNIQUE (tenant_id, code),
    
    -- Ensure site-level roles have a site_id assigned. Site-level roles are:
    -- technician, site_manager, site_store_manager
    CONSTRAINT chk_site_level_role_has_site CHECK (
        (role IN ('technician', 'site_manager', 'site_store_manager') AND site_id IS NOT NULL) OR
        (role NOT IN ('technician', 'site_manager', 'site_store_manager'))
    ),
    
    -- Ensure tenant-level roles have tenant_id but no site_id. Tenant-level
    -- roles are: tenant_admin, tenant_config_manager, tenant_eoc,
    -- tenant_spare_part_center
    CONSTRAINT chk_tenant_level_role_has_tenant CHECK (
        (role IN ('tenant_admin', 'tenant_config_manager', 'tenant_eoc', 'tenant_spare_part_center') 
         AND tenant_id IS NOT NULL AND site_id IS NULL) OR
        (role NOT IN ('tenant_admin', 'tenant_config_manager', 'tenant_eoc', 'tenant_spare_part_center'))
    ),
    
    -- Ensure super_admin has no tenant_id or site_id (platform-level role)
    CONSTRAINT chk_super_admin_no_tenant CHECK (
        (role = 'super_admin' AND tenant_id IS NULL AND site_id IS NULL) OR
        (role != 'super_admin')
    ),
    
    -- Validate email format using regex pattern. Ensures proper email structure
    -- before allowing account creation. Basic validation - application layer
    -- should perform more thorough validation
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Most common query: Get all users for a tenant. Critical for multi-tenant
-- data isolation and performance. Used in user management, license counting,
-- and tenant-scoped user listings
CREATE INDEX idx_users_tenant_id ON users(tenant_id) WHERE tenant_id IS NOT NULL;

-- Get all users for a specific site. Used for site-scoped user management,
-- technician listings, and site-level dashboards
CREATE INDEX idx_users_site_id ON users(site_id) WHERE site_id IS NOT NULL;

-- Filter users by role. Used for role-based queries (e.g., "get all technicians",
-- "get all site managers"), permission checks, and role-based dashboards
CREATE INDEX idx_users_role ON users(role);

-- Filter active users (most common query pattern for dashboards, assignments,
-- and license counting). Excludes suspended and deactivated accounts
CREATE INDEX idx_users_status ON users(status);

-- Composite index for common query: Get active users by role within a tenant.
-- Used for tenant admin dashboards and user management interfaces
CREATE INDEX idx_users_tenant_role_status ON users(tenant_id, role, status) 
    WHERE tenant_id IS NOT NULL AND status = 'active';

-- Composite index for site-level queries: Get active technicians at a site.
-- Used for work order assignment and site manager dashboards
CREATE INDEX idx_users_site_role_status ON users(site_id, role, status) 
    WHERE site_id IS NOT NULL AND status = 'active';

-- Login lookup by email (unique constraint creates implicit index, but explicit
-- index for documentation and potential partial index optimizations)
CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS (Self-references for audit trail)
-- ============================================================================

-- Add foreign key constraints for created_by and updated_by after table creation
-- to allow self-referencing. These constraints ensure referential integrity
-- for audit trail fields
ALTER TABLE users
    ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) 
        REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) 
        REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- COMMENTS (Database-level documentation)
-- ============================================================================

COMMENT ON TABLE users IS 'All users of the Eureka CMMS platform across all tenants and sites. Each user has a role determining permissions and data access scope.';

COMMENT ON COLUMN users.id IS 'Unique identifier for the user. Used as foreign key reference in work_orders.assigned_to, audit trails, and other user-scoped relationships';
COMMENT ON COLUMN users.code IS 'Human-readable user code (e.g., USR-001). Auto-generated on creation. Used in UI, reports, support tickets. Unique within tenant';
COMMENT ON COLUMN users.email IS 'Primary login credential. Used for authentication, password reset, system notifications. Globally unique across all tenants';
COMMENT ON COLUMN users.password_hash IS 'Hashed password using bcrypt or argon2. Never stores plain text. Used for PASETO/JWT authentication in Phase 1';
COMMENT ON COLUMN users.first_name IS 'User''s first name. Displayed in UI greetings, work order assignments, reports. Stored separately for proper sorting and i18n';
COMMENT ON COLUMN users.last_name IS 'User''s last name. Required for formal reports, compliance documents, and proper name display in different cultures';
COMMENT ON COLUMN users.display_name IS 'Cached full display name for efficient queries. Computed from first_name and last_name but can be overridden for nicknames';
COMMENT ON COLUMN users.phone IS 'Contact phone number. Critical for emergency dispatch, work order assignments, EOC coordination. Include country code';
COMMENT ON COLUMN users.avatar_url IS 'URL to user''s profile image (stored in MinIO/S3). Displayed in work order cards, Kanban board, comments, assignments';
COMMENT ON COLUMN users.employee_id IS 'Employee identifier from HR/ERP systems. Links CMMS user identity to corporate identity for integration';
COMMENT ON COLUMN users.job_title IS 'User''s job title or position. Provides role context in UI and helps Site Managers with work order assignments';
COMMENT ON COLUMN users.role IS 'User''s role determines actions and data access. Maps to permission matrix. Single role per user in Phase 1';
COMMENT ON COLUMN users.tenant_id IS 'Foreign key to parent tenant. Required for all users except super_admin. Used for multi-tenant data isolation';
COMMENT ON COLUMN users.site_id IS 'Foreign key to assigned site. Required for site-level roles (technician, site_manager, site_store_manager). NULL for tenant-level roles';
COMMENT ON COLUMN users.status IS 'User account status. Values: active (normal operation), suspended (temporary block), deactivated (permanent removal)';
COMMENT ON COLUMN users.last_login_at IS 'Timestamp of last successful login. Used for security audits, identifying inactive accounts, license reclamation';
COMMENT ON COLUMN users.settings IS 'Flexible JSON storage for user preferences: theme, language, notifications, filters, dashboard layout';
COMMENT ON COLUMN users.created_at IS 'Timestamp when user account was created. Never modified after initial creation. Required for compliance and audit trails';
COMMENT ON COLUMN users.updated_at IS 'Timestamp of last modification. Auto-updated via database trigger on any column change';
COMMENT ON COLUMN users.created_by IS 'User ID of admin who created this user account. NULL for system-seeded records. Required for SOX compliance';
COMMENT ON COLUMN users.updated_by IS 'User ID who last modified this user record. Tracks all changes for audit trail and security investigations';

-- ============================================================================
-- SEED DATA (Optional: Demo user for development)
-- ============================================================================

-- Uncomment below to seed a demo user for development/testing
-- Note: Replace 'TENANT-UUID-HERE' and 'SITE-UUID-HERE' with actual UUIDs
-- Password hash below is for 'password123' using bcrypt - CHANGE IN PRODUCTION!
/*
INSERT INTO users (
    code,
    email,
    password_hash,
    first_name,
    last_name,
    display_name,
    phone,
    role,
    tenant_id,
    site_id,
    status
) VALUES (
    'USR-001',
    'admin@demo.eureka-cmms.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqJ5q5q5q5',  -- password123
    'Demo',
    'Admin',
    'Demo Admin',
    '+66-2-123-4567',
    'tenant_admin',
    'TENANT-UUID-HERE',
    NULL,
    'active'
);
*/

