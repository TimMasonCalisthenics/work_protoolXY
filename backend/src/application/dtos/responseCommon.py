from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")

class GenericResponse(BaseModel, Generic[T]):
    success: bool
    message: str
    data: Optional[T] = None
    error: Optional[Any] = None
    model_config = ConfigDict(
        from_attributes=True
    )

    def to_json(self):
        return self.model_dump(exclude_none=True)
    @classmethod
    def success_res(cls, data: Any = None, message: str = "Success"):
        return cls(success=True, message=message, data=data)

    @classmethod
    def error_res(cls, message: str = "Error", error: Any = None):
        return cls(success=False, message=message, error=error)