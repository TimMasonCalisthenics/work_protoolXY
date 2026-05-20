from datetime import datetime
from sqlalchemy import String, Float, DateTime, Integer , ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from infrastructure.database.database import db

class SystemSetting(db.Model):
    __tablename__ = "system_settings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    active_product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id"),
        nullable=True
    )
    active_draft_id: Mapped[int] = mapped_column(
        ForeignKey("measurements.id"),
        nullable=True
    )
    last_active_draft_time: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    is_debug_mode: Mapped[bool] = mapped_column(db.Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)