"""
Database initialization script for Eureka CMMS.

This script runs all SQL migration files in order to set up the database schema.
Run this after starting the PostgreSQL container.
"""

import asyncio
import os
import sys
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get migrations directory
MIGRATIONS_DIR = Path(__file__).parent.parent / "migrations"


def get_database_url() -> str:
    """Get database connection URL from environment variable."""
    return os.getenv(
        "DATABASE_URL", "postgresql://eureka:eureka_dev@localhost:5432/eureka_cmms"
    )


async def run_migrations():
    """Run all migration files in order."""
    database_url = get_database_url()

    print(f"Connecting to database...")
    conn = await asyncpg.connect(database_url)

    try:
        # Get all migration files sorted by name
        migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))

        if not migration_files:
            print("No migration files found!")
            return

        print(f"Found {len(migration_files)} migration file(s)")

        for migration_file in migration_files:
            print(f"\nRunning migration: {migration_file.name}")

            with open(migration_file, "r", encoding="utf-8") as f:
                sql = f.read()

            # Execute migration
            await conn.execute(sql)
            print(f"✓ Completed: {migration_file.name}")

        print("\n✓ All migrations completed successfully!")

    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        sys.exit(1)
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run_migrations())
