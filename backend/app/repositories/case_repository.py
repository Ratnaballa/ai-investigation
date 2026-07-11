from typing import Optional, List
from .base_repository import BaseRepository


class CaseRepository(BaseRepository):
    collection_name = "cases"

    async def find_by_case_number(self, case_number: str) -> Optional[dict]:
        return await self.find_one({"case_number": case_number})

    async def list_with_filters(
        self,
        page: int,
        page_size: int,
        status: Optional[str] = None,
        assigned_officer_id: Optional[str] = None,
        created_by: Optional[str] = None,
    ) -> tuple[List[dict], int]:
        query: dict = {}
        if status:
            query["status"] = status
        if assigned_officer_id:
            query["assigned_officer_id"] = assigned_officer_id
        if created_by:
            query["created_by"] = created_by
        skip = (page - 1) * page_size
        docs = await self.find_many(query, skip=skip, limit=page_size)
        total = await self.count(query)
        return docs, total

    async def get_status_stats(self) -> dict:
        pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
        status_counts = await self.aggregate(pipeline)
        total = await self.count({})
        return {
            "total_cases": total,
            "by_status": {s["_id"]: s["count"] for s in status_counts},
        }


class EvidenceRepository(BaseRepository):
    collection_name = "evidence"

    async def find_by_case(self, case_id: str) -> List[dict]:
        return await self.find_many({"case_id": case_id}, limit=1000)

    async def delete_by_case(self, case_id: str) -> int:
        return await self.delete_many({"case_id": case_id})
