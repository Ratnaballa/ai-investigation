from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from app.models.enums import DocumentType, ReportType


class DocumentResponse(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    document_type: DocumentType
    file_name: str
    file_size: int
    chunk_count: int
    is_indexed: bool
    uploaded_by: str
    tags: List[str]
    language: str
    created_at: datetime

    model_config = {"populate_by_name": True}


class DocumentUploadResponse(BaseModel):
    document: DocumentResponse
    message: str
    chunks_created: int


class ReportCreateRequest(BaseModel):
    case_id: Optional[str] = None
    title: str
    report_type: ReportType
    content: Dict[str, Any] = {}
    summary: Optional[str] = None
    tags: List[str] = []


class ReportResponse(BaseModel):
    id: Optional[str] = None
    case_id: Optional[str] = None
    title: str
    report_type: ReportType
    content: Dict[str, Any]
    summary: Optional[str] = None
    file_path: Optional[str] = None
    created_by: str
    created_by_name: Optional[str] = None
    is_finalized: bool
    tags: List[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"populate_by_name": True}


class GenerateReportRequest(BaseModel):
    case_id: str
    report_type: ReportType
    title: Optional[str] = None
    include_evidence: bool = True
    include_graph: bool = True
    include_legal_sections: bool = True
    language: str = "en"
