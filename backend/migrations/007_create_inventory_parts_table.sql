-- Migration: 007_create_inventory_parts_table.sql
-- Description: Create the inventory_parts table for spare parts catalog and inventory management
-- Created: 2024-11-27
-- Author: Eureka CMMS Team

-- ============================================================================
-- INVENTORY PARTS TABLE
-- Core table for managing spare parts catalog and inventory across all tenants
-- and sites. Supports multi-warehouse inventory, reorder point tracking, BOM
-- linking, supplier information, and stock level management.
-- ============================================================================

-- Create enum types for constrained fields
CREATE TYPE part_type AS ENUM ('spare_part', 'consumable', 'tool', 'raw_material');
CREATE TYPE part_status AS ENUM ('active', 'discontinued', 'obsolete');

-- Create the inventory_parts table
CREATE TABLE inventory_parts (
    -- ========================================================================
    -- CORE IDENTIFICATION
    -- ========================================================================
    
    -- Unique identifier for the inventory part. Used as foreign key reference
    -- in related tables (inventory_transactions, asset_bom_items, etc.)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to the parent tenant. All inventory parts belong to a tenant
    -- for multi-tenant data isolation. Queries filter by tenant_id for security
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Foreign key to the site where this part is stored. All inventory parts
    -- belong to a specific site. PRD: "Each site operates independently with
    -- its own assets, work orders, and inventory"
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    
    -- Human-readable part number (e.g., "PART-12345"). Auto-generated on creation.
    -- Used in UI, reports, QR codes, and support communications. Must be unique
    -- within a site (same code can exist in different sites)
    code VARCHAR(50) NOT NULL,
    
    -- Display name shown throughout the application (e.g., "Ball Bearing 6205-2RS")
    name VARCHAR(255) NOT NULL,
    
    -- Detailed description of the part, its specifications, and usage notes.
    -- Used for parts catalog and technician reference. PRD: "View parts catalog
    -- with images, specifications, and supplier information"
    description TEXT,

    -- ========================================================================
    -- PART CLASSIFICATION
    -- ========================================================================
    
    -- Part category for grouping and reporting (e.g., "Bearings", "Motors",
    -- "Electrical Components"). Used for parts catalog filtering and category-based
    -- inventory management. PRD: "Search parts catalog by part number, description,
    -- or equipment"
    category VARCHAR(100),
    
    -- Type of part determines its role and available workflows.
    -- spare_part: Replacement parts for equipment maintenance
    -- consumable: Items consumed during operations (lubricants, filters)
    -- tool: Tools and instruments used for maintenance
    -- raw_material: Raw materials for manufacturing or repair
    part_type part_type NOT NULL DEFAULT 'spare_part',
    
    -- Unit of measure for quantity tracking (e.g., "pcs", "kg", "L", "m").
    -- Used for stock level calculations and purchase orders. PRD: "Record parts
    -- usage in work orders using mobile app"
    unit_of_measure VARCHAR(20) NOT NULL DEFAULT 'pcs',

    -- ========================================================================
    -- STOCK MANAGEMENT
    -- ========================================================================
    
    -- Current physical stock quantity on hand. Updated when parts are received,
    -- issued, returned, or adjusted. Used for stock level reporting and availability
    -- checks. PRD: "Maintain accurate stock levels across multiple storage locations"
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    
    -- Quantity reserved for specific work orders (pending issuance). Parts are
    -- reserved when technician requests them, and reserved quantity is deducted
    -- from available stock. Released if work order is canceled or parts are not
    -- issued. PRD: "Track parts reserved for specific work orders"
    quantity_reserved INTEGER NOT NULL DEFAULT 0,
    
    -- Calculated available quantity (quantity_on_hand - quantity_reserved).
    -- Used for availability checks before reservation. Updated via database trigger
    -- or application logic. PRD: "View parts availability before starting work"
    quantity_available INTEGER NOT NULL DEFAULT 0,
    
    -- Reorder Point (ROP) threshold. When quantity_available falls below this
    -- value, system generates reorder alerts. PRD: "Receive alerts when stock
    -- reaches reorder points (ROP)" and "Check stock levels against ROP daily"
    reorder_point INTEGER NOT NULL DEFAULT 0,
    
    -- Recommended order quantity when stock falls below reorder_point. Used for
    -- purchase request generation and automated ordering. PRD: "Define ROP and
    -- reorder quantity for each part"
    reorder_quantity INTEGER NOT NULL DEFAULT 0,
    
    -- Minimum safety stock level. System alerts when stock falls below this
    -- critical threshold. Used for emergency reorder scenarios
    minimum_stock INTEGER NOT NULL DEFAULT 0,
    
    -- Maximum storage capacity for this part. Used for inventory optimization
    -- and preventing overstocking. PRD: "Optimize stock distribution across
    -- sites based on usage patterns"
    maximum_stock INTEGER,

    -- ========================================================================
    -- LOCATION TRACKING
    -- ========================================================================
    
    -- Warehouse name where this part is stored. Supports multi-warehouse
    -- inventory management within a site. PRD: "Manage multi-warehouse inventory
    -- with bin location tracking"
    warehouse VARCHAR(100),
    
    -- Bin or shelf location within the warehouse (e.g., "A-12-3" for Aisle 12,
    -- Shelf 3). Used for physical location tracking and cycle count sheets.
    -- PRD: "Conduct cycle counts and stock audits using mobile barcode scanning"
    bin_location VARCHAR(50),

    -- ========================================================================
    -- FINANCIAL INFORMATION
    -- ========================================================================
    
    -- Current unit cost in tenant currency. Used for cost calculations when
    -- parts are issued to work orders. Updated when new stock is received at
    -- different prices. PRD: "Record parts issued and returned to stock"
    unit_cost DECIMAL(12, 2) DEFAULT 0,
    
    -- Weighted average cost calculated from all stock receipts. Used for
    -- inventory valuation and cost reporting. Updated automatically when stock
    -- is received. PRD: "Track part usage history for demand forecasting"
    average_cost DECIMAL(12, 2) DEFAULT 0,
    
    -- ISO 4217 currency code for cost calculations. Inherits from site currency
    -- if not specified. Used for multi-currency operations
    currency VARCHAR(3),

    -- ========================================================================
    -- SUPPLIER INFORMATION
    -- ========================================================================
    
    -- Foreign key to suppliers table. Links part to primary supplier.
    -- NULL for parts without supplier assignment. Note: FK constraint will be
    -- added in future migration when suppliers table exists. PRD: "View parts
    -- catalog with images, specifications, and supplier information"
    supplier_id UUID,
    
    -- Supplier's part number for this item. Used for purchase order creation
    -- and supplier communication. PRD: "Manage supplier performance metrics
    -- (lead time, quality, reliability)"
    supplier_part_number VARCHAR(100),
    
    -- Lead time in days from order placement to receipt. Used for reorder
    -- planning and purchase request scheduling. PRD: "Forecast demand based
    -- on PM schedules and historical usage"
    lead_time_days INTEGER,

    -- ========================================================================
    -- TECHNICAL SPECIFICATIONS
    -- ========================================================================
    
    -- Barcode string for barcode scanning. Used for quick part identification
    -- during cycle counts, stock transactions, and work order parts issuance.
    -- PRD: "Scan barcodes/QR codes/RFID tags for quick part identification"
    barcode VARCHAR(100),
    
    -- QR code string for mobile scanning. Auto-generated on creation or manually
    -- assigned. Technicians scan QR codes to quickly access part information
    -- and add to work orders. PRD: "Scan barcodes/QR codes/RFID tags for quick
    -- part identification"
    qr_code VARCHAR(100) UNIQUE,
    
    -- Flexible JSON storage for technical specifications without schema changes.
    -- Common uses: dimensions, weight, material, certifications, compatibility
    -- information. PRD: "View parts catalog with images, specifications, and
    -- supplier information"
    specifications JSONB NOT NULL DEFAULT '{}',
    
    -- Array of image IDs (stored in MinIO/S3) attached to the part.
    -- Used for visual identification, documentation, and reference. PRD:
    -- "View parts catalog with images, specifications, and supplier information"
    image_ids TEXT[] DEFAULT '{}',

    -- ========================================================================
    -- SYSTEM MANAGEMENT
    -- ========================================================================
    
    -- Part status determines availability and visibility.
    -- active: Part is available for use and appears in parts catalog
    -- discontinued: Part is no longer available from supplier but may still
    --               be in stock (historical data preserved)
    -- obsolete: Part is obsolete and should not be used (replacement parts
    --            should be identified)
    status part_status NOT NULL DEFAULT 'active',
    
    -- Flexible JSON storage for part-specific configurations without schema
    -- changes. Common uses: custom attributes, integration data, workflow
    -- settings, notification preferences. PRD: "Define custom fields and
    -- attributes for assets, work orders, and inventory"
    settings JSONB NOT NULL DEFAULT '{}',

    -- ========================================================================
    -- AUDIT TRAIL
    -- ========================================================================
    
    -- Timestamp when part was created. Never modified after initial creation.
    -- Required for compliance, audit trails, and historical reporting
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Timestamp of last modification. Auto-updated via database trigger on any
    -- column change. Useful for sync operations and debugging
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- User ID of Site Store Manager or Tenant Admin who created this part.
    -- NULL for system-seeded records. Required for SOX compliance and security
    -- audits. Note: FK constraint added after users table is created
    created_by UUID,
    
    -- User ID who last modified this part record. Tracks all changes for audit
    -- trail. From PRD: "Achieve 100% audit trail coverage for safety and
    -- regulatory compliance". Note: FK constraint added after users table is created
    updated_by UUID,

    -- ========================================================================
    -- CONSTRAINTS
    -- ========================================================================
    
    -- Ensure part code is unique within a site (same code can exist in
    -- different sites, but not within the same site)
    CONSTRAINT uq_inventory_parts_site_code UNIQUE (site_id, code),
    
    -- Ensure all quantity values are non-negative
    CONSTRAINT chk_quantity_on_hand_positive CHECK (quantity_on_hand >= 0),
    CONSTRAINT chk_quantity_reserved_positive CHECK (quantity_reserved >= 0),
    CONSTRAINT chk_quantity_available_positive CHECK (quantity_available >= 0),
    CONSTRAINT chk_reorder_point_positive CHECK (reorder_point >= 0),
    CONSTRAINT chk_reorder_quantity_positive CHECK (reorder_quantity >= 0),
    CONSTRAINT chk_minimum_stock_positive CHECK (minimum_stock >= 0),
    
    -- Ensure maximum_stock is greater than minimum_stock if both are provided
    CONSTRAINT chk_maximum_greater_than_minimum CHECK (
        maximum_stock IS NULL OR 
        minimum_stock IS NULL OR 
        maximum_stock >= minimum_stock
    ),
    
    -- Ensure reorder_point is less than or equal to minimum_stock (logical ordering)
    CONSTRAINT chk_reorder_point_logic CHECK (
        reorder_point <= minimum_stock OR minimum_stock = 0
    ),
    
    -- Ensure reserved quantity does not exceed on-hand quantity
    CONSTRAINT chk_reserved_not_exceed_on_hand CHECK (quantity_reserved <= quantity_on_hand),
    
    -- Ensure all cost values are non-negative
    CONSTRAINT chk_unit_cost_positive CHECK (unit_cost >= 0),
    CONSTRAINT chk_average_cost_positive CHECK (average_cost >= 0),
    
    -- Ensure lead_time_days is non-negative
    CONSTRAINT chk_lead_time_positive CHECK (lead_time_days IS NULL OR lead_time_days >= 0)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Most common query: Get all inventory parts for a tenant. Critical for
-- multi-tenant data isolation and performance
CREATE INDEX idx_inventory_parts_tenant_id ON inventory_parts(tenant_id);

-- Get all inventory parts for a specific site. Used for site-level parts
-- catalog and inventory management
CREATE INDEX idx_inventory_parts_site_id ON inventory_parts(site_id);

-- Filter parts by category for catalog browsing and reporting
CREATE INDEX idx_inventory_parts_category ON inventory_parts(category) WHERE category IS NOT NULL;

-- Filter parts by type for type-based reporting and filtering
CREATE INDEX idx_inventory_parts_part_type ON inventory_parts(part_type);

-- Filter active parts (most common query pattern for parts catalog)
CREATE INDEX idx_inventory_parts_status ON inventory_parts(status);

-- Lookup part by code within site (enforced by UNIQUE constraint, but
-- explicit index for documentation and performance)
CREATE INDEX idx_inventory_parts_site_code ON inventory_parts(site_id, code);

-- Find parts by barcode for barcode scanning
CREATE INDEX idx_inventory_parts_barcode ON inventory_parts(barcode) WHERE barcode IS NOT NULL;

-- Find parts by QR code for mobile scanning
CREATE INDEX idx_inventory_parts_qr_code ON inventory_parts(qr_code) WHERE qr_code IS NOT NULL;

-- Find parts below reorder point for reorder alerts. Used for daily ROP
-- checks and alert generation. PRD: "Check stock levels against ROP daily"
CREATE INDEX idx_inventory_parts_low_stock ON inventory_parts(site_id, status) 
    WHERE status = 'active' AND quantity_available < reorder_point;

-- Find parts by warehouse for warehouse-based inventory management
CREATE INDEX idx_inventory_parts_warehouse ON inventory_parts(warehouse) WHERE warehouse IS NOT NULL;

-- Composite index for common query: Get active parts by site and category
CREATE INDEX idx_inventory_parts_site_category_status ON inventory_parts(site_id, category, status);

-- Find parts by supplier for supplier-based reporting and purchase planning
CREATE INDEX idx_inventory_parts_supplier_id ON inventory_parts(supplier_id) WHERE supplier_id IS NOT NULL;

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_inventory_parts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_parts_updated_at
    BEFORE UPDATE ON inventory_parts
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_parts_updated_at();

-- ============================================================================
-- TRIGGER: Auto-calculate quantity_available
-- ============================================================================

-- Automatically calculate quantity_available when quantity_on_hand or
-- quantity_reserved changes. Ensures data consistency.
CREATE OR REPLACE FUNCTION calculate_inventory_parts_available()
RETURNS TRIGGER AS $$
BEGIN
    NEW.quantity_available = NEW.quantity_on_hand - NEW.quantity_reserved;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_parts_calculate_available
    BEFORE INSERT OR UPDATE ON inventory_parts
    FOR EACH ROW
    EXECUTE FUNCTION calculate_inventory_parts_available();

-- ============================================================================
-- COMMENTS (Database-level documentation)
-- ============================================================================

COMMENT ON TABLE inventory_parts IS 'Spare parts catalog and inventory management across all tenants and sites. Supports multi-warehouse inventory, reorder point tracking, BOM linking, and stock level management.';

COMMENT ON COLUMN inventory_parts.id IS 'Unique identifier for the inventory part. Used as foreign key reference in related tables (inventory_transactions, asset_bom_items, etc.)';
COMMENT ON COLUMN inventory_parts.tenant_id IS 'Foreign key to the parent tenant. All inventory parts belong to a tenant for multi-tenant data isolation. Queries filter by tenant_id for security';
COMMENT ON COLUMN inventory_parts.site_id IS 'Foreign key to the site where this part is stored. All inventory parts belong to a specific site. Each site operates independently with its own inventory';
COMMENT ON COLUMN inventory_parts.code IS 'Human-readable part number (e.g., "PART-12345"). Auto-generated on creation. Used in UI, reports, QR codes. Unique within site';
COMMENT ON COLUMN inventory_parts.name IS 'Display name shown throughout the application (e.g., "Ball Bearing 6205-2RS")';
COMMENT ON COLUMN inventory_parts.description IS 'Detailed description of the part, its specifications, and usage notes. Used for parts catalog and technician reference';
COMMENT ON COLUMN inventory_parts.category IS 'Part category for grouping and reporting (e.g., "Bearings", "Motors"). Used for parts catalog filtering';
COMMENT ON COLUMN inventory_parts.part_type IS 'Type of part determines its role and available workflows. Values: spare_part, consumable, tool, raw_material';
COMMENT ON COLUMN inventory_parts.unit_of_measure IS 'Unit of measure for quantity tracking (e.g., "pcs", "kg", "L"). Used for stock level calculations';
COMMENT ON COLUMN inventory_parts.quantity_on_hand IS 'Current physical stock quantity on hand. Updated when parts are received, issued, returned, or adjusted';
COMMENT ON COLUMN inventory_parts.quantity_reserved IS 'Quantity reserved for specific work orders (pending issuance). Reserved quantity is deducted from available stock';
COMMENT ON COLUMN inventory_parts.quantity_available IS 'Calculated available quantity (quantity_on_hand - quantity_reserved). Used for availability checks before reservation';
COMMENT ON COLUMN inventory_parts.reorder_point IS 'Reorder Point (ROP) threshold. When quantity_available falls below this value, system generates reorder alerts';
COMMENT ON COLUMN inventory_parts.reorder_quantity IS 'Recommended order quantity when stock falls below reorder_point. Used for purchase request generation';
COMMENT ON COLUMN inventory_parts.minimum_stock IS 'Minimum safety stock level. System alerts when stock falls below this critical threshold';
COMMENT ON COLUMN inventory_parts.maximum_stock IS 'Maximum storage capacity for this part. Used for inventory optimization and preventing overstocking';
COMMENT ON COLUMN inventory_parts.warehouse IS 'Warehouse name where this part is stored. Supports multi-warehouse inventory management within a site';
COMMENT ON COLUMN inventory_parts.bin_location IS 'Bin or shelf location within the warehouse (e.g., "A-12-3"). Used for physical location tracking and cycle counts';
COMMENT ON COLUMN inventory_parts.unit_cost IS 'Current unit cost in tenant currency. Used for cost calculations when parts are issued to work orders';
COMMENT ON COLUMN inventory_parts.average_cost IS 'Weighted average cost calculated from all stock receipts. Used for inventory valuation and cost reporting';
COMMENT ON COLUMN inventory_parts.currency IS 'ISO 4217 currency code for cost calculations. Inherits from site currency if not specified';
COMMENT ON COLUMN inventory_parts.supplier_id IS 'Foreign key to suppliers table. Links part to primary supplier. NULL for parts without supplier assignment';
COMMENT ON COLUMN inventory_parts.supplier_part_number IS 'Supplier''s part number for this item. Used for purchase order creation and supplier communication';
COMMENT ON COLUMN inventory_parts.lead_time_days IS 'Lead time in days from order placement to receipt. Used for reorder planning and purchase request scheduling';
COMMENT ON COLUMN inventory_parts.barcode IS 'Barcode string for barcode scanning. Used for quick part identification during cycle counts and stock transactions';
COMMENT ON COLUMN inventory_parts.qr_code IS 'QR code string for mobile scanning. Auto-generated on creation or manually assigned. Technicians scan QR codes to access part information';
COMMENT ON COLUMN inventory_parts.specifications IS 'Flexible JSON storage for technical specifications without schema changes. Common uses: dimensions, weight, material, certifications';
COMMENT ON COLUMN inventory_parts.image_ids IS 'Array of image IDs (stored in MinIO/S3) attached to the part. Used for visual identification and documentation';
COMMENT ON COLUMN inventory_parts.status IS 'Part status determines availability and visibility. Values: active (available for use), discontinued (no longer available), obsolete (should not be used)';
COMMENT ON COLUMN inventory_parts.settings IS 'Flexible JSON storage for part-specific configurations without schema changes. Common uses: custom attributes, integration data, workflow settings';
COMMENT ON COLUMN inventory_parts.created_at IS 'Timestamp when part was created. Never modified after initial creation. Required for compliance, audit trails, and historical reporting';
COMMENT ON COLUMN inventory_parts.updated_at IS 'Timestamp of last modification. Auto-updated via database trigger on any column change. Useful for sync operations and debugging';
COMMENT ON COLUMN inventory_parts.created_by IS 'User ID of Site Store Manager or Tenant Admin who created this part. NULL for system-seeded records. Required for SOX compliance';
COMMENT ON COLUMN inventory_parts.updated_by IS 'User ID who last modified this part record. Tracks all changes for audit trail. Required for 100% audit trail coverage';

-- ============================================================================
-- SEED DATA (Optional: Demo inventory part for development)
-- ============================================================================

-- Uncomment below to seed a demo inventory part for development/testing
-- Note: Replace 'TENANT-UUID-HERE', 'SITE-UUID-HERE', 'USER-UUID-HERE' with actual UUIDs
/*
INSERT INTO inventory_parts (
    tenant_id,
    site_id,
    code,
    name,
    description,
    category,
    part_type,
    unit_of_measure,
    quantity_on_hand,
    reorder_point,
    reorder_quantity,
    minimum_stock,
    warehouse,
    bin_location,
    unit_cost,
    currency,
    created_by
) VALUES (
    'TENANT-UUID-HERE',
    'SITE-UUID-HERE',
    'PART-001',
    'Ball Bearing 6205-2RS',
    'Deep groove ball bearing, 25mm ID x 52mm OD x 15mm width, double sealed',
    'Bearings',
    'spare_part',
    'pcs',
    50,
    10,
    30,
    5,
    'Main Warehouse',
    'A-12-3',
    15.50,
    'USD',
    'USER-UUID-HERE'
);
*/

