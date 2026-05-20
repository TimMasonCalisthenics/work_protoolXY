"""merge branching migrations

Revision ID: f627c389211e
Revises: ddfe961e3880, eddeede72477
Create Date: 2026-03-03 11:27:47.839090

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f627c389211e'
down_revision = ('ddfe961e3880', 'eddeede72477')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
