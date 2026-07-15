from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel


class LegalHistoryCreateRequest(BaseModel):
    query: str
    result: Dict[str, Any]          # full LegalChatResponse-like dict
    title: str                       # short auto-generated title
    summary: str                     # case_summary snippet


class LegalHistoryResponse(BaseModel):
    id: str
    query: str
    result: Dict[str, Any]
    title: str
    summary: str
    created_at: datetime

    model_config = {"populate_by_name": True}


class LegalHistoryListResponse(BaseModel):
    items: List[LegalHistoryResponse]
    total: int
