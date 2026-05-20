from pydantic import BaseModel, Field , ConfigDict
from datetime import datetime
from typing import Literal

class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50 , description="ชื่อผู้ใช้งานต้องมีความยาว 3-50 ตัวอักษร")
    password: str = Field(..., min_length=3 , description="รหัสผ่านต้องมีความยาว 3 ตัวอักษรขึ้นไป")

class UserUpdateDTO(BaseModel):
    role: Literal['admin', 'supervisor', 'operator'] = Field(
        ...,
        description="บทบาทต้องเป็น admin, supervisor หรือ operator เท่านั้น"
    )

class UserResponse(BaseModel):
    username: str
    role: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)