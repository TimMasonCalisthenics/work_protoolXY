from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String
from infrastructure.database.database import db
from datetime import datetime
from sqlalchemy import DateTime
from sqlalchemy.orm import relationship
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    OPERATOR = "operator"
    SUPERVISOR = "supervisor"

class UserModel(db.Model):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    # role: Mapped[str] = mapped_column(String(20), default='operator')
    role: Mapped[UserRole] = mapped_column(default=UserRole.OPERATOR)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    measurements = relationship("MeasurementModel", back_populates="operator")
