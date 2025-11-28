"""
Tenant CRUD routes for Eureka CMMS.

This module provides REST API endpoints for tenant management operations,
including creation, retrieval, update, deletion, and license management.
"""

import json
from datetime import datetime
from typing import Optional
from uuid import UUID

import asyncpg
from config import get_db_pool
from fastapi import APIRouter, Header, HTTPException, Query
from models import (
    APIResponse,
    PaginatedResponse,
    SubscriptionPlan,
    Tenant,
    TenantCreate,
    TenantStatus,
    TenantUpdate,
)

router = APIRouter(prefix="/api/tenants", tags=["Tenants"])


async def generate_tenant_code(conn: asyncpg.Connection) -> str:
    """
    Generate the next tenant code (TNT-001, TNT-002, etc.).

    Args:
        conn: Database connection

    Returns:
        str: Next available tenant code
    """
    # Get the highest existing code number
    result = await conn.fetchval(
        """
        SELECT MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER))
        FROM tenants
        WHERE code ~ '^TNT-[0-9]+$'
        """
    )

    next_num = (result or 0) + 1
    return f"TNT-{next_num:03d}"


def row_to_tenant(row: asyncpg.Record) -> Tenant:
    """
    Convert a database row to a Tenant Pydantic model.

    Args:
        row: Database row record

    Returns:
        Tenant: Tenant model instance
    """
    return Tenant(
        id=row["id"],
        code=row["code"],
        name=row["name"],
        company_registration_number=row["company_registration_number"],
        primary_contact_name=row["primary_contact_name"],
        primary_contact_email=row["primary_contact_email"],
        primary_contact_phone=row["primary_contact_phone"],
        billing_address=row["billing_address"],
        subscription_plan=SubscriptionPlan(row["subscription_plan"]),
        license_pool=row["license_pool"],
        licenses_used=row["licenses_used"],
        contract_start_date=row["contract_start_date"],
        contract_end_date=row["contract_end_date"],
        timezone=row["timezone"],
        currency=row["currency"],
        language=row["language"],
        date_format=row["date_format"],
        logo_url=row["logo_url"],
        branding_primary_color=row["branding_primary_color"],
        branding_secondary_color=row["branding_secondary_color"],
        status=TenantStatus(row["status"]),
        settings=(
            row["settings"]
            if isinstance(row["settings"], dict)
            else json.loads(row["settings"] or "{}")
        ),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        created_by=row["created_by"],
        updated_by=row["updated_by"],
    )


@router.post("", response_model=APIResponse[Tenant], status_code=201)
async def create_tenant(
    tenant_data: TenantCreate,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
):
    """
    Create a new tenant with auto-generated code (TNT-NNN).

    Validates required fields and generates a unique tenant code.
    """
    pool = await get_db_pool()

    async with pool.acquire() as conn:
        # Generate tenant code
        code = await generate_tenant_code(conn)

        # Prepare data for insertion
        insert_data = {
            "code": code,
            "name": tenant_data.name,
            "company_registration_number": tenant_data.company_registration_number,
            "primary_contact_name": tenant_data.primary_contact_name,
            "primary_contact_email": tenant_data.primary_contact_email,
            "primary_contact_phone": tenant_data.primary_contact_phone,
            "billing_address": tenant_data.billing_address,
            "subscription_plan": tenant_data.subscription_plan.value,
            "license_pool": tenant_data.license_pool,
            "contract_start_date": tenant_data.contract_start_date,
            "contract_end_date": tenant_data.contract_end_date,
            "timezone": tenant_data.timezone,
            "currency": tenant_data.currency,
            "language": tenant_data.language,
            "date_format": tenant_data.date_format,
            "logo_url": tenant_data.logo_url,
            "branding_primary_color": tenant_data.branding_primary_color,
            "branding_secondary_color": tenant_data.branding_secondary_color,
            "settings": json.dumps(tenant_data.settings),
            "created_by": UUID(x_user_id) if x_user_id else None,
        }

        try:
            # Insert tenant
            row = await conn.fetchrow(
                """
                INSERT INTO tenants (
                    code, name, company_registration_number, primary_contact_name,
                    primary_contact_email, primary_contact_phone, billing_address,
                    subscription_plan, license_pool, contract_start_date, contract_end_date,
                    timezone, currency, language, date_format, logo_url,
                    branding_primary_color, branding_secondary_color, settings, created_by
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
                )
                RETURNING *
                """,
                insert_data["code"],
                insert_data["name"],
                insert_data["company_registration_number"],
                insert_data["primary_contact_name"],
                insert_data["primary_contact_email"],
                insert_data["primary_contact_phone"],
                insert_data["billing_address"],
                insert_data["subscription_plan"],
                insert_data["license_pool"],
                insert_data["contract_start_date"],
                insert_data["contract_end_date"],
                insert_data["timezone"],
                insert_data["currency"],
                insert_data["language"],
                insert_data["date_format"],
                insert_data["logo_url"],
                insert_data["branding_primary_color"],
                insert_data["branding_secondary_color"],
                insert_data["settings"],
                insert_data["created_by"],
            )

            tenant = row_to_tenant(row)

            return APIResponse(
                success=True, message="Tenant created successfully", data=tenant
            )

        except asyncpg.UniqueViolationError:
            raise HTTPException(
                status_code=409, detail="Tenant with this code or email already exists"
            )
        except asyncpg.CheckViolationError as e:
            raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")


@router.get("/{tenant_id}", response_model=APIResponse[Tenant])
async def get_tenant(tenant_id: str):
    """Get a tenant by UUID."""
    try:
        tenant_uuid = UUID(tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant ID format")

    pool = await get_db_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM tenants WHERE id = $1", tenant_uuid)

        if not row:
            raise HTTPException(status_code=404, detail="Tenant not found")

        tenant = row_to_tenant(row)

        return APIResponse(
            success=True, message="Tenant retrieved successfully", data=tenant
        )


@router.put("/{tenant_id}", response_model=APIResponse[Tenant])
async def update_tenant(
    tenant_id: str,
    tenant_update: TenantUpdate,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
):
    """
    Update tenant fields. Only provided fields will be updated.
    """
    try:
        tenant_uuid = UUID(tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant ID format")

    pool = await get_db_pool()

    async with pool.acquire() as conn:
        # Check if tenant exists
        existing = await conn.fetchrow(
            "SELECT * FROM tenants WHERE id = $1", tenant_uuid
        )

        if not existing:
            raise HTTPException(status_code=404, detail="Tenant not found")

        # Build dynamic UPDATE query
        update_fields = []
        update_values = []
        param_num = 1

        update_data = tenant_update.model_dump(exclude_unset=True)

        # Validate contract dates if both are being updated
        if "contract_start_date" in update_data and "contract_end_date" in update_data:
            if update_data["contract_end_date"] and update_data["contract_start_date"]:
                if (
                    update_data["contract_end_date"]
                    < update_data["contract_start_date"]
                ):
                    raise HTTPException(
                        status_code=400,
                        detail="Contract end date must be after start date",
                    )

        # Validate license pool if being updated
        if "license_pool" in update_data:
            if update_data["license_pool"] < existing["licenses_used"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"License pool cannot be less than current usage ({existing['licenses_used']})",
                )

        # Build update query dynamically
        field_mapping = {
            "name": "name",
            "company_registration_number": "company_registration_number",
            "primary_contact_name": "primary_contact_name",
            "primary_contact_email": "primary_contact_email",
            "primary_contact_phone": "primary_contact_phone",
            "billing_address": "billing_address",
            "subscription_plan": "subscription_plan",
            "license_pool": "license_pool",
            "contract_start_date": "contract_start_date",
            "contract_end_date": "contract_end_date",
            "timezone": "timezone",
            "currency": "currency",
            "language": "language",
            "date_format": "date_format",
            "logo_url": "logo_url",
            "branding_primary_color": "branding_primary_color",
            "branding_secondary_color": "branding_secondary_color",
            "status": "status",
            "settings": "settings",
        }

        for field, value in update_data.items():
            if field in field_mapping:
                db_field = field_mapping[field]

                if field == "subscription_plan":
                    update_fields.append(f"{db_field} = ${param_num}")
                    update_values.append(value.value)
                elif field == "status":
                    update_fields.append(f"{db_field} = ${param_num}")
                    update_values.append(value.value)
                elif field == "settings":
                    update_fields.append(f"{db_field} = ${param_num}")
                    update_values.append(json.dumps(value))
                else:
                    update_fields.append(f"{db_field} = ${param_num}")
                    update_values.append(value)

                param_num += 1

        if not update_fields:
            # No fields to update, return existing tenant
            tenant = row_to_tenant(existing)
            return APIResponse(success=True, message="No changes provided", data=tenant)

        # Add updated_by and updated_at
        update_fields.append(f"updated_by = ${param_num}")
        update_values.append(UUID(x_user_id) if x_user_id else None)
        param_num += 1

        # Add WHERE clause parameter
        update_values.append(tenant_uuid)

        query = f"""
            UPDATE tenants
            SET {', '.join(update_fields)}
            WHERE id = ${param_num}
            RETURNING *
        """

        try:
            row = await conn.fetchrow(query, *update_values)
            tenant = row_to_tenant(row)

            return APIResponse(
                success=True, message="Tenant updated successfully", data=tenant
            )
        except asyncpg.CheckViolationError as e:
            raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")


@router.delete("/{tenant_id}", response_model=APIResponse[Tenant])
async def delete_tenant(
    tenant_id: str, x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Soft delete tenant by setting status to 'deactivated'.
    """
    try:
        tenant_uuid = UUID(tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant ID format")

    pool = await get_db_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE tenants
            SET status = 'deactivated', updated_by = $1
            WHERE id = $2
            RETURNING *
            """,
            UUID(x_user_id) if x_user_id else None,
            tenant_uuid,
        )

        if not row:
            raise HTTPException(status_code=404, detail="Tenant not found")

        tenant = row_to_tenant(row)

        return APIResponse(
            success=True, message="Tenant deactivated successfully", data=tenant
        )


@router.patch("/{tenant_id}/suspend", response_model=APIResponse[Tenant])
async def suspend_tenant(
    tenant_id: str, x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """Suspend tenant (temporary block)."""
    try:
        tenant_uuid = UUID(tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant ID format")

    pool = await get_db_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE tenants
            SET status = 'suspended', updated_by = $1
            WHERE id = $2
            RETURNING *
            """,
            UUID(x_user_id) if x_user_id else None,
            tenant_uuid,
        )

        if not row:
            raise HTTPException(status_code=404, detail="Tenant not found")

        tenant = row_to_tenant(row)

        return APIResponse(
            success=True, message="Tenant suspended successfully", data=tenant
        )


@router.patch("/{tenant_id}/activate", response_model=APIResponse[Tenant])
async def activate_tenant(
    tenant_id: str, x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """Reactivate tenant."""
    try:
        tenant_uuid = UUID(tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant ID format")

    pool = await get_db_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE tenants
            SET status = 'active', updated_by = $1
            WHERE id = $2
            RETURNING *
            """,
            UUID(x_user_id) if x_user_id else None,
            tenant_uuid,
        )

        if not row:
            raise HTTPException(status_code=404, detail="Tenant not found")

        tenant = row_to_tenant(row)

        return APIResponse(
            success=True, message="Tenant activated successfully", data=tenant
        )


@router.patch("/{tenant_id}/licenses", response_model=APIResponse[Tenant])
async def update_license_pool(
    tenant_id: str,
    license_pool: int = Query(..., ge=0, description="New license pool size"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
):
    """
    Update tenant license pool.

    Validates that new pool size is not less than current usage.
    """
    try:
        tenant_uuid = UUID(tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant ID format")

    pool = await get_db_pool()

    async with pool.acquire() as conn:
        # Check current usage
        existing = await conn.fetchrow(
            "SELECT licenses_used, license_pool FROM tenants WHERE id = $1", tenant_uuid
        )

        if not existing:
            raise HTTPException(status_code=404, detail="Tenant not found")

        if license_pool < existing["licenses_used"]:
            raise HTTPException(
                status_code=400,
                detail=f"License pool cannot be less than current usage ({existing['licenses_used']})",
            )

        row = await conn.fetchrow(
            """
            UPDATE tenants
            SET license_pool = $1, updated_by = $2
            WHERE id = $3
            RETURNING *
            """,
            license_pool,
            UUID(x_user_id) if x_user_id else None,
            tenant_uuid,
        )

        tenant = row_to_tenant(row)

        return APIResponse(
            success=True, message="License pool updated successfully", data=tenant
        )


@router.get("/{tenant_id}/licenses", response_model=APIResponse[dict])
async def get_license_usage(tenant_id: str):
    """
    Get license usage details for a tenant.
    """
    try:
        tenant_uuid = UUID(tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant ID format")

    pool = await get_db_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT 
                license_pool,
                licenses_used,
                (license_pool - licenses_used) as licenses_available
            FROM tenants
            WHERE id = $1
            """,
            tenant_uuid,
        )

        if not row:
            raise HTTPException(status_code=404, detail="Tenant not found")

        usage_data = {
            "license_pool": row["license_pool"],
            "licenses_used": row["licenses_used"],
            "licenses_available": row["licenses_available"],
        }

        return APIResponse(
            success=True,
            message="License usage retrieved successfully",
            data=usage_data,
        )


@router.get("", response_model=PaginatedResponse[Tenant])
async def list_tenants(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    subscription_plan: Optional[str] = Query(
        None, description="Filter by subscription plan"
    ),
    search: Optional[str] = Query(None, description="Search by name or email"),
):
    """
    List tenants with pagination and filtering.
    """
    pool = await get_db_pool()

    async with pool.acquire() as conn:
        # Build WHERE clause
        where_conditions = []
        query_params = []
        param_num = 1

        if status:
            where_conditions.append(f"status = ${param_num}")
            query_params.append(status)
            param_num += 1

        if subscription_plan:
            where_conditions.append(f"subscription_plan = ${param_num}")
            query_params.append(subscription_plan)
            param_num += 1

        if search:
            where_conditions.append(
                f"(name ILIKE ${param_num} OR primary_contact_email ILIKE ${param_num})"
            )
            search_pattern = f"%{search}%"
            query_params.append(search_pattern)
            query_params.append(search_pattern)
            param_num += 2

        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"

        # Get total count
        count_query = f"SELECT COUNT(*) FROM tenants WHERE {where_clause}"
        total = await conn.fetchval(count_query, *query_params)

        # Calculate pagination
        offset = (page - 1) * page_size
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0

        # Get paginated results
        query_params.append(page_size)
        query_params.append(offset)

        rows = await conn.fetch(
            f"""
            SELECT * FROM tenants
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ${param_num} OFFSET ${param_num + 1}
            """,
            *query_params,
        )

        tenants = [row_to_tenant(row) for row in rows]

        return PaginatedResponse(
            items=tenants,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
