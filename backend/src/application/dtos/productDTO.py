from enumCore.common import CommonEnum
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, Dict, Any, List , Literal
from datetime import datetime

class SpecPointBase(BaseModel):
    point_name: str = Field(..., min_length=1)
    point_image_url: Optional[str] = None
    sensor_type:Literal[CommonEnum.Mitutoyo.value, CommonEnum.Airgauge.value, CommonEnum.Airgauge_X_axis.value, CommonEnum.Airgauge_Y_axis.value] = Field(..., min_length=1, max_length=50)
    nominal_value: float
    min_value: float
    max_value: float
    ctrl_min_value: Optional[float] = None
    ctrl_max_value: Optional[float] = None
    start_value: Optional[float] = None
    active_value: Optional[bool] = False
    group_id: Optional[int] = None
    assigned_sensor_device_id: Optional[str] = None
    sensor_value_key: Optional[str] = "value"
    required_count: Optional[int] = None
    rule_type: Optional[str] = None
    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    product_name: str = Field(..., min_length=1, max_length=100)
    spec_points: List[SpecPointBase] = Field(None)
    image_url: Optional[List[str]] = None
    option_condition: Literal['less than', 'more than', 'normal'] = Field(None, min_length=1, max_length=50)
    option_save: Literal['all', 'individual'] = Field(None, min_length=1, max_length=50)

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    product_name: Optional[str] = Field(None, min_length=1, max_length=100)
    spec_points: Optional[List[SpecPointBase]] = None
    image_url: Optional[List[str]] = None
    is_deleted: Optional[bool] = None
class ProductUpdateActive(BaseModel):
    id:int
    product_name: str = Field(..., min_length=1, max_length=100)
    spec_points: List[SpecPointBase] = Field(None)


class ProductResponse(ProductBase):
    id: int
    is_deleted: Optional[bool] = None
    spec_points: Optional[List[SpecPointBase]] = None
    image_url: Optional[List[str]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True