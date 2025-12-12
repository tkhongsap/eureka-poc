"""Create assets table

Revision ID: 005_create_assets
Revises: 604bd8654649
Create Date: 2024-12-12 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '005_create_assets'
down_revision: Union[str, None] = '604bd8654649'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'assets',
        sa.Column('id', sa.String(50), primary_key=True, nullable=False),
        sa.Column('name', sa.String(200), nullable=False, index=True),
        sa.Column('type', sa.String(50), nullable=False, index=True),  # Site, Line, Facility, Machine, Equipment
        sa.Column('status', sa.String(50), nullable=False, server_default='Operational', index=True),  # Operational, Downtime, Maintenance
        sa.Column('health_score', sa.Integer, server_default='100'),
        sa.Column('location', sa.String(200)),
        sa.Column('criticality', sa.String(20), server_default='Medium'),  # Critical, High, Medium, Low
        sa.Column('model', sa.String(100)),
        sa.Column('manufacturer', sa.String(100)),
        sa.Column('serial_number', sa.String(100)),
        sa.Column('install_date', sa.String(20)),
        sa.Column('warranty_expiry', sa.String(20)),
        sa.Column('description', sa.Text),
        sa.Column('parent_id', sa.String(50), sa.ForeignKey('assets.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('created_by', sa.String(100)),
        sa.Column('updated_by', sa.String(100)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Create index for faster tree queries
    op.create_index('ix_assets_parent_type', 'assets', ['parent_id', 'type'])


def downgrade() -> None:
    op.drop_index('ix_assets_parent_type', table_name='assets')
    op.drop_table('assets')
