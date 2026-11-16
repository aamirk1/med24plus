from typing import Any, Generic, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Standardized Med24Plus API success envelope."""
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[T] = None


class APIErrorDetails(BaseModel):
    """Detailed error classification."""
    code: str
    details: Optional[Any] = None


class APIErrorResponse(BaseModel):
    """Standardized Med24Plus API error envelope."""
    success: bool = False
    message: str
    error: APIErrorDetails

