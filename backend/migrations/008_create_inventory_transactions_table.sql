-- Migration: 008_create_inventory_transactions_table.sql
-- Description: Create the inventory_transactions table for tracking all inventory stock movements
-- Created: 2024-11-27
-- Author: Eureka CMMS Team

-- ============================================================================
-- INVENTORY TRANSACTIONS TABLE
-- Core table for tracking all inventory stock movements with full audit trail.
-- Supports goods receipts, parts issuance, returns, adjustments, transfers,
-- reservations, and cycle counts. Provides 100% audit trail coverage for
-- compliance and demand forecasting.
-- ============================================================================

-- Create enum types for constrained fields
CREATE TYPE transaction_type AS ENUM (
    'receive',           -- Goods receipt from supplier (+quantity_on_hand)
    'issue',             -- Parts issued to work order (-quantity_on_hand, -quantity_reserved)
    'return',            -- Parts returned from work order (+quantity_on_hand)
    'adjust_add',        -- Manual adjustment (add stock) (+quantity_on_hand)
    'adjust_remove',     -- Manual adjustment (remove stock) (-quantity_on_hand)
    'transfer_out',      -- Transfer to another warehouse/site (-quantity_on_hand)
    'transfer_in',       -- Transfer from another warehouse/site (+quantity_on_hand)
    'reserve',           -- Reserve for work order (+quantity_reserved)
    'release',           -- Release reservation (-quantity_reserved)
    'cycle_count'        -- Cycle count adjustment (+/- quantity_on_hand)
);

CREATE TYPE transaction_status AS ENUM ('pending', 'approved', 'completed', 'canceled');

-- Create the inventory_transactions table
CREATE TABLE inventory_transactions (
    -- ========================================================================
    -- CORE IDENTIFICATION
    -- ========================================================================
    
    -- Unique identifier for the transaction. Used as foreign key reference
    -- in related tables and for linking related transactions (e.g., transfer pairs)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to the parent tenant. All transactions belong to a tenant
    -- for multi-tenant data isolation. Queries filter by tenant_id for security
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Foreign key to the site where this transaction occurs. All transactions
    -- belong to a specific site. PRD: "Each site operates independently with
    -- its own assets, work orders, and inventory"
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    
    -- Foreign key to inventory_parts table. Links transaction to the part
    -- being transacted. Required for all transaction types
    part_id UUID NOT NULL REFERENCES inventory_parts(id) ON DELETE CASCADE,
    
    -- Type of transaction determines stock effect and workflow. PRD: "Record
    -- parts issued and returned to stock" and "Perform stock adjustments and transfers"
    transaction_type transaction_type NOT NULL,
    
    -- Transaction quantity (always positive). The direction of stock effect
    -- is determined by transaction_type. PRD: "Record parts issued and returned
    -- to stock" - quantity tracks how much was issued/returned
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    
    -- Unit cost at the time of transaction. Used for cost calculations and
    -- inventory valuation. For receive transactions, this is the purchase price.
    -- For issue transactions, this is typically the average_cost or FIFO cost.
    -- PRD: "Track part usage history for demand forecasting"
    unit_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
    
    -- Total transaction value (quantity × unit_cost). Calculated automatically
    -- or manually entered. Used for cost reporting and financial analysis.
    -- PRD: "Approve work completion and review labor/material costs"
    total_value DECIMAL(12, 2) NOT NULL DEFAULT 0,

    -- ========================================================================
    -- REFERENCES
    -- ========================================================================
    
    -- Foreign key to work_orders table. Links transaction to work order for
    -- issue, return, reserve, and release transactions. NULL for transactions
    -- not related to work orders (receive, adjust, transfer). PRD: "Record
    -- parts issued and returned to stock" - links to work orders
    work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
    
    -- Foreign key to purchase_orders table. Links transaction to purchase
    -- order for receive transactions. NULL for non-receive transactions.
    -- Note: FK constraint will be added in future migration when purchase_orders table exists
    purchase_order_id UUID,
    
    -- Foreign key to inventory_transactions table (self-reference). Links
    -- related transactions (e.g., transfer_out and transfer_in form a pair).
    -- Used for tracking transfer pairs and transaction reversals. NULL for
    -- standalone transactions
    related_transaction_id UUID REFERENCES inventory_transactions(id) ON DELETE SET NULL,
    
    -- External reference number (e.g., "PO-12345", "WO-00001", "ADJ-001").
    -- Used for linking to external documents and reports. PRD: "Record parts
    -- issued and returned to stock" - reference to work order number
    reference_number VARCHAR(50),

    -- ========================================================================
    -- LOCATION TRACKING
    -- ========================================================================
    
    -- Source warehouse name for the transaction. For issue/transfer_out, this
    -- is where parts are taken from. For receive/transfer_in, this may be
    -- the origin warehouse. PRD: "Manage multi-warehouse inventory with bin
    -- location tracking"
    source_warehouse VARCHAR(100),
    
    -- Source bin location within the warehouse. Used for physical location
    -- tracking and cycle count sheets. PRD: "Conduct cycle counts and stock
    -- audits using mobile barcode scanning"
    source_bin VARCHAR(50),
    
    -- Destination warehouse name for transfers. Used for transfer_out and
    -- transfer_in transactions to track where parts are moving to/from.
    -- PRD: "Perform stock adjustments and transfers"
    destination_warehouse VARCHAR(100),
    
    -- Destination bin location within the destination warehouse. Used for
    -- transfer transactions to track final location
    destination_bin VARCHAR(50),

    -- ========================================================================
    -- TRANSACTION DETAILS
    -- ========================================================================
    
    -- Reason or notes for the transaction. Required for adjustments and
    -- transfers. Used for audit trail and compliance. PRD: "Achieve 100%
    -- audit trail coverage for safety and regulatory compliance"
    reason TEXT,
    
    -- Transaction status determines workflow stage and whether stock has
    -- been updated. PRD: "Approve inventory transactions and adjustments"
    -- pending: Transaction created, awaiting approval
    -- approved: Transaction approved, ready to execute
    -- completed: Transaction executed, stock updated
    -- canceled: Transaction canceled, no stock effect
    status transaction_status NOT NULL DEFAULT 'pending',
    
    -- User ID who approved this transaction. NULL until transaction is approved.
    -- Required for approval workflow. PRD: "Approve inventory transactions
    -- and adjustments". Note: FK constraint added after users table is created
    approved_by UUID,
    
    -- Timestamp when transaction was approved. NULL until transaction is approved.
    -- Used for approval workflow tracking and reporting
    approved_at TIMESTAMPTZ,

    -- ========================================================================
    -- AUDIT TRAIL
    -- ========================================================================
    
    -- Timestamp when transaction was created. Never modified after initial
    -- creation. Required for compliance, audit trails, and historical reporting.
    -- PRD: "Achieve 100% audit trail coverage for safety and regulatory compliance"
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Timestamp of last modification. Auto-updated via database trigger on any
    -- column change. Useful for sync operations and debugging
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- User ID who created this transaction. NULL for system-generated transactions.
    -- Required for SOX compliance and security audits. PRD: "Record parts issued
    -- and returned to stock" - tracks who performed the action. Note: FK constraint
    -- added after users table is created
    created_by UUID,
    
    -- User ID who last modified this transaction. Tracks all changes for audit
    -- trail. Critical for investigating unauthorized modifications. Note: FK
    -- constraint added after users table is created
    updated_by UUID,

    -- ========================================================================
    -- CONSTRAINTS
    -- ========================================================================
    
    -- Ensure transaction cannot be its own related transaction (prevent circular references)
    CONSTRAINT chk_no_self_related CHECK (related_transaction_id IS NULL OR related_transaction_id != id),
    
    -- Ensure all cost values are non-negative
    CONSTRAINT chk_unit_cost_positive CHECK (unit_cost >= 0),
    CONSTRAINT chk_total_value_positive CHECK (total_value >= 0),
    
    -- Ensure approved_at is set when approved_by is set (logical consistency)
    CONSTRAINT chk_approval_consistency CHECK (
        (approved_by IS NULL AND approved_at IS NULL) OR
        (approved_by IS NOT NULL AND approved_at IS NOT NULL)
    )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Most common query: Get all transactions for a tenant. Critical for
-- multi-tenant data isolation and performance
CREATE INDEX idx_inventory_transactions_tenant_id ON inventory_transactions(tenant_id);

-- Get all transactions for a specific site. Used for site-level transaction
-- history and reporting
CREATE INDEX idx_inventory_transactions_site_id ON inventory_transactions(site_id);

-- Get all transactions for a specific part. Used for part usage history,
-- demand forecasting, and audit trail. PRD: "Track part usage history for
-- demand forecasting"
CREATE INDEX idx_inventory_transactions_part_id ON inventory_transactions(part_id);

-- Get all transactions for a specific work order. Used for work order parts
-- history and cost tracking. PRD: "Record parts issued and returned to stock"
CREATE INDEX idx_inventory_transactions_work_order_id ON inventory_transactions(work_order_id) 
    WHERE work_order_id IS NOT NULL;

-- Filter transactions by type for type-based reporting and filtering
CREATE INDEX idx_inventory_transactions_transaction_type ON inventory_transactions(transaction_type);

-- Filter transactions by status for approval workflow and pending transaction queries
CREATE INDEX idx_inventory_transactions_status ON inventory_transactions(status);

-- Find pending transactions requiring approval. Used for approval workflow
-- dashboards. PRD: "Approve inventory transactions and adjustments"
CREATE INDEX idx_inventory_transactions_pending_approval ON inventory_transactions(site_id, status) 
    WHERE status = 'pending';

-- Get transactions by date range for reporting and audit trail queries
CREATE INDEX idx_inventory_transactions_created_at ON inventory_transactions(created_at);

-- Composite index for common query: Get part transactions by type and date
CREATE INDEX idx_inventory_transactions_part_type_date ON inventory_transactions(part_id, transaction_type, created_at);

-- Composite index for work order parts history
CREATE INDEX idx_inventory_transactions_work_order_type ON inventory_transactions(work_order_id, transaction_type) 
    WHERE work_order_id IS NOT NULL;

-- Find related transactions (for transfer pairs and reversals)
CREATE INDEX idx_inventory_transactions_related ON inventory_transactions(related_transaction_id) 
    WHERE related_transaction_id IS NOT NULL;

-- Find transactions by reference number for external document linking
CREATE INDEX idx_inventory_transactions_reference_number ON inventory_transactions(reference_number) 
    WHERE reference_number IS NOT NULL;

-- Find transactions by approver for approval workflow tracking
CREATE INDEX idx_inventory_transactions_approved_by ON inventory_transactions(approved_by) 
    WHERE approved_by IS NOT NULL;

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_inventory_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_transactions_updated_at
    BEFORE UPDATE ON inventory_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_transactions_updated_at();

-- ============================================================================
-- TRIGGER: Auto-calculate total_value
-- ============================================================================

-- Automatically calculate total_value when quantity or unit_cost changes.
-- Ensures data consistency and reduces calculation errors.
CREATE OR REPLACE FUNCTION calculate_inventory_transactions_total_value()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_value = NEW.quantity * NEW.unit_cost;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_transactions_calculate_total
    BEFORE INSERT OR UPDATE ON inventory_transactions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_inventory_transactions_total_value();

-- ============================================================================
-- COMMENTS (Database-level documentation)
-- ============================================================================

COMMENT ON TABLE inventory_transactions IS 'Tracks all inventory stock movements with full audit trail. Supports goods receipts, parts issuance, returns, adjustments, transfers, reservations, and cycle counts. Provides 100% audit trail coverage.';

COMMENT ON COLUMN inventory_transactions.id IS 'Unique identifier for the transaction. Used as foreign key reference in related tables and for linking related transactions';
COMMENT ON COLUMN inventory_transactions.tenant_id IS 'Foreign key to the parent tenant. All transactions belong to a tenant for multi-tenant data isolation. Queries filter by tenant_id for security';
COMMENT ON COLUMN inventory_transactions.site_id IS 'Foreign key to the site where this transaction occurs. All transactions belong to a specific site. Each site operates independently with its own inventory';
COMMENT ON COLUMN inventory_transactions.part_id IS 'Foreign key to inventory_parts table. Links transaction to the part being transacted. Required for all transaction types';
COMMENT ON COLUMN inventory_transactions.transaction_type IS 'Type of transaction determines stock effect and workflow. Values: receive, issue, return, adjust_add, adjust_remove, transfer_out, transfer_in, reserve, release, cycle_count';
COMMENT ON COLUMN inventory_transactions.quantity IS 'Transaction quantity (always positive). The direction of stock effect is determined by transaction_type';
COMMENT ON COLUMN inventory_transactions.unit_cost IS 'Unit cost at the time of transaction. Used for cost calculations and inventory valuation';
COMMENT ON COLUMN inventory_transactions.total_value IS 'Total transaction value (quantity × unit_cost). Calculated automatically. Used for cost reporting and financial analysis';
COMMENT ON COLUMN inventory_transactions.work_order_id IS 'Foreign key to work_orders table. Links transaction to work order for issue, return, reserve, and release transactions';
COMMENT ON COLUMN inventory_transactions.purchase_order_id IS 'Foreign key to purchase_orders table. Links transaction to purchase order for receive transactions';
COMMENT ON COLUMN inventory_transactions.related_transaction_id IS 'Foreign key to inventory_transactions table (self-reference). Links related transactions (e.g., transfer pairs)';
COMMENT ON COLUMN inventory_transactions.reference_number IS 'External reference number (e.g., "PO-12345", "WO-00001"). Used for linking to external documents and reports';
COMMENT ON COLUMN inventory_transactions.source_warehouse IS 'Source warehouse name for the transaction. For issue/transfer_out, this is where parts are taken from';
COMMENT ON COLUMN inventory_transactions.source_bin IS 'Source bin location within the warehouse. Used for physical location tracking and cycle counts';
COMMENT ON COLUMN inventory_transactions.destination_warehouse IS 'Destination warehouse name for transfers. Used for transfer_out and transfer_in transactions';
COMMENT ON COLUMN inventory_transactions.destination_bin IS 'Destination bin location within the destination warehouse. Used for transfer transactions';
COMMENT ON COLUMN inventory_transactions.reason IS 'Reason or notes for the transaction. Required for adjustments and transfers. Used for audit trail and compliance';
COMMENT ON COLUMN inventory_transactions.status IS 'Transaction status determines workflow stage and whether stock has been updated. Values: pending, approved, completed, canceled';
COMMENT ON COLUMN inventory_transactions.approved_by IS 'User ID who approved this transaction. NULL until transaction is approved. Required for approval workflow';
COMMENT ON COLUMN inventory_transactions.approved_at IS 'Timestamp when transaction was approved. NULL until transaction is approved. Used for approval workflow tracking';
COMMENT ON COLUMN inventory_transactions.created_at IS 'Timestamp when transaction was created. Never modified after initial creation. Required for compliance, audit trails, and historical reporting';
COMMENT ON COLUMN inventory_transactions.updated_at IS 'Timestamp of last modification. Auto-updated via database trigger on any column change. Useful for sync operations and debugging';
COMMENT ON COLUMN inventory_transactions.created_by IS 'User ID who created this transaction. NULL for system-generated transactions. Required for SOX compliance and security audits';
COMMENT ON COLUMN inventory_transactions.updated_by IS 'User ID who last modified this transaction. Tracks all changes for audit trail. Critical for investigating unauthorized modifications';

-- ============================================================================
-- SEED DATA (Optional: Demo transaction for development)
-- ============================================================================

-- Uncomment below to seed a demo inventory transaction for development/testing
-- Note: Replace 'TENANT-UUID-HERE', 'SITE-UUID-HERE', 'PART-UUID-HERE', 'WO-UUID-HERE', 'USER-UUID-HERE' with actual UUIDs
/*
INSERT INTO inventory_transactions (
    tenant_id,
    site_id,
    part_id,
    transaction_type,
    quantity,
    unit_cost,
    work_order_id,
    reference_number,
    source_warehouse,
    source_bin,
    reason,
    status,
    created_by
) VALUES (
    'TENANT-UUID-HERE',
    'SITE-UUID-HERE',
    'PART-UUID-HERE',
    'issue',
    2,
    15.50,
    'WO-UUID-HERE',
    'WO-00001',
    'Main Warehouse',
    'A-12-3',
    'Parts issued for conveyor belt motor repair',
    'completed',
    'USER-UUID-HERE'
);
*/

