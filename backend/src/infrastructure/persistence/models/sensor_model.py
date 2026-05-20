from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String , Column ,JSON , Integer , DateTime
from infrastructure.database.database import db


class SensorModel(db.Model):
    __bind_key__ = 'cache_db'
    __tablename__ = 'sensors'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    device_id: Mapped[str] = mapped_column(String(50), nullable=False)
    product_code: Mapped[str] = mapped_column(String(50), nullable=False)
    measurements: Mapped[dict] = mapped_column(JSON, nullable=True)
    timestamp: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)


