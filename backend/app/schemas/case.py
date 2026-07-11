from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.models.enums import CaseStatus, EvidenceType


class CaseCreateRequest(BaseModel):
    title: str
    description: str
    location: Optional[str] = None
    incident_date: Optional[datetime] = None
    assigned_officer_id: Optional[str] = None
    investigating_officer_id: Optional[str] = None
    lawyer_id: Optional[str] = None
    tags: List[str] = []
    is_sensitive: bool = False


class CaseUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CaseStatus] = None
    location: Optional[str] = None
    incident_date: Optional[datetime] = None
    assigned_officer_id: Optional[str] = None
    investigating_officer_id: Optional[str] = None
    lawyer_id: Optional[str] = None
    applicable_sections: Optional[List[str]] = None
    tags: Optional[List[str]] = None


class CaseResponse(BaseModel):
    id: Optional[str] = None
    case_number: str
    title: str
    description: str
    status: CaseStatus
    assigned_officer_id: Optional[str] = None
    investigating_officer_id: Optional[str] = None
    lawyer_id: Optional[str] = None
    location: Optional[str] = None
    incident_date: Optional[datetime] = None
    applicable_sections: List[str]
    tags: List[str]
    created_by: str
    is_sensitive: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"populate_by_name": True}


class EvidenceCreateRequest(BaseModel):
    case_id: str
    title: str
    description: str
    evidence_type: EvidenceType
    collected_at: Optional[datetime] = None
    location_found: Optional[str] = None
    tags: List[str] = []


class EvidenceResponse(BaseModel):
    id: Optional[str] = None
    case_id: str
    title: str
    description: str
    evidence_type: EvidenceType
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    collected_by: str
    collected_at: Optional[datetime] = None
    location_found: Optional[str] = None
    chain_of_custody: List[dict]
    tags: List[str]
    is_verified: bool
    created_at: datetime

    model_config = {"populate_by_name": True}
