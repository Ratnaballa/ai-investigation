from typing import List, Optional
from loguru import logger
from app.repositories.report_repository import ReportRepository
from app.repositories.case_repository import CaseRepository, EvidenceRepository
from app.repositories.graph_repository import GraphNodeRepository
from app.models.report import Report
from app.schemas.document import ReportCreateRequest, ReportResponse, GenerateReportRequest
from app.core.exceptions import NotFoundException
from app.rag.grok_client import get_grok_client


class ReportService:
    def __init__(self):
        self.repo = ReportRepository()
        self.case_repo = CaseRepository()
        self.evidence_repo = EvidenceRepository()
        self.node_repo = GraphNodeRepository()
        self.grok = get_grok_client()

    async def create_report(self, data: ReportCreateRequest, created_by: str) -> Report:
        doc = await self.repo.insert_one({
            **data.model_dump(),
            "created_by": created_by,
            "is_finalized": False,
            "file_path": None,
        })
        return Report(**doc)

    async def generate_ai_report(self, request: GenerateReportRequest, created_by: str) -> Report:
        case = await self.case_repo.find_by_id(request.case_id)
        if not case:
            raise NotFoundException("Case")

        content = {"case_number": case["case_number"], "case_title": case["title"]}

        if request.include_evidence:
            evidence = await self.evidence_repo.find_by_case(request.case_id)
            content["evidence"] = [
                {"title": e["title"], "type": e["evidence_type"], "description": e["description"]}
                for e in evidence
            ]

        if request.include_graph:
            nodes = await self.node_repo.find_by_case(request.case_id)
            content["entities"] = [{"label": n["label"], "type": n["node_type"]} for n in nodes]

        prompt = (
            f"Generate a professional {request.report_type} report for:\n"
            f"Case: {case['case_number']} - {case['title']}\n"
            f"Description: {case['description']}\n"
            f"Status: {case['status']}\n"
            f"Content data: {content}\n\n"
            f"Provide a structured, professional report with executive summary, findings, and recommendations."
        )

        ai_content = await self.grok.chat(
            [
                {"role": "system", "content": "You are a professional legal report writer for law enforcement."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
            max_tokens=3000,
        )

        doc = await self.repo.insert_one({
            "case_id": request.case_id,
            "title": f"{request.report_type.title()} Report - {case['case_number']}",
            "report_type": request.report_type,
            "content": content,
            "summary": ai_content,
            "file_path": None,
            "created_by": created_by,
            "is_finalized": False,
            "tags": [case["case_number"], request.report_type],
        })
        logger.info(f"AI report generated for case: {request.case_id}")
        return Report(**doc)

    async def get_report(self, report_id: str) -> Report:
        doc = await self.repo.find_by_id(report_id)
        if not doc:
            raise NotFoundException("Report")
        return Report(**doc)

    async def list_reports(
        self, page: int = 1, page_size: int = 20,
        case_id: Optional[str] = None, created_by: Optional[str] = None,
    ) -> tuple[List[Report], int]:
        docs, total = await self.repo.list_with_filters(page, page_size, case_id, created_by)
        return [Report(**d) for d in docs], total

    async def finalize_report(self, report_id: str) -> Report:
        if await self.repo.update_by_id(report_id, {"is_finalized": True}) == 0:
            raise NotFoundException("Report")
        return await self.get_report(report_id)

    async def delete_report(self, report_id: str):
        if await self.repo.delete_by_id(report_id) == 0:
            raise NotFoundException("Report")
