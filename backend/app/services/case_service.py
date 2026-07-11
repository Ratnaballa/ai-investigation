from typing import List, Optional
from datetime import datetime, timezone
from loguru import logger
from app.repositories.case_repository import CaseRepository, EvidenceRepository
from app.repositories.graph_repository import GraphNodeRepository, GraphRelationshipRepository
from app.models.case import Case, Evidence
from app.schemas.case import CaseCreateRequest, CaseUpdateRequest, EvidenceCreateRequest
from app.core.exceptions import NotFoundException
from app.utils.helpers import generate_case_number


class CaseService:
    def __init__(self):
        self.repo = CaseRepository()
        self.evidence_repo = EvidenceRepository()
        self.node_repo = GraphNodeRepository()
        self.rel_repo = GraphRelationshipRepository()

    async def create_case(self, data: CaseCreateRequest, created_by: str) -> Case:
        case_doc = {
            **data.model_dump(),
            "case_number": generate_case_number(),
            "created_by": created_by,
            "applicable_sections": [],
            "status": "open",
        }
        doc = await self.repo.insert_one(case_doc)
        logger.info(f"Case created: {doc['case_number']} by {created_by}")
        return Case(**doc)

    async def get_case(self, case_id: str) -> Case:
        doc = await self.repo.find_by_id(case_id)
        if not doc:
            raise NotFoundException("Case")
        return Case(**doc)

    async def update_case(self, case_id: str, data: CaseUpdateRequest) -> Case:
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        if await self.repo.update_by_id(case_id, update_data) == 0:
            raise NotFoundException("Case")
        return await self.get_case(case_id)

    async def list_cases(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        assigned_officer_id: Optional[str] = None,
        created_by: Optional[str] = None,
    ) -> tuple[List[Case], int]:
        docs, total = await self.repo.list_with_filters(
            page, page_size, status, assigned_officer_id, created_by
        )
        return [Case(**d) for d in docs], total

    async def delete_case(self, case_id: str):
        if await self.repo.delete_by_id(case_id) == 0:
            raise NotFoundException("Case")
        await self.evidence_repo.delete_by_case(case_id)
        await self.node_repo.delete_by_case(case_id)
        await self.rel_repo.delete_by_case(case_id)
        logger.info(f"Case deleted: {case_id}")

    async def add_evidence(self, data: EvidenceCreateRequest, collected_by: str) -> Evidence:
        await self.get_case(data.case_id)
        evidence_doc = {
            **data.model_dump(),
            "collected_by": collected_by,
            "chain_of_custody": [
                {"action": "collected", "by": collected_by, "at": datetime.now(timezone.utc).isoformat()}
            ],
            "is_verified": False,
        }
        doc = await self.evidence_repo.insert_one(evidence_doc)
        return Evidence(**doc)

    async def get_case_evidence(self, case_id: str) -> List[Evidence]:
        docs = await self.evidence_repo.find_by_case(case_id)
        return [Evidence(**d) for d in docs]

    async def get_case_stats(self) -> dict:
        return await self.repo.get_status_stats()
