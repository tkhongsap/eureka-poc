-- Migration: 004_add_user_fk_constraints.sql
-- Description: Add foreign key constraints for created_by/updated_by columns
--              in tenants and sites tables referencing users table
-- Created: 2024-11-27
-- Author: Eureka CMMS Team

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS FOR AUDIT TRAIL
-- ============================================================================
-- This migration adds foreign key constraints to the created_by and updated_by
-- columns in tenants and sites tables. These constraints were deferred until
-- after the users table was created to avoid circular dependencies.
--
-- These constraints ensure referential integrity for audit trail fields and
-- enable database-level enforcement of valid user references.
-- ============================================================================

-- Add foreign key constraints to tenants table
ALTER TABLE tenants
    ADD CONSTRAINT fk_tenants_created_by FOREIGN KEY (created_by) 
        REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_tenants_updated_by FOREIGN KEY (updated_by) 
        REFERENCES users(id) ON DELETE SET NULL;

-- Add foreign key constraints to sites table
ALTER TABLE sites
    ADD CONSTRAINT fk_sites_created_by FOREIGN KEY (created_by) 
        REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_sites_updated_by FOREIGN KEY (updated_by) 
        REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- COMMENTS (Update existing column comments to reflect FK constraints)
-- ============================================================================

COMMENT ON COLUMN tenants.created_by IS 'User ID of Super Admin who created this tenant. NULL for system-seeded records. Foreign key to users.id';
COMMENT ON COLUMN tenants.updated_by IS 'User ID who last modified this tenant record. Foreign key to users.id';
COMMENT ON COLUMN sites.created_by IS 'User ID of Tenant Admin or Site Manager who created this site. NULL for system-seeded records. Foreign key to users.id';
COMMENT ON COLUMN sites.updated_by IS 'User ID who last modified this site record. Foreign key to users.id';

