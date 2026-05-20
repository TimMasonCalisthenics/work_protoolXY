from enumCore.common import CommonEnum
from application.dtos.measurementDTO import  MeasurementCreate , MeasurementUpdate \
                                            ,MeasurementResponse , MeasurementDraftCreate , MeasurementDraftUpdate

from infrastructure.persistence.models.measurement_model import MeasurementModel , MeasurementDetail

from domain.exceptions.base import AppError

from domain.measurement_domain import MeasurementDomain
from domain.draft_flowmanager import DraftFlowManager
from domain.measurement_finalizer import MeasurementFinalizer

from utils.export_csv import MeasurementCSVExporter
from flask import current_app
from datetime import datetime
import io
import csv

class MeasurementService:

    def __init__(self, measurement_repo , product_repo , measurement_draft_spec_repo ,
                         measurement_raw_repo , system_config_repo, measurement_raw_log_repo):
        self.measurement_repo = measurement_repo
        self.product_repo = product_repo
        self.measurement_draft_spec_repo = measurement_draft_spec_repo
        self.measurement_raw_repo = measurement_raw_repo
        self.system_config_repo = system_config_repo
        self.measurement_raw_log_repo = measurement_raw_log_repo

    def create_measurement(self, measurement: MeasurementCreate):
        product = self.product_repo.get_by_id(measurement.product_id)
        if not product:
            raise AppError("Product not found")

        spec_map = {s.point_name: s for s in product.spec_points}

        final_details = []
        all_pass = True

        for m_point in measurement.details:
            spec = spec_map.get(m_point.point_name)
            if not spec:
                raise AppError("Spec point not found")

            result = MeasurementDomain.evaluate_point(spec, m_point.measured_value)

            if not result["is_pass"]:
                all_pass = False

            final_details.append(result)

        save_data = measurement.model_dump()
        save_data["user_id"] = 1
        save_data["measurement_details"] = final_details
        save_data["final_result"] = "PASS" if all_pass else "NG"

        if not isinstance(save_data.get("details"), dict):
            save_data["details"] = {}

        save_data["details"]["measurement_snapshot"] = final_details

        return self.measurement_repo.save(save_data)



    def get_all_measurements_paginated(self, page: int, page_size: int , search: str = None, search_result: str = None, start_date=None, end_date=None):
        measurements_data , total = self.measurement_repo.get_all_measurements_paginated(search , search_result , page , page_size, start_date, end_date)
        data = [MeasurementResponse.model_validate(item).model_dump(exclude_none=True)
            for item in measurements_data
        ]
        return data , total

    def export_measurements_csv(self, search=None, search_result=None, start_date=None, end_date=None):
        measurements, _ = self.measurement_repo.get_history_by_serial(
            serial=search,
            page=1,
            page_size=1000000,
            search_result=search_result,
            start_date=start_date,
            end_date=end_date
        )

        data = [
            MeasurementResponse.model_validate(item).model_dump(exclude_none=True)
            for item in measurements
        ]

        return MeasurementCSVExporter.export(data)
    def get_measurement_by_id(self, measurement_id: int):
        measurement_data = self.measurement_repo.get_by_id(measurement_id)
        if not measurement_data:
            raise AppError("Measurement not found")
        
        return MeasurementResponse.model_validate(measurement_data).model_dump(exclude_none=True)
    def update_measurement(self, measurement_id: int, measurement: MeasurementUpdate):
        pass
    def delete_measurement(self, measurement_id: int):
        pass
    def create_measurements_draft(self, user_id: int, measurement: MeasurementDraftCreate):

        exist = self.measurement_repo.get_measurements_draft_byIdUser(user_id)
        if exist:
            return exist

        product = self.product_repo.get_by_id(measurement.product_id)
        if not product:
            raise AppError("Product not found")

        measurement.flow_stages = DraftFlowManager.build_flow(product)
        current_app.logger.info(f"Flow stages: {measurement.flow_stages}")
        if measurement.serial_a != measurement.serial_b:
            measurement.status = "completed"
            measurement.stage = "completed"
            measurement.final_result = "NG"

            return self.measurement_repo.create_measurements_draft(
                measurement.model_dump(), user_id
            )

        measurement.status = "draft"
        measurement.stage = "qrcode"

        data = self.measurement_repo.create_measurements_draft(
            measurement.model_dump(), user_id
        )

        self.system_config_repo.update_active_id_draft(data.id, datetime.utcnow())

        draft_specs = []

        # for p in product.spec_points:
        #     if p.sensor_type == "air_gauge":
        #         # for suffix in ["x", "y"]:
        #         for sensorType in [CommonEnum.Airgauge_X_axis.value, CommonEnum.Airgauge_Y_axis.value]:
        #             draft_specs.append({
        #                 "measurement_id": data.id,
        #                 "spec_point_id": p.id,
        #                 "point_name": p.point_name,
        #                 "min_value": p.ctrl_min_value if p.ctrl_min_value else p.min_value,
        #                 "max_value": p.ctrl_max_value if p.ctrl_max_value else p.max_value,
        #                 "nominal_value": p.start_value if p.start_value else p.nominal_value,
        #                 "sensor_device_id": p.assigned_sensor_device_id,
        #                 "value_key": p.sensor_value_key,
        #                 "rule_type": p.rule_type,
        #                 "required_count": p.required_count,
        #                 "sensor_type": sensorType,
        #                 "active_value": p.active_value,
        #                 "group_id": p.group_id
        #             })
        #     else:
        #         draft_specs.append({
        #             "measurement_id": data.id,
        #             "spec_point_id": p.id,
        #             "point_name": p.point_name,
        #             "min_value": p.min_value,
        #             "max_value": p.max_value,
        #             "nominal_value": p.nominal_value,
        #             "sensor_device_id": p.assigned_sensor_device_id,
        #             "value_key": p.sensor_value_key,
        #             "rule_type": p.rule_type,
        #             "required_count": p.required_count,
        #             "sensor_type": p.sensor_type,
        #             "active_value": p.active_value,
        #             "group_id": p.group_id
        #         })
        draft_specs = [
            {
                "measurement_id": data.id,
                "spec_point_id": p.id,
                "point_name": p.point_name,
                "min_value": p.ctrl_min_value if CommonEnum.Airgauge.value in p.sensor_type and p.ctrl_min_value else p.min_value,
                "max_value": p.ctrl_max_value if CommonEnum.Airgauge.value in p.sensor_type and p.ctrl_max_value else p.max_value,
                "nominal_value": p.start_value if CommonEnum.Airgauge.value in p.sensor_type and p.start_value else p.nominal_value,
                "sensor_device_id": p.assigned_sensor_device_id,
                "value_key": p.sensor_value_key,
                "rule_type": p.rule_type,
                "required_count": p.required_count,
                "sensor_type": p.sensor_type,
                "active_value": p.active_value,
                "group_id": p.group_id
            }
            for p in product.spec_points
        ]       
        self.measurement_draft_spec_repo.bulk_create(draft_specs)

        return data

    def get_measurements_draft(self):
        return self.measurement_repo.get_measurements_draft()
    def update_measurements_draft(self, draft_id:int , data:MeasurementDraftUpdate):
        draft = self.measurement_repo.get_draft_by_id(draft_id)
        if not draft:
            raise AppError("Draft not found")
        if data.stage:
            draft.stage = data.stage
        if data.status:
            draft.status = data.status
        draft.updated_at = datetime.utcnow()
        self.measurement_repo.commit()
        return draft
    def cancel_measurements_draft(self):
        settings = self.system_config_repo.get_active_id_draft()

        if settings.active_draft_id:
            draft = self.measurement_repo.get_draft_by_id(settings.active_draft_id)
        else:
            draft = self.measurement_repo.get_draft_by_status("draft")
        if not draft:
            raise AppError("Draft not found")
        draft.status = "cancel"
        draft.updated_at = datetime.utcnow()
        self.measurement_draft_spec_repo.delete_by_measurement(draft.id)
        self.measurement_raw_repo.clear_tmp()
        settings.active_draft_id = None
        self.measurement_repo.commit()
        return draft
    def save_draft(self, stage: str):
        settings = self.system_config_repo.get_active_id_draft()
        if not settings.active_draft_id:
            raise AppError("Draft not found")
        measurement = self.measurement_repo.get_by_id(settings.active_draft_id)
        flow = measurement.flow_stages
        current_index = flow.index(measurement.stage)
        target_index = flow.index(stage)

        if target_index < current_index:
            specs = self.measurement_draft_spec_repo.get_by_measurement(measurement.id)                        
            invalidated_stages = flow[target_index:current_index + 1]

            for s in specs:
                if s.sensor_type in invalidated_stages:                    
                    s.is_completed = None
                    s.is_pass = None
                    s.final_value = None   
                    s.status = CommonEnum.Pending.value
                    self.measurement_raw_repo.clear_by_point(measurement.id, s.spec_point_id)

            measurement.stage = stage
            self.measurement_repo.commit()
            
            return True
        if target_index > current_index:
            raise AppError("Stage mismatch")
        specs = self.measurement_draft_spec_repo.get_by_measurement(measurement.id)
        is_pass = True
        for s in specs:
            if s.sensor_type == measurement.stage:
                if not s.is_pass:
                    is_pass = False
                s.is_completed = True

        next_stage = DraftFlowManager.next_stage(flow, measurement.stage)
        if not is_pass or next_stage == "completed":

            details, final_result = MeasurementFinalizer.finalize(specs)

            measurement.details = details
            measurement.final_result = final_result
            measurement.stage = "completed"

            self.measurement_repo.bulk_add_details(details)
            self.measurement_draft_spec_repo.delete_by_measurement(measurement.id)
            self.measurement_repo.update_status(measurement.id, "completed")

            settings.active_draft_id = None
            # Save all existing raw values to log before clearing the temp table
            if settings.is_debug_mode:
                raw_values = self.measurement_raw_repo.get_all()
                for rv in raw_values:
                    self.measurement_raw_log_repo.create(
                        measurement_id=measurement.id,
                        spec_point_id=rv.spec_point_id,
                        sensor_device_id=rv.sensor_device_id,
                        raw_value=rv.raw_value
                    )

            self.measurement_raw_repo.clear_tmp()

        else:
            measurement.stage = next_stage

        try:
            self.measurement_repo.commit()
        except Exception as e:
            self.measurement_repo.rollback()
            raise AppError(str(e))

        return True
    def save_draftWithoutCheck(self, stage: str):
        settings = self.system_config_repo.get_active_id_draft()
        if not settings.active_draft_id:
            raise AppError("Draft not found")
        measurement = self.measurement_repo.get_by_id(settings.active_draft_id)
        flow = measurement.flow_stages
        current_index = flow.index(measurement.stage)
        target_index = flow.index(stage)

        # roll back to previous stage
        if target_index < current_index: 
            specs = self.measurement_draft_spec_repo.get_by_measurement(measurement.id)                        
            invalidated_stages = flow[target_index:current_index + 1]

            for s in specs:
                if s.sensor_type in invalidated_stages:                    
                    s.is_completed = None
                    s.is_pass = None
                    s.final_value = None   
                    s.status = CommonEnum.Pending.value
                    
                    # Save existing raw values to log before clearing
                    if settings.is_debug_mode:
                        raw_values = self.measurement_raw_repo.get_by_measurement_and_point(measurement.id, s.spec_point_id, limit=10000)
                        for rv in raw_values:
                            self.measurement_raw_log_repo.create(
                                measurement_id=measurement.id,
                                spec_point_id=s.spec_point_id,
                                sensor_device_id=rv.sensor_device_id,
                                raw_value=rv.raw_value
                            )

                    self.measurement_raw_repo.clear_by_point(measurement.id, s.spec_point_id)

            measurement.stage = stage
            self.measurement_repo.commit()
            
            return True
        if target_index > current_index:
            raise AppError("Stage mismatch")
        specs = self.measurement_draft_spec_repo.get_by_measurement(measurement.id)
        for s in specs:
            if s.sensor_type == measurement.stage:
                s.is_completed = True
        next_stage = DraftFlowManager.next_stage(flow, measurement.stage)
        if next_stage == "completed":

            details, final_result = MeasurementFinalizer.finalize(specs)

            measurement.details = details
            measurement.final_result = final_result
            measurement.stage = "completed"

            self.measurement_repo.bulk_add_details(details)
            self.measurement_draft_spec_repo.delete_by_measurement(measurement.id)
            self.measurement_repo.update_status(measurement.id, "completed")

            settings.active_draft_id = None
            self.measurement_raw_repo.clear_tmp()

        else:
            measurement.stage = next_stage

        try:
            self.measurement_repo.commit()
        except Exception as e:
            self.measurement_repo.rollback()
            raise AppError(str(e))

        return True