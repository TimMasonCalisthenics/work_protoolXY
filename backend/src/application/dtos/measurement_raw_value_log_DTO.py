from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class MeasurementRawValueLogDTO(BaseModel):
    id: int
    measurement_id: int
    spec_point_id: int
    point_name: Optional[str] = None
    sensor_device_id: str
    raw_value: float
    created_at: datetime

class MeasurementRawValueLogResponse(MeasurementRawValueLogDTO):
    model_config = ConfigDict(from_attributes=True)
