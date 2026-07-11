from fastapi import APIRouter, Depends
from app.schemas.legal import (
    LegalRecommendationRequest, LegalRecommendationResponse,
    RAGSearchRequest, RAGSearchResponse,
)
from app.api.auth.dependencies import get_current_user
from app.dependencies import get_legal_service
from app.services.legal_service import LegalService

router = APIRouter(prefix="/legal", tags=["Legal Recommendation"])


@router.post("/recommend", response_model=LegalRecommendationResponse)
async def recommend_legal_sections(
    request: LegalRecommendationRequest,
    current_user: dict = Depends(get_current_user),
    service: LegalService = Depends(get_legal_service),
):
    """Analyze a case description and recommend applicable legal sections."""
    return await service.recommend_legal_sections(request)


@router.post("/search", response_model=RAGSearchResponse)
async def rag_search(
    request: RAGSearchRequest,
    current_user: dict = Depends(get_current_user),
    service: LegalService = Depends(get_legal_service),
):
    """Search legal documents using semantic similarity (RAG)."""
    return await service.rag_search(request)
