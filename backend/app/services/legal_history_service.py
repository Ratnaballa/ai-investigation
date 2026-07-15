from typing import List
from loguru import logger
from app.repositories.legal_history_repository import LegalHistoryRepository
from app.schemas.legal_history import (
    LegalHistoryCreateRequest,
    LegalHistoryResponse,
    LegalHistoryListResponse,
)
from app.core.exceptions import NotFoundException


class LegalHistoryService:
    def __init__(self):
        self.repo = LegalHistoryRepository()

    def _to_response(self, doc: dict) -> LegalHistoryResponse:
        return LegalHistoryResponse(
            id=str(doc["_id"]),
            query=doc["query"],
            result=doc["result"],
            title=doc["title"],
            summary=doc["summary"],
            created_at=doc["created_at"],
        )

    async def save(
        self, request: LegalHistoryCreateRequest, user_id: str
    ) -> LegalHistoryResponse:
        doc = await self.repo.insert_one({
            "user_id": user_id,
            "query": request.query,
            "result": request.result,
            "title": request.title,
            "summary": request.summary,
        })
        logger.info(f"[LEGAL_HISTORY] Saved | user={user_id} | title={request.title}")
        return self._to_response(doc)

    async def list_history(
        self, user_id: str, page: int = 1, page_size: int = 50
    ) -> LegalHistoryListResponse:
        docs, total = await self.repo.list_by_user(user_id, page, page_size)
        return LegalHistoryListResponse(
            items=[self._to_response(d) for d in docs],
            total=total,
        )

    async def get_item(self, item_id: str, user_id: str) -> LegalHistoryResponse:
        doc = await self.repo.find_user_item(item_id, user_id)
        if not doc:
            raise NotFoundException("Legal history item")
        return self._to_response(doc)

    async def delete_item(self, item_id: str, user_id: str):
        deleted = await self.repo.delete_user_item(item_id, user_id)
        if deleted == 0:
            raise NotFoundException("Legal history item")
