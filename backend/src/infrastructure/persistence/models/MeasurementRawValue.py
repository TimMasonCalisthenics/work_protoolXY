from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String , Column , Integer , ForeignKey , JSON
from infrastructure.database.database import db
from datetime import datetime
from sqlalchemy import DateTime
from sqlalchemy.orm import relationship

class MeasurementRawValue(db.Model):
    __tablename__ = 'measurement_raw_values'

    id: Mapped[int] = mapped_column(primary_key=True)

    measurement_id: Mapped[int] = mapped_column(
        db.ForeignKey('measurements.id'),
        index=True,
        nullable=False
    )

    spec_point_id: Mapped[int] = mapped_column(
        db.ForeignKey('product_spec_points.id'),
        index=True,
        nullable=False
    )

    sensor_device_id: Mapped[str] = mapped_column(db.String(50), nullable=False)

    raw_value: Mapped[float] = mapped_column(db.Float, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    measurement = relationship("MeasurementModel")
    spec_point = relationship("ProductSpecPointModel")
