from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, Dict, Any, List
from datetime import datetime

class MeasurementPointCreate(BaseModel):
    point_name: str
    measured_value: float

class MeasurementBase(BaseModel):
    product_id: int
    serial_a: str | None = Field(..., min_length=0, max_length=100)
    serial_b: str | None= Field(..., min_length=0, max_length=100)
    details: List[MeasurementPointCreate] = Field(..., min_length=1)
    final_result: str = Field(..., min_length=1, max_length=100)

class MeasurementCreate(MeasurementBase):
    pass
class MeasurementSaveDraft(BaseModel):
    stage: str = Field(..., min_length=1, max_length=100)
class MeasurementUpdate(BaseModel):
    serial_a: Optional[str] = Field(None, min_length=1, max_length=100)
    serial_b: Optional[str] = Field(None, min_length=1, max_length=100)
    details: Optional[Dict[str, Any]] = None
    final_result: Optional[str] = Field(None, min_length=1, max_length=100)

class MeasurementResponse(MeasurementBase):
    id: int
    details: Optional[List] = None
    final_result: Optional[str] = None
    product_name: Optional[str] = None
    product_id: Optional[int] = None
    stage: Optional[str] = None
    status: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True




class MeasurementDraftBase(BaseModel):
    product_id: int
    serial_a: str = Field(..., min_length=0, max_length=100)
    serial_b: str = Field(..., min_length=0, max_length=100)
    stage: Optional[str] = Field(None, min_length=1, max_length=100)
    status: Optional[str] = Field(None, min_length=1, max_length=100)
class MeasurementDraftCreate(MeasurementDraftBase):
    final_result: Optional[str] = Field(None, min_length=1, max_length=100)
    flow_stages: Optional[List[str]] = Field(None, min_length=1, max_length=100)
    pass
class MeasurementDraftUpdate(BaseModel):
    status: Optional[str] = Field(None, min_length=1, max_length=100)
    stage: Optional[str] = Field(None, min_length=1, max_length=100)