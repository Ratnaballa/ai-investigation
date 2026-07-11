from typing import Optional, Any, Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class SuccessResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[Any] = None


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    detail: Optional[str] = None


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int
