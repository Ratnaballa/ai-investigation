from fastapi import APIRouter, Depends
from app.schemas.legal_history import (
    LegalHistoryCreateRequest,
    LegalHistoryResponse,
    LegalHistoryListResponse,
)
from app.schemas.common import SuccessResponse
from app.api.auth.dependencies import get_current_user
from app.services.legal_history_service import LegalHistoryService

router = APIRouter(prefix="/legal/history", tags=["Legal History"])


def _get_service() -> LegalHistoryService:
    return LegalHistoryService()


@router.post("", response_model=LegalHistoryResponse)
async def save_history(
    request: LegalHistoryCreateRequest,
    current_user: dict = Depends(get_current_user),
    service: LegalHistoryService = Depends(_get_service),
):
    """Save a legal recommendation result to history."""
    return await service.save(request, current_user["_id"])


@router.get("", response_model=LegalHistoryListResponse)
async def list_history(
    current_user: dict = Depends(get_current_user),
    service: LegalHistoryService = Depends(_get_service),
):
    """List all legal recommendation history for the current user."""
    return await service.list_history(current_user["_id"])


@router.get("/{item_id}", response_model=LegalHistoryResponse)
async def get_history_item(
    item_id: str,
    current_user: dict = Depends(get_current_user),
    service: LegalHistoryService = Depends(_get_service),
):
    """Get a single legal history item."""
    return await service.get_item(item_id, current_user["_id"])


@router.delete("/{item_id}", response_model=SuccessResponse)
async def delete_history_item(
    item_id: str,
    current_user: dict = Depends(get_current_user),
    service: LegalHistoryService = Depends(_get_service),
):
    """Delete a legal history item."""
    await service.delete_item(item_id, current_user["_id"])
    return SuccessResponse(message="Legal history item deleted successfully")
