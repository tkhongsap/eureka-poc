"""add_asset_phase1_complete

Revision ID: 006_asset_phase1_complete
Revises: 005_create_assets
Create Date: 2024-12-12

Add GIS fields to assets, create downtime and meter reading tables.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '006_asset_phase1_complete'
down_revision = '005_create_assets'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add GIS and QR fields to assets table
    op.add_column('assets', sa.Column('latitude', sa.Float(), nullable=True))
    op.add_column('assets', sa.Column('longitude', sa.Float(), nullable=True))
    op.add_column('assets', sa.Column('qr_code', sa.String(255), nullable=True))
    
    # Create asset_downtimes table
    op.create_table(
        'asset_downtimes',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('asset_id', sa.String(50), sa.ForeignKey('assets.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=True),
        sa.Column('reason', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('production_loss', sa.Float(), nullable=True),
        sa.Column('work_order_id', sa.Integer(), nullable=True),
        sa.Column('reported_by', sa.String(100), nullable=True),
        sa.Column('resolved_by', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_asset_downtimes_asset_id', 'asset_downtimes', ['asset_id'])
    op.create_index('ix_asset_downtimes_start_time', 'asset_downtimes', ['start_time'])
    
    # Create meter_readings table
    op.create_table(
        'meter_readings',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('asset_id', sa.String(50), sa.ForeignKey('assets.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('meter_type', sa.String(50), nullable=False),
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(20), nullable=False),
        sa.Column('previous_value', sa.Float(), nullable=True),
        sa.Column('reading_date', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('source', sa.String(50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('recorded_by', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_meter_readings_asset_id', 'meter_readings', ['asset_id'])
    op.create_index('ix_meter_readings_reading_date', 'meter_readings', ['reading_date'])
    op.create_index('ix_meter_readings_meter_type', 'meter_readings', ['meter_type'])


def downgrade() -> None:
    # Drop meter_readings table
    op.drop_index('ix_meter_readings_meter_type', 'meter_readings')
    op.drop_index('ix_meter_readings_reading_date', 'meter_readings')
    op.drop_index('ix_meter_readings_asset_id', 'meter_readings')
    op.drop_table('meter_readings')
    
    # Drop asset_downtimes table
    op.drop_index('ix_asset_downtimes_start_time', 'asset_downtimes')
    op.drop_index('ix_asset_downtimes_asset_id', 'asset_downtimes')
    op.drop_table('asset_downtimes')
    
    # Remove columns from assets
    op.drop_column('assets', 'qr_code')
    op.drop_column('assets', 'longitude')
    op.drop_column('assets', 'latitude')
