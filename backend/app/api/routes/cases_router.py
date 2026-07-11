import math
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from app.schemas.case import CaseCreateRequest, CaseUpdateRequest, CaseResponse, EvidenceCreateRequest, EvidenceResponse
from app.schemas.common import SuccessResponse, PaginatedResponse
from app.api.auth.dependencies import get_current_user, require_law_enforcement, require_legal_professional
from app.dependencies import get_case_service
from app.services.case_service import CaseService

router = APIRouter(prefix="/cases", tags=["Cases"])


def _case_to_response(case) -> CaseResponse:
    return CaseResponse(
        id=str(case.id), case_number=case.case_number, title=case.title,
        description=case.description, status=case.status,
        assigned_officer_id=case.assigned_officer_id,
        investigating_officer_id=case.investigating_officer_id,
        lawyer_id=case.lawyer_id, location=case.location,
        incident_date=case.incident_date,
        applicable_sections=case.applicable_sections, tags=case.tags,
        created_by=case.created_by, is_sensitive=case.is_sensitive,
        created_at=case.created_at, updated_at=case.updated_at,
    )


@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_law_enforcement)])
async def create_case(
    data: CaseCreateRequest,
    current_user: dict = Depends(get_current_user),
    service: CaseService = Depends(get_case_service),
):
    """Create a new investigation case."""
    return _case_to_response(await service.create_case(data, current_user["_id"]))


@router.get("", response_model=PaginatedResponse, dependencies=[Depends(require_legal_professional)])
async def list_cases(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    service: CaseService = Depends(get_case_service),
):
    """List all cases with pagination."""
    cases, total = await service.list_cases(page, page_size, status)
    return PaginatedResponse(
        items=[_case_to_response(c) for c in cases],
        total=total, page=page, page_size=page_size,
        total_pages=math.ceil(total / page_size) if total else 0,
    )


@router.get("/stats", dependencies=[Depends(require_law_enforcement)])
async def get_case_stats(service: CaseService = Depends(get_case_service)):
    """Get case statistics."""
    return await service.get_case_stats()


@router.get("/{case_id}", response_model=CaseResponse, dependencies=[Depends(require_legal_professional)])
async def get_case(case_id: str, service: CaseService = Depends(get_case_service)):
    """Get a specific case by ID."""
    return _case_to_response(await service.get_case(case_id))


@router.put("/{case_id}", response_model=CaseResponse, dependencies=[Depends(require_law_enforcement)])
async def update_case(
    case_id: str,
    data: CaseUpdateRequest,
    service: CaseService = Depends(get_case_service),
):
    """Update a case."""
    return _case_to_response(await service.update_case(case_id, data))


@router.delete("/{case_id}", response_model=SuccessResponse, dependencies=[Depends(require_law_enforcement)])
async def delete_case(case_id: str, service: CaseService = Depends(get_case_service)):
    """Delete a case and all related data."""
    await service.delete_case(case_id)
    return SuccessResponse(message="Case deleted successfully")


@router.post("/{case_id}/evidence", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_law_enforcement)])
async def add_evidence(
    case_id: str,
    data: EvidenceCreateRequest,
    current_user: dict = Depends(get_current_user),
    service: CaseService = Depends(get_case_service),
):
    """Add evidence to a case."""
    data.case_id = case_id
    evidence = await service.add_evidence(data, current_user["_id"])
    return EvidenceResponse(
        id=str(evidence.id), case_id=evidence.case_id, title=evidence.title,
        description=evidence.description, evidence_type=evidence.evidence_type,
        file_path=evidence.file_path, file_name=evidence.file_name,
        collected_by=evidence.collected_by, collected_at=evidence.collected_at,
        location_found=evidence.location_found, chain_of_custody=evidence.chain_of_custody,
        tags=evidence.tags, is_verified=evidence.is_verified, created_at=evidence.created_at,
    )


@router.get("/{case_id}/evidence", response_model=list[EvidenceResponse],
            dependencies=[Depends(require_legal_professional)])
async def get_case_evidence(case_id: str, service: CaseService = Depends(get_case_service)):
    """Get all evidence for a case."""
    evidence_list = await service.get_case_evidence(case_id)
    return [
        EvidenceResponse(
            id=str(e.id), case_id=e.case_id, title=e.title, description=e.description,
            evidence_type=e.evidence_type, file_path=e.file_path, file_name=e.file_name,
            collected_by=e.collected_by, collected_at=e.collected_at,
            location_found=e.location_found, chain_of_custody=e.chain_of_custody,
            tags=e.tags, is_verified=e.is_verified, created_at=e.created_at,
        )
        for e in evidence_list
    ]
