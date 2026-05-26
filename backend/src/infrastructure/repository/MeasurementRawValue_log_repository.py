from typing import List, Optional
from sqlalchemy import func
from infrastructure.database.database import db
from infrastructure.persistence.models.MeasurementRawValueLog import MeasurementRawValueLog
from datetime import datetime

class MeasurementRawValueLogRepository:
    def __init__(self, db):
        self.db = db
    # ---------- CREATE RAW ----------
    def create(
        self,
        measurement_id: int,
        spec_point_id: int,
        sensor_device_id: str,
        raw_value: float,
        created_at:datetime
    ) -> MeasurementRawValueLog:

        raw = MeasurementRawValueLog(
            measurement_id=measurement_id,
            spec_point_id=spec_point_id,
            sensor_device_id=sensor_device_id,
            raw_value=raw_value,
            created_at=created_at
        )

        db.session.add(raw)
        db.session.flush()
        return raw
    # ---------- CREATE RAW LIST ----------
    def create_list(
        self,
        raws: List[MeasurementRawValueLog]
    ):
        db.session.add_all(raws)
        db.session.flush()

    # ---------- GET RAW VALUES ----------
    def get_by_measurement_and_point(
        self,
        measurement_id: int,
        spec_point_id: int,
        limit: int = 1
    ) -> List[MeasurementRawValueLog]:

        return (
            db.session.query(MeasurementRawValueLog)
            .filter(
                MeasurementRawValueLog.measurement_id == measurement_id,
                MeasurementRawValueLog.spec_point_id == spec_point_id
            )
            .order_by(MeasurementRawValueLog.created_at.desc())
            .limit(limit)
            .all()
        )
    # ---------- GET RAW VALUES BY DEVICE ID ----------
    def get_by_measurement_and_device(self, measurement_id: int, device_id: str):
        return MeasurementRawValueLog.query.filter_by(
            measurement_id=measurement_id,
            sensor_device_id=device_id
        ).all()
    # ---------- GET LATEST GROUPED ----------
    def get_latest_grouped(
        self, 
        measurement_id: int, 
        device_id: str, 
        limit_per_group
    ):
        subq = (
            db.session.query(
                MeasurementRawValueLog.id,
                MeasurementRawValueLog.spec_point_id,
                MeasurementRawValueLog.raw_value,
                func.row_number().over(
                    partition_by=MeasurementRawValueLog.spec_point_id,
                    order_by=MeasurementRawValueLog.id.desc()
                ).label("rn")
            )
            .filter(
                MeasurementRawValueLog.measurement_id == measurement_id,
                MeasurementRawValueLog.sensor_device_id == device_id
            )
            .subquery()
        )

        rows = (
            db.session.query(subq)
            .filter(subq.c.rn <= limit_per_group)
            .all()
        )

        return rows

    # ---------- GET LOGS WITH QUERY ----------
    def get_logs_with_query(
        self,
        measurement_id: Optional[int] = None,
        spec_point_id: Optional[int] = None,
        point_name: Optional[str] = None,
        sensor_device_id: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ):
        from sqlalchemy.orm import joinedload
        query = db.session.query(MeasurementRawValueLog).options(joinedload(MeasurementRawValueLog.spec_point))
        
        if measurement_id is not None:
            query = query.filter(MeasurementRawValueLog.measurement_id == measurement_id)
        if spec_point_id is not None:
            query = query.filter(MeasurementRawValueLog.spec_point_id == spec_point_id)
        if sensor_device_id is not None:
            query = query.filter(MeasurementRawValueLog.sensor_device_id == sensor_device_id)
        if point_name is not None and point_name.strip() != "":
            from infrastructure.persistence.models.product_model import ProductSpecPointModel
            query = query.join(ProductSpecPointModel, MeasurementRawValueLog.spec_point_id == ProductSpecPointModel.id)
            query = query.filter(ProductSpecPointModel.point_name.ilike(f"%{point_name}%"))
            
        total = query.count()
        offset = (page - 1) * limit
        items = query.order_by(MeasurementRawValueLog.created_at.desc()).offset(offset).limit(limit).all()
        
        return items, total
        
    # ---------- CLEAR ALL LOGS ----------
    def clear_all(self):
        db.session.query(MeasurementRawValueLog).delete(synchronize_session=False)
        db.session.commit()

    # ---------- COUNT RAW ----------
    def count_by_measurement_and_point(
        self,
        measurement_id: int,
        spec_point_id: int
    ) -> int:

        return (
            db.session.query(func.count(MeasurementRawValueLog.id))
            .filter(
                MeasurementRawValueLog.measurement_id == measurement_id,
                MeasurementRawValueLog.spec_point_id == spec_point_id
            )
            .scalar()
        )
    # ---------- CLEAR RAW BY POINT ----------
    def clear_by_point(self, measurement_id: int, spec_point_id: int):
        (
            db.session.query(MeasurementRawValueLog)
            .filter(
                MeasurementRawValueLog.measurement_id == measurement_id,
                MeasurementRawValueLog.spec_point_id == spec_point_id
            )
            .delete(synchronize_session=False)
        )
        db.session.commit()

    # ---------- DELETE RAW BY MEASUREMENT ----------
    def delete_by_measurement(self, measurement_id: int):
        (
            db.session.query(MeasurementRawValueLog)
            .filter(MeasurementRawValueLog.measurement_id == measurement_id)
            .delete(synchronize_session=False)
        )
    def clear_tmp(self):
        db.session.query(MeasurementRawValueLog).delete(synchronize_session=False)
        db.session.commit()

    def clear_tmp_by_point(self,  spec_point_ids: list):
        if not spec_point_ids:
            return 0
        (
            db.session.query(MeasurementRawValueLog)
            .filter(MeasurementRawValueLog.spec_point_id.in_(spec_point_ids))
            .delete(synchronize_session=False)
        )
        db.session.commit()
    def flush(self):
        db.session.flush()