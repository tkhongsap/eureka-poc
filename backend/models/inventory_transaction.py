"""
Inventory Transaction Models for Eureka CMMS

This module defines the Pydantic models for inventory transaction management in the
multi-site, multi-tenant architecture. Inventory transactions track all stock
movements (receive, issue, return, adjust, transfer, reserve, release) with full
audit trail for compliance and demand forecasting.

Models:
    - TransactionType: Enum for transaction type classification
    - TransactionStatus: Enum for transaction status
    - InventoryTransactionBase: Base model with shared fields
    - InventoryTransactionCreate: Model for creating new transactions
    - InventoryTransactionUpdate: Model for updating existing transactions
    - InventoryTransaction: Full transaction model with all fields
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class TransactionType(str, Enum):
    """
    Type of transaction determines stock effect and workflow.
    
    - receive: Goods receipt from supplier (+quantity_on_hand)
    - issue: Parts issued to work order (-quantity_on_hand, -quantity_reserved)
    - return: Parts returned from work order (+quantity_on_hand)
    - adjust_add: Manual adjustment (add stock) (+quantity_on_hand)
    - adjust_remove: Manual adjustment (remove stock) (-quantity_on_hand)
    - transfer_out: Transfer to another warehouse/site (-quantity_on_hand)
    - transfer_in: Transfer from another warehouse/site (+quantity_on_hand)
    - reserve: Reserve for work order (+quantity_reserved)
    - release: Release reservation (-quantity_reserved)
    - cycle_count: Cycle count adjustment (+/- quantity_on_hand)
    """
    RECEIVE = "receive"
    ISSUE = "issue"
    RETURN = "return"
    ADJUST_ADD = "adjust_add"
    ADJUST_REMOVE = "adjust_remove"
    TRANSFER_OUT = "transfer_out"
    TRANSFER_IN = "transfer_in"
    RESERVE = "reserve"
    RELEASE = "release"
    CYCLE_COUNT = "cycle_count"


class TransactionStatus(str, Enum):
    """
    Transaction status determines workflow stage and whether stock has been updated.
    
    - pending: Transaction created, awaiting approval
    - approved: Transaction approved, ready to execute
    - completed: Transaction executed, stock updated
    - canceled: Transaction canceled, no stock effect
    """
    PENDING = "pending"
    APPROVED = "approved"
    COMPLETED = "completed"
    CANCELED = "canceled"


class InventoryTransactionBase(BaseModel):
    """
    Base inventory transaction model with shared fields for create and update operations.
    """
    
    # Transaction identification
    transaction_type: TransactionType = Field(
        ...,
        description="Type of transaction: receive, issue, return, adjust_add, adjust_remove, transfer_out, transfer_in, reserve, release, or cycle_count"
    )
    
    quantity: int = Field(
        ...,
        gt=0,
        description="Transaction quantity (always positive). The direction of stock effect is determined by transaction_type"
    )
    
    unit_cost: Decimal = Field(
        0,
        ge=0,
        description="Unit cost at the time of transaction. Used for cost calculations and inventory valuation"
    )
    
    # References
    work_order_id: Optional[UUID] = Field(
        None,
        description="Foreign key to work_orders table. Links transaction to work order for issue, return, reserve, and release transactions"
    )
    
    purchase_order_id: Optional[UUID] = Field(
        None,
        description="Foreign key to purchase_orders table. Links transaction to purchase order for receive transactions"
    )
    
    related_transaction_id: Optional[UUID] = Field(
        None,
        description="Foreign key to inventory_transactions table (self-reference). Links related transactions (e.g., transfer pairs)"
    )
    
    reference_number: Optional[str] = Field(
        None,
        max_length=50,
        description="External reference number (e.g., 'PO-12345', 'WO-00001', 'ADJ-001')"
    )
    
    # Location tracking
    source_warehouse: Optional[str] = Field(
        None,
        max_length=100,
        description="Source warehouse name for the transaction. For issue/transfer_out, this is where parts are taken from"
    )
    
    source_bin: Optional[str] = Field(
        None,
        max_length=50,
        description="Source bin location within the warehouse. Used for physical location tracking and cycle counts"
    )
    
    destination_warehouse: Optional[str] = Field(
        None,
        max_length=100,
        description="Destination warehouse name for transfers. Used for transfer_out and transfer_in transactions"
    )
    
    destination_bin: Optional[str] = Field(
        None,
        max_length=50,
        description="Destination bin location within the destination warehouse. Used for transfer transactions"
    )
    
    # Transaction details
    reason: Optional[str] = Field(
        None,
        description="Reason or notes for the transaction. Required for adjustments and transfers. Used for audit trail and compliance"
    )
    
    status: TransactionStatus = Field(
        TransactionStatus.PENDING,
        description="Transaction status: pending, approved, completed, or canceled"
    )
    
    approved_by: Optional[UUID] = Field(
        None,
        description="User ID who approved this transaction. NULL until transaction is approved"
    )
    
    approved_at: Optional[datetime] = Field(
        None,
        description="Timestamp when transaction was approved. NULL until transaction is approved"
    )
    
    @field_validator("approved_at")
    @classmethod
    def validate_approval_consistency(cls, v: Optional[datetime], info) -> Optional[datetime]:
        """Ensure approved_at is set when approved_by is set (logical consistency)."""
        if "approved_by" in info.data:
            approved_by = info.data.get("approved_by")
            if approved_by is not None and v is None:
                raise ValueError("approved_at must be set when approved_by is set")
            if approved_by is None and v is not None:
                raise ValueError("approved_at must be NULL when approved_by is NULL")
        return v


class InventoryTransactionCreate(InventoryTransactionBase):
    """
    Model for creating a new inventory transaction.
    
    The tenant_id, site_id, and part_id are typically set from the authenticated
    user's context. The total_value is calculated automatically from quantity × unit_cost.
    """
    pass


class InventoryTransactionUpdate(BaseModel):
    """
    Model for updating an existing inventory transaction.
    
    All fields are optional - only provided fields will be updated.
    The transaction ID cannot be changed after creation.
    """
    
    transaction_type: Optional[TransactionType] = Field(
        None,
        description="Type of transaction"
    )
    
    quantity: Optional[int] = Field(
        None,
        gt=0,
        description="Transaction quantity (always positive)"
    )
    
    unit_cost: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Unit cost at the time of transaction"
    )
    
    work_order_id: Optional[UUID] = Field(
        None,
        description="Foreign key to work_orders table"
    )
    
    purchase_order_id: Optional[UUID] = Field(
        None,
        description="Foreign key to purchase_orders table"
    )
    
    related_transaction_id: Optional[UUID] = Field(
        None,
        description="Foreign key to inventory_transactions table (self-reference)"
    )
    
    reference_number: Optional[str] = Field(
        None,
        max_length=50,
        description="External reference number"
    )
    
    source_warehouse: Optional[str] = Field(
        None,
        max_length=100,
        description="Source warehouse name"
    )
    
    source_bin: Optional[str] = Field(
        None,
        max_length=50,
        description="Source bin location"
    )
    
    destination_warehouse: Optional[str] = Field(
        None,
        max_length=100,
        description="Destination warehouse name"
    )
    
    destination_bin: Optional[str] = Field(
        None,
        max_length=50,
        description="Destination bin location"
    )
    
    reason: Optional[str] = Field(
        None,
        description="Reason or notes for the transaction"
    )
    
    status: Optional[TransactionStatus] = Field(
        None,
        description="Transaction status"
    )
    
    approved_by: Optional[UUID] = Field(
        None,
        description="User ID who approved this transaction"
    )
    
    approved_at: Optional[datetime] = Field(
        None,
        description="Timestamp when transaction was approved"
    )
    
    @field_validator("approved_at")
    @classmethod
    def validate_approval_consistency(cls, v: Optional[datetime], info) -> Optional[datetime]:
        """Ensure approved_at is set when approved_by is set (logical consistency)."""
        if "approved_by" in info.data:
            approved_by = info.data.get("approved_by")
            if approved_by is not None and v is None:
                raise ValueError("approved_at must be set when approved_by is set")
            if approved_by is None and v is not None:
                raise ValueError("approved_at must be NULL when approved_by is NULL")
        return v


class InventoryTransaction(InventoryTransactionBase):
    """
    Full inventory transaction model representing a record in the database.
    
    Includes all base fields plus system-managed fields like ID, tenant_id,
    site_id, part_id, total_value, and audit timestamps.
    """
    
    # System-generated identifier (UUID)
    id: UUID = Field(
        ...,
        description="Unique identifier for the transaction (UUID)"
    )
    
    # Foreign key to parent tenant
    tenant_id: UUID = Field(
        ...,
        description="Foreign key to the parent tenant for multi-tenant data isolation"
    )
    
    # Foreign key to parent site
    site_id: UUID = Field(
        ...,
        description="Foreign key to the site where this transaction occurs"
    )
    
    # Foreign key to inventory part
    part_id: UUID = Field(
        ...,
        description="Foreign key to inventory_parts table. Links transaction to the part being transacted"
    )
    
    # Calculated total value (quantity × unit_cost)
    total_value: Decimal = Field(
        0,
        ge=0,
        description="Total transaction value (quantity × unit_cost). Calculated automatically via database trigger"
    )
    
    # Audit timestamps
    created_at: datetime = Field(
        ...,
        description="Timestamp when transaction was created"
    )
    
    updated_at: datetime = Field(
        ...,
        description="Timestamp of last modification"
    )
    
    # Audit user references (UUID of the user who performed the action)
    created_by: Optional[UUID] = Field(
        None,
        description="User ID who created this transaction. NULL for system-generated transactions"
    )
    
    updated_by: Optional[UUID] = Field(
        None,
        description="User ID who last modified this transaction"
    )

    class Config:
        """Pydantic configuration."""
        from_attributes = True  # Enable ORM mode for SQLAlchemy compatibility

