from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String , Column ,JSON
from infrastructure.database.database import db
from datetime import datetime
from sqlalchemy import DateTime
from sqlalchemy.orm import relationship
class ProductModel(db.Model):
    __tablename__ = 'products'
    id: Mapped[int] = mapped_column(db.Integer, primary_key=True)
    product_name: Mapped[str] = mapped_column(db.String(100), nullable=False)
    # spec_config = Column(JSON, nullable=False)
    is_deleted = Column(db.Boolean, default=False, nullable=False)

    tmp_duplicate: Mapped[int] = mapped_column(db.Integer , nullable=True , default=0)
    option_condition: Mapped[str] = mapped_column(db.String(50), nullable=True, default='normal')
    option_save: Mapped[str] = mapped_column(db.String(50), nullable=True, default='all')

    image_url = Column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    spec_points = relationship("ProductSpecPointModel", back_populates="product", cascade="all, delete-orphan")
    measurements = relationship("MeasurementModel", back_populates="product")


class ProductSpecPointModel(db.Model):
    __tablename__ = 'product_spec_points'
    id: Mapped[int] = mapped_column(db.Integer, primary_key=True)
    product_id = Column(db.Integer, db.ForeignKey('products.id'), nullable=False)

    point_name: Mapped[str] = mapped_column(db.String(50), nullable=False)
    point_image_url: Mapped[str] = mapped_column(db.String(255), nullable=True)

    nominal_value: Mapped[float] = mapped_column(db.Float, nullable=False)
    min_value: Mapped[float] = mapped_column(db.Float, nullable=False)
    max_value: Mapped[float] = mapped_column(db.Float, nullable=False)

    ctrl_min_value: Mapped[float] = mapped_column(db.Float, nullable=True)
    ctrl_max_value: Mapped[float] = mapped_column(db.Float, nullable=True)
    start_value: Mapped[float] = mapped_column(db.Float, nullable=True)
    active_value: Mapped[bool] = mapped_column(db.Boolean, nullable=True)
    rule_type: Mapped[str] = mapped_column(db.String(20), default="normal")
    group_id: Mapped[int] = mapped_column(db.Integer, default=0)
    required_count: Mapped[int] = mapped_column(db.Integer, default=1)

    sensor_type: Mapped[str] = mapped_column(db.String(50), nullable=True)
    assigned_sensor_device_id: Mapped[str] = mapped_column(db.String(50), nullable=True)
    sensor_value_key: Mapped[str] = mapped_column(db.String(50), nullable=True, default='value')

    product = relationship("ProductModel", back_populates="spec_points")