from flask import current_app
from collections import defaultdict
from enumCore.common import CommonEnum

from domain.exceptions.base import AppError
from infrastructure.persistence.models.MeasurementRawValue import MeasurementRawValue
class SensorService:
    def __init__(self, sensor_repo, measurement_repo , measurement_raw_value_repo, measurement_draft_spec_repo, setting_repo, rule_engine):
        self.sensor_repo = sensor_repo
        self.raw_repo = measurement_raw_value_repo
        self.draft_spec_repo = measurement_draft_spec_repo
        self.measurement_repo = measurement_repo  
        self.setting_repo = setting_repo
        self.rule_engine = rule_engine
    def ingest_sensor_data(self, data):
        settings = self.setting_repo.get_detail_setting()
        measurement_id = settings.active_draft_id
        if not measurement_id:
            raise AppError("No active draft")
        
        active_draft = self.measurement_repo.get_by_id(measurement_id)
        if not active_draft:
            raise AppError("Active draft data not found")
        current_work_stage = active_draft.stage
        current_app.logger.info(f"Current work stage: {current_work_stage}")

        specs_to_process = []

        specs = self.draft_spec_repo.get_by_device_id(
            data.device_id
        )
        
        valid_specs = [s for s in specs if s.sensor_type == current_work_stage]
        
        if not valid_specs:
            current_app.logger.info(f"No valid specs for stage {current_work_stage}")
            return 0

        spec_map = {s.value_key: s for s in valid_specs}
        specs_to_process = set()

        raw_list = []
        for item in data.measurements:
            spec = spec_map.get(item.key_value)
            if not spec:
                continue

            raw_list.append(
                MeasurementRawValue(
                    measurement_id=measurement_id,
                    spec_point_id=spec.spec_point_id,
                    sensor_device_id=data.device_id,
                    raw_value=item.value
                )
            )

            specs_to_process.add(spec)

        if not specs_to_process:
            return 0
        self.raw_repo.create_list(raw_list)


        max_required = max(s.required_count for s in specs_to_process)

        raws_data = self.raw_repo.get_latest_grouped(
            measurement_id,
            data.device_id,
            max_required
        )

        raw_map = {}
        for r in raws_data:
            raw_map.setdefault(r.spec_point_id, []).append(r.raw_value)

        specs_by_type = {}
        for s in specs_to_process:
            specs_by_type.setdefault(s.sensor_type, []).append(s)
 
        for sensor_type, specs in specs_by_type.items():
            

            grouped_specs = defaultdict(list)
            for s in specs:
                g_id = getattr(s, "group_id", None) or f"single_{s.id}"
                grouped_specs[g_id].append(s)

            for group_id, sub_specs in grouped_specs.items():
                active_specs = [s for s in sub_specs if getattr(s, "active_value", False)]
                if len(active_specs) > 1:
                    raise AppError(f"Multiple active spec found in group {group_id}")
                
                active_spec = active_specs[0] if active_specs else None

                for spec in sub_specs:
                    values = raw_map.get(spec.spec_point_id, [])

                    context = {
                        "has_active": active_spec is not None,
                        "is_active": active_spec and spec.id == active_spec.id,
                        "sensor_type": sensor_type,
                        "group_id": group_id
                    }

                    result = self.rule_engine.evaluate(spec, values, context=context)
                    current_app.logger.info(f"[{sensor_type}][Group {group_id}] Rule Engine Result: {result}")
                    if not result:
                        continue

      
                    if result.get("action") == "broadcast_ready":
                        for s in sub_specs:
                            self.draft_spec_repo.update_status(s.id, "ready")

                        break  

                    if result.get("action") == "update_status":
                        self.draft_spec_repo.update_status(spec.id, result["status"])
                        continue

                    if "value" in result:
                        self.draft_spec_repo.update_result(
                            spec.id,
                            result["value"],
                            result["is_pass"]
                        )

                        if result["is_pass"]:
                            self.raw_repo.clear_by_point(
                                measurement_id,
                                spec.spec_point_id
                            )     
        self.sensor_repo.commit()

        return len(specs_to_process)
    
    def clear_tmp(self):
        self.raw_repo.clear_tmp()
