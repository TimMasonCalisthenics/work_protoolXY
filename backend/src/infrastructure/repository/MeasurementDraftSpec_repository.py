from sqlalchemy.exc import IntegrityError
from sqlalchemy import and_
from infrastructure.database.database import db
from typing import List, Optional
from infrastructure.persistence.models.MeasurementDraftSpec import MeasurementDraftSpec

class MeasurementDraftSpecRepository:
    def __init__(self, db):
        self.db = db
    # ---------- CREATE ----------
    def create(self, data: dict) -> MeasurementDraftSpec:
        spec = MeasurementDraftSpec(**data)
        self.db.session.add(spec)
        self.db.session.flush()  # ได้ id ทันที
        return spec


    # ---------- BULK CREATE ----------
    def bulk_create(self, data_list: List[dict]) -> List[MeasurementDraftSpec]:
        specs = [MeasurementDraftSpec(**data) for data in data_list]
        self.db.session.add_all(specs)
        self.db.session.commit()
        return specs


    def get_by_measurement(self, measurement_id: int) -> List[MeasurementDraftSpec]:
        return (
            self.db.session.query(MeasurementDraftSpec)
            .filter(MeasurementDraftSpec.measurement_id == measurement_id)
            .all()
        )
    def get_by_device_id(self, device_id: int) -> List[MeasurementDraftSpec]:
        return (
            self.db.session.query(MeasurementDraftSpec)
            .filter(MeasurementDraftSpec.sensor_device_id == device_id)
            .all()
        )

    # ---------- GET SINGLE SPEC ----------
    def get_by_measurement_and_point(
        self,
        measurement_id: int,
        spec_point_id: int
    ) -> Optional[MeasurementDraftSpec]:
        return (
            self.db.session.query(MeasurementDraftSpec)
            .filter(
                and_(
                    MeasurementDraftSpec.measurement_id == measurement_id,
                    MeasurementDraftSpec.spec_point_id == spec_point_id
                )
            )
            .first()
        )
    
    def update_status(self , spec_id: int , status: str) -> Optional[MeasurementDraftSpec]:
        spec = self.db.session.get(MeasurementDraftSpec, spec_id)
        if not spec:
            return None
        spec.status = status
        self.db.session.commit()
        return spec
    def update_statusGroup(self , spec_id: int , status: str) -> Optional[MeasurementDraftSpec]:
        spec = self.db.session.get(MeasurementDraftSpec, spec_id)
        if not spec:
            return None
        spec.status = status
        self.db.session.flush()
        return spec
    # ---------- UPDATE RESULT ----------
    def update_result(
        self,
        spec_id: int,
        final_value: float,
        is_pass: bool,
        is_completed: bool = False
    ) -> Optional[MeasurementDraftSpec]:

        spec = self.db.session.get(MeasurementDraftSpec, spec_id)
        if not spec:
            return None

        spec.final_value = final_value
        spec.is_pass = is_pass
        spec.is_completed = is_completed

        self.db.session.flush()
        return spec


    # ---------- CHECK ALL COMPLETED ----------
    def all_completed(self, measurement_id: int) -> bool:
        count = (
            self.db.session.query(MeasurementDraftSpec)
            .filter(
                MeasurementDraftSpec.measurement_id == measurement_id,
                MeasurementDraftSpec.is_completed == False
            )
            .count()
        )
        return count == 0


    # ---------- DELETE BY MEASUREMENT ----------
    def delete_by_measurement(self, measurement_id: int):
        (
            self.db.session.query(MeasurementDraftSpec)
            .filter(MeasurementDraftSpec.measurement_id == measurement_id)
            .delete(synchronize_session=False)
        )
    def commit(self):
        self.db.session.commit()
    def clear_ng_value_by_measurement(self, measurement_id: int):
        (   
            self.db.session.query(MeasurementDraftSpec)
            .filter(MeasurementDraftSpec.measurement_id == measurement_id 
                    ,MeasurementDraftSpec.is_pass == False
                    ,MeasurementDraftSpec.is_completed == False)
            .update({MeasurementDraftSpec.final_value: None, MeasurementDraftSpec.is_pass: None, MeasurementDraftSpec.is_completed: False})
        )
        return self.db.session.commit()
    def clear_ng_and_sync_other_table(self, measurement_id: int):        
        targets = (
            self.db.session.query(MeasurementDraftSpec)
            .filter(
                MeasurementDraftSpec.measurement_id == measurement_id,
                MeasurementDraftSpec.is_pass == False,
                MeasurementDraftSpec.is_completed == False
            ).all()
        )
        if not targets:
            return 0
        target_ids = [item.spec_point_id for item in targets]

        try:            
            for item in targets:
                item.final_value = None
                item.is_pass = None
                item.is_completed = False
                
            
            self.db.session.commit()
            return target_ids

        except Exception as e:
            self.db.session.rollback()
            print(f"Error: {e}")
            raise e