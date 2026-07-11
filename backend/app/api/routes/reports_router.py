import math
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from app.schemas.document import ReportCreateRequest, ReportResponse, GenerateReportRequest
from app.schemas.common import SuccessResponse, PaginatedResponse
from app.api.auth.dependencies import get_current_user, require_law_enforcement, require_legal_professional
from app.dependencies import get_report_service
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])


def _report_to_response(report) -> ReportResponse:
    return ReportResponse(
        id=str(report.id), case_id=report.case_id, title=report.title,
        report_type=report.report_type, content=report.content,
        summary=report.summary, file_path=report.file_path,
        created_by=report.created_by, is_finalized=report.is_finalized,
        tags=report.tags, created_at=report.created_at, updated_at=report.updated_at,
    )


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_legal_professional)])
async def create_report(
    data: ReportCreateRequest,
    current_user: dict = Depends(get_current_user),
    service: ReportService = Depends(get_report_service),
):
    """Create a manual report."""
    return _report_to_response(await service.create_report(data, current_user["_id"]))


@router.post("/generate", response_model=ReportResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_legal_professional)])
async def generate_ai_report(
    request: GenerateReportRequest,
    current_user: dict = Depends(get_current_user),
    service: ReportService = Depends(get_report_service),
):
    """Generate an AI-powered report for a case using Grok."""
    return _report_to_response(await service.generate_ai_report(request, current_user["_id"]))


@router.get("", response_model=PaginatedResponse, dependencies=[Depends(require_legal_professional)])
async def list_reports(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    case_id: Optional[str] = None,
    service: ReportService = Depends(get_report_service),
):
    """List reports."""
    reports, total = await service.list_reports(page, page_size, case_id)
    return PaginatedResponse(
        items=[_report_to_response(r) for r in reports],
        total=total, page=page, page_size=page_size,
        total_pages=math.ceil(total / page_size) if total else 0,
    )


@router.get("/{report_id}", response_model=ReportResponse, dependencies=[Depends(require_legal_professional)])
async def get_report(report_id: str, service: ReportService = Depends(get_report_service)):
    """Get a specific report."""
    return _report_to_response(await service.get_report(report_id))


@router.post("/{report_id}/finalize", response_model=ReportResponse,
             dependencies=[Depends(require_law_enforcement)])
async def finalize_report(report_id: str, service: ReportService = Depends(get_report_service)):
    """Mark a report as finalized."""
    return _report_to_response(await service.finalize_report(report_id))


@router.delete("/{report_id}", response_model=SuccessResponse,
               dependencies=[Depends(require_law_enforcement)])
async def delete_report(report_id: str, service: ReportService = Depends(get_report_service)):
    """Delete a report."""
    await service.delete_report(report_id)
    return SuccessResponse(message="Report deleted successfully")
