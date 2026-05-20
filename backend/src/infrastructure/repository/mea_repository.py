from infrastructure.persistence.models.measurement_model import MeasurementModel , MeasurementDetail
from infrastructure.persistence.models.product_model import ProductModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, func , update
from sqlalchemy.orm import joinedload
from flask import current_app
class MeasurementRepository:
    def __init__(self , db):
        self.db = db
    def save(self, data: dict):
        try:
            measurement_details = data.get('measurement_details', [])
            data['details'] = measurement_details
            measurement = MeasurementModel(
                user_id=data['user_id'],
                product_id=data['product_id'],
                serial_a=data['serial_a'],
                serial_b=data['serial_b'],
                details=data['details'],
                final_result=data['final_result']
            )
            self.db.session.add(measurement)
            self.db.session.flush()
            for pt in measurement_details:
                detail = MeasurementDetail(
                    measurement_id=measurement.id,
                    **pt
                )
                self.db.session.add(detail)

            self.db.session.commit()
            return measurement
        except Exception as e:
            self.db.session.rollback()
            raise e

    def get_by_id(self, measurement_id: int):
        stmt = (
            select(MeasurementModel)
            .options(joinedload(MeasurementModel.measurement_details))
            .where(MeasurementModel.id == measurement_id)
        )
        return self.db.session.execute(stmt).scalars().unique().first()
    def get_draft_by_id(self, measurement_id: int):
        stmt = (
            select(MeasurementModel)
            .where(MeasurementModel.id == measurement_id)
        )
        return self.db.session.execute(stmt).scalars().unique().first()
    def get_draft_by_status(self , status:str):
        stmt = (
            select(MeasurementModel)
            .where(MeasurementModel.status == status)
        )
        return self.db.session.execute(stmt).scalars().unique().first()

    def get_all_measurements_paginated(self, serial: str = None, search_result: str = None, page: int = 1, page_size: int = 20, start_date=None, end_date=None):
        """ค้นหาประวัติการวัดตาม Serial Number และช่วงเวลา (รองรับ Pagination)"""
        offset = (page - 1) * page_size

        stmt = select(
            MeasurementModel.id,
            MeasurementModel.serial_a,
            MeasurementModel.serial_b,
            MeasurementModel.final_result,
            MeasurementModel.status,
            MeasurementModel.created_at,
            MeasurementModel.updated_at,
            ProductModel.product_name
            ).join(MeasurementModel.product)
        # ค้นหาทั้งใน serial_a และ serial_b
        if serial:
            stmt = stmt.where((MeasurementModel.serial_a == serial) | (MeasurementModel.serial_b == serial))
        if search_result:
            stmt = stmt.where(MeasurementModel.final_result == search_result)
        if start_date and end_date:
            stmt = stmt.where(MeasurementModel.created_at.between(start_date, end_date))
        elif start_date:
            stmt = stmt.where(MeasurementModel.created_at >= start_date)
        elif end_date:
            stmt = stmt.where(MeasurementModel.created_at <= end_date)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.session.execute(count_stmt).scalar_one()

        stmt = (
            stmt
            .order_by(MeasurementModel.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        # results = self.db.session.execute(stmt).scalars().all()
        results = self.db.session.execute(stmt).mappings().all()
        return results , total


    def get_history_by_serial(self, serial: str = None, search_result: str = None, page: int = 1, page_size: int = 20, start_date=None, end_date=None):
        """ค้นหาประวัติการวัดตาม Serial Number และช่วงเวลา (รองรับ Pagination)"""
        offset = (page - 1) * page_size

        stmt = select(MeasurementModel)
        # ค้นหาทั้งใน serial_a และ serial_b
        if serial:
            stmt = stmt.where((MeasurementModel.serial_a == serial) | (MeasurementModel.serial_b == serial))
        if search_result:
            stmt = stmt.where(MeasurementModel.final_result == search_result)
        if start_date and end_date:
            stmt = stmt.where(MeasurementModel.created_at.between(start_date, end_date))
        elif start_date:
            stmt = stmt.where(MeasurementModel.created_at >= start_date)
        elif end_date:
            stmt = stmt.where(MeasurementModel.created_at <= end_date)
        

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.session.execute(count_stmt).scalar_one()

        stmt = (
            stmt
            .order_by(MeasurementModel.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )

        results = self.db.session.execute(stmt).scalars().all()
        return results , total

    def get_statistics(self, product_id: int):
        """ดึงสถิติภาพรวม เช่น อัตราการผ่าน (Pass Rate) ของสินค้านั้นๆ"""
        stmt = (
            select(
                MeasurementModel.final_result,
                func.count(MeasurementModel.id).label('count')
            )
            .where(MeasurementModel.product_id == product_id)
            .group_by(MeasurementModel.final_result)
        )
        return self.db.session.execute(stmt).all()
    def get_measurements_draft_byIdUser(self , user_id:int):
        stmt = (
            select(
                MeasurementModel
            )
            .where(MeasurementModel.user_id == user_id ,
                   MeasurementModel.status == "draft")
        )
        return self.db.session.execute(stmt).scalars().first()
    def get_measurements_draft(self ):
        stmt = (
            select(
                MeasurementModel
            )
            .where(MeasurementModel.status == "draft")
        )
        return self.db.session.execute(stmt).scalars().first()
    def create_measurements_draft(self ,data:dict , user_id:int):
        measurement = MeasurementModel(
                user_id=user_id,
                product_id=data['product_id'],
                serial_a=data['serial_a'],
                serial_b=data['serial_b'],
                status=data['status'],
                stage=data['stage'],
                flow_stages=data['flow_stages'],
                final_result= data.get('final_result')
            )
        self.db.session.add(measurement)
        self.db.session.commit()
        return measurement
    def bulk_add_details(self, data_list):
        self.db.session.bulk_insert_mappings(MeasurementDetail, data_list)
    def update_status(self , measurement_id:int , status:str):
        stmt = (
            update(MeasurementModel)
            .where(MeasurementModel.id == measurement_id)
            .values(status=status)
        )
        self.db.session.execute(stmt)
    def commit(self):
        self.db.session.commit()
    def rollback(self):
        self.db.session.rollback()
    def flush(self):
        self.db.session.flush()