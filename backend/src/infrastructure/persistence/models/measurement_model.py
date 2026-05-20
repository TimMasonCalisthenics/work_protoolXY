from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String , Column , Integer , ForeignKey , JSON
from infrastructure.database.database import db
from datetime import datetime
from sqlalchemy import DateTime
from sqlalchemy.orm import relationship

class MeasurementModel(db.Model):
    __tablename__ = 'measurements'
    id: Mapped[int] = mapped_column(db.Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)

    serial_a = Column(String(100), index=True)
    serial_b = Column(String(100), index=True)
    details = Column(JSON, nullable=True)
    status = Column(String(10), nullable=False)
    stage = Column(String(20), nullable=False)
    flow_stages = Column(JSON , nullable=False)
    final_result = Column(String(10), nullable=True)

    created_at: Mapped[datetime] = mapped_column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    operator = relationship("UserModel", back_populates="measurements")
    product = relationship("ProductModel", back_populates="measurements")
    measurement_details = relationship("MeasurementDetail",back_populates="measurement")

class MeasurementDetail(db.Model):
    __tablename__ = 'measurement_details'
    id: Mapped[int] = mapped_column(primary_key=True)
    measurement_id: Mapped[int] = mapped_column(db.ForeignKey('measurements.id'), index=True)
    point_name: Mapped[str] = mapped_column(db.String(50) , nullable=True)
    measured_value: Mapped[float] = mapped_column(db.Float , nullable=True)

    nominal_value: Mapped[float] = mapped_column(db.Float , nullable=True)
    upper_limit: Mapped[float] = mapped_column(db.Float , nullable=True)
    lower_limit: Mapped[float] = mapped_column(db.Float , nullable=True)

    is_pass: Mapped[bool] = mapped_column(db.Boolean, index=True)
    measurement = relationship("MeasurementModel", back_populates="measurement_details")