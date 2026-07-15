from typing import List, Optional
from .base_repository import BaseRepository


class LegalHistoryRepository(BaseRepository):
    collection_name = "legal_history"

    async def list_by_user(
        self, user_id: str, page: int = 1, page_size: int = 50
    ) -> tuple[List[dict], int]:
        query = {"user_id": user_id}
        skip = (page - 1) * page_size
        docs = await self.find_many(
            query, skip=skip, limit=page_size, sort_field="created_at", sort_dir=-1
        )
        total = await self.count(query)
        return docs, total

    async def find_user_item(self, item_id: str, user_id: str) -> Optional[dict]:
        try:
            return await self.collection.find_one(
                {"_id": self.to_object_id(item_id), "user_id": user_id}
            )
        except Exception:
            return None

    async def delete_user_item(self, item_id: str, user_id: str) -> int:
        try:
            result = await self.collection.delete_one(
                {"_id": self.to_object_id(item_id), "user_id": user_id}
            )
            return result.deleted_count
        except Exception:
            return 0
