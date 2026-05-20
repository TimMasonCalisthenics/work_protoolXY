from application.dtos.measurement_raw_value_log_DTO import MeasurementRawValueLogResponse
from domain.exceptions.base import AppError
from typing import Optional

class MeasurementRawValueLogService:
    def __init__(self, raw_log_repo):
        self.raw_log_repo = raw_log_repo
        
    def get_logs_with_query(
        self,
        measurement_id: Optional[int] = None,
        spec_point_id: Optional[int] = None,
        point_name: Optional[str] = None,
        sensor_device_id: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ):
        items, total = self.raw_log_repo.get_logs_with_query(
            measurement_id=measurement_id,
            spec_point_id=spec_point_id,
            point_name=point_name,
            sensor_device_id=sensor_device_id,
            page=page,
            limit=limit
        )
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit
        }
        
    def clear_all_logs(self):
        self.raw_log_repo.clear_all()

