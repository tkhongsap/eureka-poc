"""
Site CRUD routes for Eureka CMMS.

This module provides REST API endpoints for site management operations,
including creation, retrieval, update, deletion, and status management.
Sites belong to tenants and have their own license allocation.
"""

import json
from decimal import Decimal
from typing import Optional
from uuid import UUID

import asyncpg
from config import get_db_pool
from fastapi import APIRouter, Header, HTTPException, Query
from models import (
    APIResponse,
    PaginatedResponse,
    Site,
    SiteCreate,
    SiteCriticality,
    SiteStatus,
    SiteType,
    SiteUpdate,
)

router = APIRouter(prefix="/api/tenants", tags=["Sites"])


async def generate_site_code(conn: asyncpg.Connection, tenant_id: UUID) -> str:
    """
    Generate the next site code (SITE-001, SITE-002, etc.) for a tenant.

    Args:
        conn: Database connection
        tenant_id: Tenant UUID

    Returns:
        str: Next available site code for the tenant
    """
    result = await conn.fetchval(
        """
        SELECT MAX(CAST(SUBSTRING(code FROM 6) AS INTEGER))
        FROM sites
        WHERE tenant_id = $1 AND code ~ '^SITE-[0-9]+$'
        """,
        tenant_id,
    )

    next_num = (result or 0) + 1
    return f"SITE-{next_num:03d}"


def row_to_site(row: asyncpg.Record) -> Site:
    """
    Convert a database row to a Site Pydantic model.

    Args:
        row: Database row record

    Returns:
        Site: Site model instance
    """
    return Site(
        id=row["id"],
        tenant_id=row["tenant_id"],
        code=row["code"],
        name=row["name"],
        site_type=SiteType(row["site_type"]),
        criticality=SiteCriticality(row["criticality"]),
        address_line1=row["address_line1"],
        address_line2=row["address_line2"],
        city=row["city"],
        state_province=row["state_province"],
        postal_code=row["postal_code"],
        country=row["country"],
        latitude=row["latitude"],
        longitude=row["longitude"],
        site_manager_name=row["site_manager_name"],
        site_manager_email=row["site_manager_email"],
        site_manager_phone=row["site_manager_phone"],
        emergency_contact_name=row["emergency_contact_name"],
        emergency_contact_phone=row["emergency_contact_phone"],
        license_allocation=row["license_allocation"],
        licenses_used=row["licenses_used"],
        timezone=row["timezone"],
        currency=row["currency"],
        language=row["language"],
        date_format=row["date_format"],
        status=SiteStatus(row["status"]),
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


@router.post("/{tenant_id}/sites", response_model=APIResponse[Site], status_code=201)
async def create_site(
    tenant_id: str,
    site_data: SiteCreate,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
):
    """
    Create a new site under a tenant with auto-generated code (SITE-001).

    Validates that tenant exists and is active, and that license allocation
    does not exceed tenant's available license pool.
    """
    try:
        tenant_uuid = UUID(tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant ID format")

    pool = await get_db_pool()

    async with pool.acquire() as conn:
        # Verify tenant exists and is active
        tenant = await conn.fetchrow(
            "SELECT id, license_pool, status FROM tenants WHERE id = $1", tenant_uuid
        )

        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")

        if tenant["status"] != "active":
            raise HTTPException(
                status_code=400,
                detail="Cannot create site for inactive or suspended tenant",
            )

        # Calculate total license allocation across all sites for this tenant
        total_allocated = await conn.fetchval(
            """
            SELECT COALESCE(SUM(license_allocation), 0)
            FROM sites
            WHERE tenant_id = $1
            """,
            tenant_uuid,
        )

        # Validate license allocation
        available_licenses = tenant["license_pool"] - total_allocated
        if site_data.license_allocation > available_licenses:
            raise HTTPException(
                status_code=400,
                detail=f"License allocation ({site_data.license_allocation}) exceeds available licenses ({available_licenses}) for this tenant",
            )

        # Generate site code
        code = await generate_site_code(conn, tenant_uuid)

        # Prepare data for insertion
        insert_data = {
            "tenant_id": tenant_uuid,
            "code": code,
            "name": site_data.name,
            "site_type": site_data.site_type.value,
            "criticality": site_data.criticality.value,
            "address_line1": site_data.address_line1,
            "address_line2": site_data.address_line2,
            "city": site_data.city,
            "state_province": site_data.state_province,
            "postal_code": site_data.postal_code,
            "country": site_data.country,
            "latitude": site_data.latitude,
            "longitude": site_data.longitude,
            "site_manager_name": site_data.site_manager_name,
            "site_manager_email": site_data.site_manager_email,
            "site_manager_phone": site_data.site_manager_phone,
            "emergency_contact_name": site_data.emergency_contact_name,
            "emergency_contact_phone": site_data.emergency_contact_phone,
            "license_allocation": site_data.license_allocation,
            "timezone": site_data.timezone,
            "currency": site_data.currency,
            "language": site_data.language,
            "date_format": site_data.date_format,
            "settings": json.dumps(site_data.settings),
            "created_by": UUID(x_user_id) if x_user_id else None,
        }

        try:
            # Insert site
            row = await conn.fetchrow(
                """
                INSERT INTO sites (
                    tenant_id, code, name, site_type, criticality,
                    address_line1, address_line2, city, state_province,
                    postal_code, country, latitude, longitude,
                    site_manager_name, site_manager_email, site_manager_phone,
                    emergency_contact_name, emergency_contact_phone,
                    license_allocation, timezone, currency, language,
                    date_format, settings, created_by
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                    $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
                )
                RETURNING *
                """,
                insert_data["tenant_id"],
                insert_data["code"],
                insert_data["name"],
                insert_data["site_type"],
                insert_data["criticality"],
                insert_data["address_line1"],
                insert_data["address_line2"],
                insert_data["city"],
                insert_data["state_province"],
                insert_data["postal_code"],
                insert_data["country"],
                insert_data["latitude"],
                insert_data["longitude"],
                insert_data["site_manager_name"],
                insert_data["site_manager_email"],
                insert_data["site_manager_phone"],
                insert_data["emergency_contact_name"],
                insert_data["emergency_contact_phone"],
                insert_data["license_allocation"],
                insert_data["timezone"],
                insert_data["currency"],
                insert_data["language"],
                insert_data["date_format"],
                insert_data["settings"],
                insert_data["created_by"],
            )

            site = row_to_site(row)

            return APIResponse(
                success=True, message="Site created successfully", data=site
            )

        except asyncpg.UniqueViolationError:
            raise HTTPException(
                status_code=409,
                detail="Site with this code already exists for this tenant",
            )
        except asyncpg.ForeignKeyViolationError:
            raise HTTPException(status_code=400, detail="Invalid tenant reference")
        except asyncpg.CheckViolationError as e:
            raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")


@router.get("/{tenant_id}/sites/{site_id}", response_model=APIResponse[Site])
async def get_site(tenant_id: str, site_id: str):
    """Get a site by UUID, ensuring it belongs to the specified tenant."""
    try:
        tenant_uuid = UUID(tenant_id)
        site_uuid = UUID(site_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    pool = await get_db_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM sites WHERE id = $1 AND tenant_id = $2",
            site_uuid,
            tenant_uuid,
        )

        if not row:
            raise HTTPException(status_code=404, detail="Site not found")

        site = row_to_site(row)

        return APIResponse(
            success=True, message="Site retrieved successfully", data=site
        )


@router.put("/{tenant_id}/sites/{site_id}", response_model=APIResponse[Site])
async def update_site(
    tenant_id: str,
    site_id: str,
    site_update: SiteUpdate,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
):
    """
    Update site fields. Only provided fields will be updated.

    Validates license allocation changes against tenant's available pool.
    """
    try:
        tenant_uuid = UUID(tenant_id)
        site_uuid = UUID(site_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    pool = await get_db_pool()

    async with pool.acquire() as conn:
        # Check if site exists and belongs to tenant
        existing = await conn.fetchrow(
            "SELECT * FROM sites WHERE id = $1 AND tenant_id = $2",
            site_uuid,
            tenant_uuid,
        )

        if not existing:
            raise HTTPException(status_code=404, detail="Site not found")

        # Get tenant license pool
        tenant = await conn.fetchrow(
            "SELECT license_pool FROM tenants WHERE id = $1", tenant_uuid
        )

        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")

        # Build dynamic UPDATE query
        update_fields = []
        update_values = []
        param_num = 1

        update_data = site_update.model_dump(exclude_unset=True)

        # Validate license allocation if being updated
        if "license_allocation" in update_data:
            new_allocation = update_data["license_allocation"]

            # Calculate total allocation excluding current site
            total_other_allocated = await conn.fetchval(
                """
                SELECT COALESCE(SUM(license_allocation), 0)
                FROM sites
                WHERE tenant_id = $1 AND id != $2
                """,
                tenant_uuid,
                site_uuid,
            )

            available_licenses = tenant["license_pool"] - total_other_allocated

            if new_allocation > available_licenses:
                raise HTTPException(
                    status_code=400,
                    detail=f"License allocation ({new_allocation}) exceeds available licenses ({available_licenses}) for this tenant",
                )

            if new_allocation < existing["licenses_used"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"License allocation cannot be less than current usage ({existing['licenses_used']})",
                )

        # Build update query dynamically
        field_mapping = {
            "name": "name",
            "site_type": "site_type",
            "criticality": "criticality",
            "address_line1": "address_line1",
            "address_line2": "address_line2",
            "city": "city",
            "state_province": "state_province",
            "postal_code": "postal_code",
            "country": "country",
            "latitude": "latitude",
            "longitude": "longitude",
            "site_manager_name": "site_manager_name",
            "site_manager_email": "site_manager_email",
            "site_manager_phone": "site_manager_phone",
            "emergency_contact_name": "emergency_contact_name",
            "emergency_contact_phone": "emergency_contact_phone",
            "license_allocation": "license_allocation",
            "timezone": "timezone",
            "currency": "currency",
            "language": "language",
            "date_format": "date_format",
            "status": "status",
            "settings": "settings",
        }

        for field, value in update_data.items():
            if field in field_mapping:
                db_field = field_mapping[field]

                if field == "site_type":
                    update_fields.append(f"{db_field} = ${param_num}")
                    update_values.append(value.value)
                elif field == "criticality":
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
            # No fields to update, return existing site
            site = row_to_site(existing)
            return APIResponse(success=True, message="No changes provided", data=site)

        # Add updated_by
        update_fields.append(f"updated_by = ${param_num}")
        update_values.append(UUID(x_user_id) if x_user_id else None)
        param_num += 1

        # Add WHERE clause parameters
        update_values.append(site_uuid)
        update_values.append(tenant_uuid)

        query = f"""
            UPDATE sites
            SET {', '.join(update_fields)}
            WHERE id = ${param_num} AND tenant_id = ${param_num + 1}
            RETURNING *
        """

        try:
            row = await conn.fetchrow(query, *update_values)
            site = row_to_site(row)

            return APIResponse(
                success=True, message="Site updated successfully", data=site
            )
        except asyncpg.CheckViolationError as e:
            raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")


@router.delete("/{tenant_id}/sites/{site_id}", response_model=APIResponse[Site])
async def delete_site(
    tenant_id: str,
    site_id: str,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
):
    """
    Soft delete site by setting status to 'inactive'.
    """
    try:
        tenant_uuid = UUID(tenant_id)
        site_uuid = UUID(site_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    pool = await get_db_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE sites
            SET status = 'inactive', updated_by = $1
            WHERE id = $2 AND tenant_id = $3
            RETURNING *
            """,
            UUID(x_user_id) if x_user_id else None,
            site_uuid,
            tenant_uuid,
        )

        if not row:
            raise HTTPException(status_code=404, detail="Site not found")

        site = row_to_site(row)

        return APIResponse(
            success=True, message="Site deactivated successfully", data=site
        )


@router.patch(
    "/{tenant_id}/sites/{site_id}/maintenance",
    response_model=APIResponse[Site],
)
async def set_maintenance_mode(
    tenant_id: str,
    site_id: str,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
):
    """Set site to maintenance mode (temporarily offline)."""
    try:
        tenant_uuid = UUID(tenant_id)
        site_uuid = UUID(site_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    pool = await get_db_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE sites
            SET status = 'maintenance', updated_by = $1
            WHERE id = $2 AND tenant_id = $3
            RETURNING *
            """,
            UUID(x_user_id) if x_user_id else None,
            site_uuid,
            tenant_uuid,
        )

        if not row:
            raise HTTPException(status_code=404, detail="Site not found")

        site = row_to_site(row)

        return APIResponse(
            success=True, message="Site set to maintenance mode", data=site
        )


@router.patch("/{tenant_id}/sites/{site_id}/activate", response_model=APIResponse[Site])
async def activate_site(
    tenant_id: str,
    site_id: str,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
):
    """Reactivate site."""
    try:
        tenant_uuid = UUID(tenant_id)
        site_uuid = UUID(site_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    pool = await get_db_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE sites
            SET status = 'active', updated_by = $1
            WHERE id = $2 AND tenant_id = $3
            RETURNING *
            """,
            UUID(x_user_id) if x_user_id else None,
            site_uuid,
            tenant_uuid,
        )

        if not row:
            raise HTTPException(status_code=404, detail="Site not found")

        site = row_to_site(row)

        return APIResponse(
            success=True, message="Site activated successfully", data=site
        )


@router.get("/{tenant_id}/sites", response_model=PaginatedResponse[Site])
async def list_sites(
    tenant_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    site_type: Optional[str] = Query(None, description="Filter by site type"),
    criticality: Optional[str] = Query(None, description="Filter by criticality"),
    search: Optional[str] = Query(None, description="Search by name"),
):
    """
    List sites for a tenant with pagination and filtering.
    """
    try:
        tenant_uuid = UUID(tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant ID format")

    pool = await get_db_pool()

    async with pool.acquire() as conn:
        # Verify tenant exists
        tenant_exists = await conn.fetchval(
            "SELECT EXISTS(SELECT 1 FROM tenants WHERE id = $1)", tenant_uuid
        )

        if not tenant_exists:
            raise HTTPException(status_code=404, detail="Tenant not found")

        # Build WHERE clause
        where_conditions = ["tenant_id = $1"]
        query_params = [tenant_uuid]
        param_num = 2

        if status:
            where_conditions.append(f"status = ${param_num}")
            query_params.append(status)
            param_num += 1

        if site_type:
            where_conditions.append(f"site_type = ${param_num}")
            query_params.append(site_type)
            param_num += 1

        if criticality:
            where_conditions.append(f"criticality = ${param_num}")
            query_params.append(criticality)
            param_num += 1

        if search:
            where_conditions.append(f"name ILIKE ${param_num}")
            search_pattern = f"%{search}%"
            query_params.append(search_pattern)
            param_num += 1

        where_clause = " AND ".join(where_conditions)

        # Get total count
        count_query = f"SELECT COUNT(*) FROM sites WHERE {where_clause}"
        total = await conn.fetchval(count_query, *query_params)

        # Calculate pagination
        offset = (page - 1) * page_size
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0

        # Get paginated results
        query_params.append(page_size)
        query_params.append(offset)

        rows = await conn.fetch(
            f"""
            SELECT * FROM sites
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ${param_num} OFFSET ${param_num + 1}
            """,
            *query_params,
        )

        sites = [row_to_site(row) for row in rows]

        return PaginatedResponse(
            items=sites,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
