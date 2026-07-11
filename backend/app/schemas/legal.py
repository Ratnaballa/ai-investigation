from typing import List, Optional
from pydantic import BaseModel


class LegalRecommendationRequest(BaseModel):
    case_description: str
    case_id: Optional[str] = None
    language: str = "en"


class LegalSection(BaseModel):
    section_number: str
    act_name: str
    title: str
    description: str
    relevance_score: float
    punishment: Optional[str] = None


class InvestigationStep(BaseModel):
    step_number: int
    action: str
    description: str
    responsible_authority: str
    time_frame: Optional[str] = None


class LegalRecommendationResponse(BaseModel):
    case_description: str
    recommended_sections: List[LegalSection]
    reasoning: str
    investigation_procedure: List[InvestigationStep]
    applicable_courts: List[str]
    bail_eligibility: Optional[str] = None
    language: str


class RAGSearchRequest(BaseModel):
    query: str
    top_k: int = 5
    language: str = "en"
    document_type: Optional[str] = None


class RAGSearchResult(BaseModel):
    content: str
    source: str
    score: float
    metadata: dict


class RAGSearchResponse(BaseModel):
    query: str
    results: List[RAGSearchResult]
    total_found: int
