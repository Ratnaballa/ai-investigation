from typing import Optional, List
from datetime import datetime
from pydantic import Field
from .base import BaseDocument
from .enums import CaseStatus, EvidenceType


class Case(BaseDocument):
    case_number: str
    title: str
    description: str
    status: CaseStatus = CaseStatus.OPEN
    assigned_officer_id: Optional[str] = None
    investigating_officer_id: Optional[str] = None
    lawyer_id: Optional[str] = None
    location: Optional[str] = None
    incident_date: Optional[datetime] = None
    applicable_sections: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    created_by: str
    is_sensitive: bool = False

    class Settings:
        collection = "cases"


class Evidence(BaseDocument):
    case_id: str
    title: str
    description: str
    evidence_type: EvidenceType
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    collected_by: str
    collected_at: Optional[datetime] = None
    location_found: Optional[str] = None
    chain_of_custody: List[dict] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    is_verified: bool = False

    class Settings:
        collection = "evidence"
