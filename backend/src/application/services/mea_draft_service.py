from flask import current_app
from domain.exceptions.base import AppError, ConflictError
class MeasurementDraftService:
    def __init__(self, measurement_repo , measurement_draft_spec_repo , measurement_raw_repo , system_config_repo):
        self.measurement_repo = measurement_repo
        self.measurement_draft_spec_repo = measurement_draft_spec_repo
        self.measurement_raw_repo = measurement_raw_repo
        self.system_config_repo = system_config_repo
    def get_measurements_draft(self):
        system_config = self.system_config_repo.get_active_id_draft()
        if system_config == None:
            return AppError("No active draft found", 404)
        return self.measurement_draft_spec_repo.get_by_measurement(system_config.active_draft_id)
    def clear_ng_value_measurement_draft(self):
        system_config = self.system_config_repo.get_active_id_draft()
        if system_config == None:
            return AppError("No active draft found", 404)
        return self.measurement_draft_spec_repo.clear_ng_value_by_measurement(system_config.active_draft_id)
    def clear_all_value_in_stage_measurement_draft(self):
        system_config = self.system_config_repo.get_active_id_draft()
        if system_config == None:
            return AppError("No active draft found", 404)
        measurementData = self.measurement_repo.get_by_id(system_config.active_draft_id)        
        # clear spec and set
        return True
        
    def clear_ng_and_raw_value_measurement_draft(self):
        system_config = self.system_config_repo.get_active_id_draft()
        if system_config == None:
            return AppError("No active draft found", 404)

        spec_point_id = self.measurement_draft_spec_repo.clear_ng_and_sync_other_table(system_config.active_draft_id)
        self.measurement_raw_repo.clear_tmp_by_point(spec_point_id)
        return True