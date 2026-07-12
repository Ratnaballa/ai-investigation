from typing import List, Optional, Dict, Any
from loguru import logger
from app.repositories.report_repository import ReportRepository
from app.repositories.case_repository import CaseRepository, EvidenceRepository
from app.repositories.graph_repository import GraphNodeRepository
from app.models.report import Report
from app.schemas.document import ReportCreateRequest, ReportResponse, GenerateReportRequest
from app.core.exceptions import NotFoundException
from app.rag.grok_client import get_grok_client
from app.database.mongodb import get_database
from bson import ObjectId


class ReportService:
    def __init__(self):
        self.repo = ReportRepository()
        self.case_repo = CaseRepository()
        self.evidence_repo = EvidenceRepository()
        self.node_repo = GraphNodeRepository()
        self.grok = get_grok_client()

    async def create_report(self, data: ReportCreateRequest, created_by: str) -> Report:
        content = data.content or {}
        content.setdefault("case_summary", data.summary or "No summary details available.")
        content.setdefault("applicable_bns_sections", [])
        content.setdefault("investigation_procedure", [])
        content.setdefault("required_evidence", [])
        content.setdefault("legal_precautions", [])

        doc = await self.repo.insert_one({
            "case_id": data.case_id,
            "title": data.title,
            "report_type": data.report_type,
            "content": content,
            "summary": data.summary or content.get("case_summary"),
            "created_by": created_by,
            "is_finalized": False,
            "file_path": None,
            "tags": data.tags,
        })
        return Report(**doc)

    async def get_user_name(self, user_id: str) -> str:
        try:
            db = get_database()
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            return user["full_name"] if user else "Unknown Officer"
        except Exception:
            return "Unknown Officer"

    async def generate_ai_report(self, request: GenerateReportRequest, created_by: str) -> Report:
        case = await self.case_repo.find_by_id(request.case_id)
        if not case:
            case = await self.case_repo.find_by_case_number(request.case_id)
        if not case:
            raise NotFoundException("Case")

        case_db_id = str(case["_id"])
        content_data = {"case_number": case["case_number"], "case_title": case["title"]}

        if request.include_evidence:
            evidence = await self.evidence_repo.find_by_case(case_db_id)
            content_data["evidence"] = [
                {"title": e["title"], "type": e["evidence_type"], "description": e["description"]}
                for e in evidence
            ]

        if request.include_graph:
            nodes = await self.node_repo.find_by_case(case_db_id)
            content_data["entities"] = [{"label": n["label"], "type": n["node_type"]} for n in nodes]

        prompt = (
            f"You are a professional legal report writer for law enforcement.\n"
            f"Generate a professional {request.report_type} report for the following case:\n"
            f"Case Number: {case['case_number']}\n"
            f"Case Title: {case['title']}\n"
            f"Description: {case['description']}\n"
            f"Status: {case['status']}\n"
            f"Evidence: {content_data.get('evidence', [])}\n"
            f"Graph Entities: {content_data.get('entities', [])}\n\n"
            f"You MUST return a JSON object with the following keys:\n"
            f"- 'case_summary': A clear and concise summary of the case.\n"
            f"- 'applicable_bns_sections': A list of applicable BNS/IPC sections with titles and short descriptions (e.g. ['BNS Section 303 - Theft: Punishment for theft']).\n"
            f"- 'investigation_procedure': A list of step-by-step investigation procedures (e.g. ['Step 1: Register FIR', 'Step 2: Collect evidence']).\n"
            f"- 'required_evidence': A list of evidence to collect.\n"
            f"- 'legal_precautions': A list of legal precautions and safeguards.\n\n"
            f"Format the response as raw JSON. Do not include markdown code blocks or extra text."
        )

        ai_content = await self.grok.chat(
            [
                {"role": "system", "content": "You are a professional legal report writer that outputs raw structured JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=3000,
        )

        import json
        try:
            cleaned = ai_content.strip()
            if cleaned.startswith("```"):
                lines = cleaned.splitlines()
                cleaned = "\n".join(lines[1:-1]).strip()
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:].strip()
            parsed = json.loads(cleaned)
        except Exception as e:
            logger.error(f"Failed to parse report AI content: {e}. Raw content: {ai_content}")
            parsed = {
                "case_summary": case["description"],
                "applicable_bns_sections": [f"BNS Sections: {case.get('applicable_sections', [])}"],
                "investigation_procedure": ["Proceed with standard investigation protocol."],
                "required_evidence": [e["title"] for e in content_data.get("evidence", [])] if "evidence" in content_data else [],
                "legal_precautions": ["Follow standard legal rights and guidelines."],
            }

        summary_text = (
            f"# {request.report_type.title()} Report\n\n"
            f"**Case Number**: {case['case_number']}\n"
            f"**Case Title**: {case['title']}\n"
            f"**Status**: {case['status']}\n\n"
            f"## Case Summary\n{parsed.get('case_summary', '')}\n\n"
            f"## Applicable BNS Sections\n" + "\n".join(f"- {s}" for s in parsed.get('applicable_bns_sections', [])) + "\n\n"
            f"## Investigation Procedure\n" + "\n".join(f"- {step}" for step in parsed.get('investigation_procedure', [])) + "\n\n"
            f"## Required Evidence\n" + "\n".join(f"- {e}" for e in parsed.get('required_evidence', [])) + "\n\n"
            f"## Legal Precautions\n" + "\n".join(f"- {p}" for p in parsed.get('legal_precautions', []))
        )

        title = request.title or f"{request.report_type.title()} Report - {case['case_number']}"

        doc = await self.repo.insert_one({
            "case_id": case_db_id,
            "title": title,
            "report_type": request.report_type,
            "content": parsed,
            "summary": summary_text,
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
