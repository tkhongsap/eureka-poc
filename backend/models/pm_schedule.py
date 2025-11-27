"""
PM Schedule Models for Eureka CMMS

This module defines the Pydantic models for preventive maintenance schedule
management in the multi-site, multi-tenant architecture. PM schedules support
time-based scheduling, meter-based triggers, route-based maintenance, job plan
templates, and automatic work order generation.

Models:
    - PMTriggerType: Enum for trigger type classification
    - PMFrequency: Enum for time-based frequency
    - PMStatus: Enum for schedule status
    - PMScheduleBase: Base model with shared fields
    - PMScheduleCreate: Model for creating new PM schedules
    - PMScheduleUpdate: Model for updating existing PM schedules
    - PMSchedule: Full PM schedule model with all fields
"""

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class PMTriggerType(str, Enum):
    """
    Type of trigger determines how PM work orders are generated.
    
    - time_based: Scheduled by calendar frequency (daily, weekly, monthly, etc.)
    - meter_based: Triggered when meter reading exceeds threshold
    - route_based: Inspection route with checkpoints for daily rounds
    """
    TIME_BASED = "time_based"
    METER_BASED = "meter_based"
    ROUTE_BASED = "route_based"


class PMFrequency(str, Enum):
    """
    Frequency for time-based schedules. Used to calculate next_due_date.
    
    - daily: Every day
    - weekly: Every week
    - biweekly: Every 2 weeks
    - monthly: Every month
    - quarterly: Every 3 months
    - semiannually: Every 6 months
    - annually: Every year
    - custom: Custom interval using frequency_interval
    """
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    SEMIANNUALLY = "semiannually"
    ANNUALLY = "annually"
    CUSTOM = "custom"


class PMStatus(str, Enum):
    """
    PM schedule status determines whether work orders are generated.
    
    - active: Schedule is active and generating work orders
    - suspended: Schedule is temporarily suspended (asset maintenance, etc.)
    - completed: Schedule has ended (end_date reached)
    """
    ACTIVE = "active"
    SUSPENDED = "suspended"
    COMPLETED = "completed"


class PMScheduleBase(BaseModel):
    """
    Base PM schedule model with shared fields for create and update operations.
    """
    
    # PM schedule identification
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Display name shown throughout the application (e.g., 'Monthly Pump Inspection')"
    )
    
    description: Optional[str] = Field(
        None,
        description="Detailed description of the PM schedule, its purpose, and maintenance tasks"
    )
    
    # Asset reference
    asset_id: Optional[UUID] = Field(
        None,
        description="Foreign key to assets table. Links PM schedule to specific equipment. NULL for location-based PM"
    )
    
    functional_location_id: Optional[UUID] = Field(
        None,
        description="Foreign key to functional_locations table. Links PM schedule to location for location-based maintenance"
    )
    
    # Trigger configuration
    trigger_type: PMTriggerType = Field(
        PMTriggerType.TIME_BASED,
        description="Type of trigger: time_based, meter_based, or route_based"
    )
    
    frequency: PMFrequency = Field(
        PMFrequency.MONTHLY,
        description="Frequency for time-based schedules: daily, weekly, biweekly, monthly, quarterly, semiannually, annually, or custom"
    )
    
    frequency_interval: Optional[int] = Field(
        None,
        ge=1,
        description="Custom frequency interval (e.g., every 3 weeks). Used when frequency is 'custom'"
    )
    
    meter_type: Optional[str] = Field(
        None,
        max_length=50,
        description="Type of meter for meter-based triggers (e.g., 'operating_hours', 'cycles', 'kilometers')"
    )
    
    meter_threshold: Optional[int] = Field(
        None,
        ge=0,
        description="Meter threshold value that triggers PM work order generation"
    )
    
    # Scheduling
    start_date: date = Field(
        ...,
        description="Date when PM schedule becomes active. Work orders are generated starting from this date"
    )
    
    end_date: Optional[date] = Field(
        None,
        description="Date when PM schedule ends (optional). NULL for indefinite schedules"
    )
    
    next_due_date: Optional[date] = Field(
        None,
        description="Next scheduled execution date. Calculated automatically based on frequency and last_executed_at"
    )
    
    last_executed_at: Optional[datetime] = Field(
        None,
        description="Timestamp when last work order was generated from this schedule"
    )
    
    lead_time_days: int = Field(
        7,
        ge=0,
        description="Lead time in days before due date to generate work order"
    )
    
    # Assignment
    assigned_to: Optional[UUID] = Field(
        None,
        description="Foreign key to users table. Technician or team lead assigned to perform PM tasks"
    )
    
    work_type: str = Field(
        "preventive_maintenance",
        max_length=50,
        description="Work order type for generated work orders. Typically 'preventive_maintenance'"
    )
    
    estimated_hours: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Estimated labor hours required to complete PM task"
    )
    
    priority: str = Field(
        "medium",
        max_length=20,
        description="Default priority for generated work orders. Values: emergency, high, medium, low"
    )
    
    # Configuration
    auto_assign: bool = Field(
        False,
        description="Auto-assign generated work orders to assigned_to technician"
    )
    
    auto_generate: bool = Field(
        True,
        description="Auto-generate work orders when due date is reached"
    )
    
    notify_on_create: bool = Field(
        True,
        description="Send notification when work order is generated"
    )
    
    job_plan: Dict[str, Any] = Field(
        default_factory=dict,
        description="Flexible JSON storage for job plan templates, checklists, procedures, and instructions"
    )
    
    # Flexible settings storage
    settings: Dict[str, Any] = Field(
        default_factory=dict,
        description="Flexible JSON storage for PM schedule-specific configurations"
    )
    
    @field_validator("frequency_interval")
    @classmethod
    def validate_custom_frequency(cls, v: Optional[int], info) -> Optional[int]:
        """Ensure frequency_interval is provided when frequency is 'custom'."""
        if "frequency" in info.data:
            frequency = info.data.get("frequency")
            if frequency == PMFrequency.CUSTOM and v is None:
                raise ValueError("frequency_interval must be provided when frequency is 'custom'")
        return v
    
    @field_validator("meter_type", "meter_threshold")
    @classmethod
    def validate_meter_fields(cls, v: Optional[Any], info) -> Optional[Any]:
        """Ensure meter fields are provided when trigger_type is 'meter_based'."""
        if "trigger_type" in info.data:
            trigger_type = info.data.get("trigger_type")
            field_name = info.field_name
            if trigger_type == PMTriggerType.METER_BASED:
                if field_name == "meter_type" and v is None:
                    raise ValueError("meter_type must be provided when trigger_type is 'meter_based'")
                if field_name == "meter_threshold" and v is None:
                    raise ValueError("meter_threshold must be provided when trigger_type is 'meter_based'")
        return v
    
    @field_validator("end_date")
    @classmethod
    def validate_end_date(cls, v: Optional[date], info) -> Optional[date]:
        """Ensure end_date is after start_date if both provided."""
        if v and "start_date" in info.data:
            start_date = info.data.get("start_date")
            if start_date and v < start_date:
                raise ValueError("end_date must be after or equal to start_date")
        return v
    
    @field_validator("next_due_date")
    @classmethod
    def validate_next_due_date(cls, v: Optional[date], info) -> Optional[date]:
        """Ensure next_due_date is after start_date if provided."""
        if v and "start_date" in info.data:
            start_date = info.data.get("start_date")
            if start_date and v < start_date:
                raise ValueError("next_due_date must be after or equal to start_date")
        return v


class PMScheduleCreate(PMScheduleBase):
    """
    Model for creating a new PM schedule.
    
    The PM schedule code is auto-generated by the system (e.g., PM-001),
    so it's not included in the create request.
    The tenant_id and site_id are typically set from the authenticated user's context.
    """
    pass


class PMScheduleUpdate(BaseModel):
    """
    Model for updating an existing PM schedule.
    
    All fields are optional - only provided fields will be updated.
    The PM schedule code and ID cannot be changed after creation.
    """
    
    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=255,
        description="Display name shown throughout the application"
    )
    
    description: Optional[str] = Field(
        None,
        description="Detailed description of the PM schedule"
    )
    
    asset_id: Optional[UUID] = Field(
        None,
        description="Foreign key to assets table"
    )
    
    functional_location_id: Optional[UUID] = Field(
        None,
        description="Foreign key to functional_locations table"
    )
    
    trigger_type: Optional[PMTriggerType] = Field(
        None,
        description="Type of trigger"
    )
    
    frequency: Optional[PMFrequency] = Field(
        None,
        description="Frequency for time-based schedules"
    )
    
    frequency_interval: Optional[int] = Field(
        None,
        ge=1,
        description="Custom frequency interval"
    )
    
    meter_type: Optional[str] = Field(
        None,
        max_length=50,
        description="Type of meter for meter-based triggers"
    )
    
    meter_threshold: Optional[int] = Field(
        None,
        ge=0,
        description="Meter threshold value"
    )
    
    start_date: Optional[date] = Field(
        None,
        description="Date when PM schedule becomes active"
    )
    
    end_date: Optional[date] = Field(
        None,
        description="Date when PM schedule ends"
    )
    
    next_due_date: Optional[date] = Field(
        None,
        description="Next scheduled execution date"
    )
    
    last_executed_at: Optional[datetime] = Field(
        None,
        description="Timestamp when last work order was generated"
    )
    
    lead_time_days: Optional[int] = Field(
        None,
        ge=0,
        description="Lead time in days before due date to generate work order"
    )
    
    assigned_to: Optional[UUID] = Field(
        None,
        description="Foreign key to users table"
    )
    
    work_type: Optional[str] = Field(
        None,
        max_length=50,
        description="Work order type for generated work orders"
    )
    
    estimated_hours: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Estimated labor hours required"
    )
    
    priority: Optional[str] = Field(
        None,
        max_length=20,
        description="Default priority for generated work orders"
    )
    
    auto_assign: Optional[bool] = Field(
        None,
        description="Auto-assign generated work orders"
    )
    
    auto_generate: Optional[bool] = Field(
        None,
        description="Auto-generate work orders when due date is reached"
    )
    
    notify_on_create: Optional[bool] = Field(
        None,
        description="Send notification when work order is generated"
    )
    
    job_plan: Optional[Dict[str, Any]] = Field(
        None,
        description="Job plan templates, checklists, procedures, and instructions (JSON)"
    )
    
    status: Optional[PMStatus] = Field(
        None,
        description="PM schedule status"
    )
    
    settings: Optional[Dict[str, Any]] = Field(
        None,
        description="PM schedule-specific configurations"
    )


class PMSchedule(PMScheduleBase):
    """
    Full PM schedule model representing a record in the database.
    
    Includes all base fields plus system-managed fields like ID, code,
    tenant_id, site_id, status, and audit timestamps.
    """
    
    # System-generated identifier (UUID)
    id: UUID = Field(
        ...,
        description="Unique identifier for the PM schedule (UUID)"
    )
    
    # Foreign key to parent tenant
    tenant_id: UUID = Field(
        ...,
        description="Foreign key to the parent tenant for multi-tenant data isolation"
    )
    
    # Foreign key to parent site
    site_id: UUID = Field(
        ...,
        description="Foreign key to the site where this PM schedule is active"
    )
    
    # Human-readable PM schedule code (auto-generated, e.g., PM-001)
    code: str = Field(
        ...,
        max_length=50,
        description="Human-readable PM schedule code for UI and reports"
    )
    
    # PM schedule status
    status: PMStatus = Field(
        PMStatus.ACTIVE,
        description="PM schedule status: active, suspended, or completed"
    )
    
    # Audit timestamps
    created_at: datetime = Field(
        ...,
        description="Timestamp when PM schedule was created"
    )
    
    updated_at: datetime = Field(
        ...,
        description="Timestamp of last modification"
    )
    
    # Audit user references (UUID of the user who performed the action)
    created_by: Optional[UUID] = Field(
        None,
        description="User ID of Site Manager who created this PM schedule"
    )
    
    updated_by: Optional[UUID] = Field(
        None,
        description="User ID who last modified this PM schedule record"
    )

    class Config:
        """Pydantic configuration."""
        from_attributes = True  # Enable ORM mode for SQLAlchemy compatibility

