from typing import Optional, List, Dict, Any
from pydantic import Field
from .base import BaseDocument
from .enums import ReportType


class Report(BaseDocument):
    case_id: Optional[str] = None
    title: str
    report_type: ReportType
    content: Dict[str, Any] = Field(default_factory=dict)
    summary: Optional[str] = None
    file_path: Optional[str] = None
    created_by: str
    is_finalized: bool = False
    tags: List[str] = Field(default_factory=list)

    class Settings:
        collection = "reports"
