"""
Database configuration and connection management for Eureka CMMS.

This module provides async PostgreSQL connection pool management using asyncpg.
"""

import os
from typing import Optional

import asyncpg
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection pool (singleton)
_db_pool: Optional[asyncpg.Pool] = None


def get_database_url() -> str:
    """
    Get database connection URL from environment variable.

    Defaults to local development database if DATABASE_URL is not set.
    """
    return os.getenv(
        "DATABASE_URL", "postgresql://eureka:eureka_dev@localhost:5432/eureka_cmms"
    )


async def get_db_pool() -> asyncpg.Pool:
    """
    Get or create the database connection pool.

    Returns:
        asyncpg.Pool: The database connection pool

    Raises:
        asyncpg.PostgresError: If connection to database fails
    """
    global _db_pool

    if _db_pool is None:
        database_url = get_database_url()
        _db_pool = await asyncpg.create_pool(
            database_url, min_size=2, max_size=10, command_timeout=60
        )

    return _db_pool


async def get_db_connection():
    """
    Get a database connection from the pool.

    Yields:
        asyncpg.Connection: A database connection

    Example:
        async with get_db_connection() as conn:
            rows = await conn.fetch("SELECT * FROM tenants")
    """
    pool = await get_db_pool()
    async with pool.acquire() as connection:
        yield connection


async def close_db_pool():
    """
    Close the database connection pool.

    Should be called on application shutdown.
    """
    global _db_pool

    if _db_pool is not None:
        await _db_pool.close()
        _db_pool = None
