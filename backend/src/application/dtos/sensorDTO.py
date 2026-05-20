from pydantic import BaseModel, Field , ConfigDict
from datetime import datetime
from typing import Literal
from typing import Dict, Any, List


class MeasurementItem(BaseModel):
    key_value: str = Field(..., min_length=1)
    value: float

class SensorBase(BaseModel):
    device_id: str = Field(..., min_length=1)
    measurements: List[MeasurementItem] = Field(default_factory=list)
    # timestamp: datetime = Field(...)
    # status: Literal['ok', 'warning', 'error'] = Field(...)

class SensorCreate(SensorBase):
    pass
class SensorUpdate(SensorBase):
    pass
class SensorResponse(SensorBase):
    pass
