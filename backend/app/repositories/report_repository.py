from typing import Optional, List
from .base_repository import BaseRepository


class ReportRepository(BaseRepository):
    collection_name = "reports"

    async def list_with_filters(
        self,
        page: int,
        page_size: int,
        case_id: Optional[str] = None,
        created_by: Optional[str] = None,
    ) -> tuple[List[dict], int]:
        query: dict = {}
        if case_id:
            query["case_id"] = case_id
        if created_by:
            query["created_by"] = created_by
        skip = (page - 1) * page_size
        docs = await self.find_many(query, skip=skip, limit=page_size)
        total = await self.count(query)
        return docs, total
