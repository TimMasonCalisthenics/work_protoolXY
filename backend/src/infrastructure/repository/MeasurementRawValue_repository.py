from typing import List, Optional
from sqlalchemy import func
from infrastructure.database.database import db
from infrastructure.persistence.models.MeasurementRawValue import MeasurementRawValue

class MeasurementRawValueRepository:
    def __init__(self, db):
        self.db = db
    # ---------- CREATE RAW ----------
    def create(
        self,
        measurement_id: int,
        spec_point_id: int,
        sensor_device_id: str,
        raw_value: float
    ) -> MeasurementRawValue:

        raw = MeasurementRawValue(
            measurement_id=measurement_id,
            spec_point_id=spec_point_id,
            sensor_device_id=sensor_device_id,
            raw_value=raw_value
        )

        db.session.add(raw)
        db.session.flush()
        return raw
    # ---------- CREATE RAW LIST ----------
    def create_list(
        self,
        raws: List[MeasurementRawValue]
    ):
        db.session.add_all(raws)
        db.session.flush()

    # ---------- GET RAW VALUES ----------
    def get_by_measurement_and_point(
        self,
        measurement_id: int,
        spec_point_id: int,
        limit: int = 1
    ) -> List[MeasurementRawValue]:

        return (
            db.session.query(MeasurementRawValue)
            .filter(
                MeasurementRawValue.measurement_id == measurement_id,
                MeasurementRawValue.spec_point_id == spec_point_id
            )
            .order_by(MeasurementRawValue.created_at.desc())
            .limit(limit)
            .all()
        )
    # ---------- GET RAW VALUES BY DEVICE ID ----------
    def get_by_measurement_and_device(self, measurement_id: int, device_id: str):
        return MeasurementRawValue.query.filter_by(
            measurement_id=measurement_id,
            sensor_device_id=device_id
        ).all()
    # ---------- GET ALL RAW VALUES ----------
    def get_all(self) -> List[MeasurementRawValue]:
        return db.session.query(MeasurementRawValue).all()

    # ---------- GET LATEST GROUPED ----------
    def get_latest_grouped(
        self, 
        measurement_id: int, 
        device_id: str, 
        limit_per_group
    ):
        subq = (
            db.session.query(
                MeasurementRawValue.id,
                MeasurementRawValue.spec_point_id,
                MeasurementRawValue.raw_value,
                func.row_number().over(
                    partition_by=MeasurementRawValue.spec_point_id,
                    order_by=MeasurementRawValue.id.desc()
                ).label("rn")
            )
            .filter(
                MeasurementRawValue.measurement_id == measurement_id,
                MeasurementRawValue.sensor_device_id == device_id
            )
            .subquery()
        )

        rows = (
            db.session.query(subq)
            .filter(subq.c.rn <= limit_per_group)
            .all()
        )

        return rows

    # ---------- COUNT RAW ----------
    def count_by_measurement_and_point(
        self,
        measurement_id: int,
        spec_point_id: int
    ) -> int:

        return (
            db.session.query(func.count(MeasurementRawValue.id))
            .filter(
                MeasurementRawValue.measurement_id == measurement_id,
                MeasurementRawValue.spec_point_id == spec_point_id
            )
            .scalar()
        )
    # ---------- CLEAR RAW BY POINT ----------
    def clear_by_point(self, measurement_id: int, spec_point_id: int):
        (
            db.session.query(MeasurementRawValue)
            .filter(
                MeasurementRawValue.measurement_id == measurement_id,
                MeasurementRawValue.spec_point_id == spec_point_id
            )
            .delete(synchronize_session=False)
        )
        db.session.commit()

    # ---------- DELETE RAW BY MEASUREMENT ----------
    def delete_by_measurement(self, measurement_id: int):
        (
            db.session.query(MeasurementRawValue)
            .filter(MeasurementRawValue.measurement_id == measurement_id)
            .delete(synchronize_session=False)
        )
    def clear_tmp(self):
        db.session.query(MeasurementRawValue).delete(synchronize_session=False)
        db.session.commit()

    def clear_tmp_by_point(self,  spec_point_ids: list):
        if not spec_point_ids:
            return 0
        (
            db.session.query(MeasurementRawValue)
            .filter(MeasurementRawValue.spec_point_id.in_(spec_point_ids))
            .delete(synchronize_session=False)
        )
        db.session.commit()
    def flush(self):
        db.session.flush()