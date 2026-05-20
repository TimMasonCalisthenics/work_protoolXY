from pydantic import BaseModel, Field, HttpUrl  , ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime

class MeasurementDraftDTO(BaseModel):
    # id: int
    # measurement_id: int
    # spec_point_id: int
    point_name: str
    min_value: float
    max_value: float
    nominal_value: float
    sensor_device_id: str
    rule_type: str
    # required_count: int
    value_key:str
    final_value: float
    is_pass: bool
    is_completed: bool
    sensor_type: str



class MeasurementDraftResponse(MeasurementDraftDTO):
    model_config = ConfigDict(from_attributes=True)
