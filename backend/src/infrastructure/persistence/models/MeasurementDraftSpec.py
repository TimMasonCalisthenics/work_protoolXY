from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String , Column , Integer , ForeignKey , JSON
from infrastructure.database.database import db
from datetime import datetime
from sqlalchemy import DateTime , Float , Boolean
from sqlalchemy.orm import relationship


class MeasurementDraftSpec(db.Model):
    __tablename__ = "measurement_draft_specs"

    id:Mapped[int] = mapped_column(primary_key=True)

    measurement_id = mapped_column(
        ForeignKey("measurements.id"),
        index=True,
        nullable=False
    )

    spec_point_id = mapped_column(
        ForeignKey("product_spec_points.id"),
        nullable=False
    )

    point_name = mapped_column(String(50), nullable=False)

    min_value = mapped_column(Float, nullable=False)
    max_value = mapped_column(Float, nullable=False)
    nominal_value = mapped_column(Float, nullable=False)

    sensor_type = mapped_column(String(50), default="mitutoyo")
    sensor_device_id = mapped_column(String(50), nullable=False)
    value_key = mapped_column(String(50), nullable=False)
    active_value = mapped_column(Boolean, default=False)
    status = mapped_column(String(20), default="pending")
    group_id = mapped_column(Integer, default=0)
    rule_type = mapped_column(String(20), default="normal")
    required_count = mapped_column(Integer, default=1)

    final_value = mapped_column(Float, nullable=True)
    is_pass = mapped_column(Boolean, nullable=True)
    is_completed = mapped_column(Boolean, default=False)

    measurement = relationship("MeasurementModel")
