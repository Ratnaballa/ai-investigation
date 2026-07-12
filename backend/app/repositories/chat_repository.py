from typing import List, Optional
from .base_repository import BaseRepository


class ChatSessionRepository(BaseRepository):
    collection_name = "chat_sessions"

    async def find_user_session(self, session_id: str, user_id: str) -> Optional[dict]:
        return await self.find_one({"session_id": session_id, "user_id": user_id})

    async def list_user_sessions(self, user_id: str, page: int, page_size: int) -> tuple[List[dict], int]:
        query = {"user_id": user_id}
        skip = (page - 1) * page_size
        docs = await self.find_many(query, skip=skip, limit=page_size, sort_field="updated_at")
        total = await self.count(query)
        return docs, total

    async def increment_message_count(self, session_id: str, count: int = 2):
        await self.collection.update_one(
            {"session_id": session_id},
            {"$inc": {"message_count": count}, "$set": {"updated_at": self.now()}},
        )

    async def update_session_activity(self, session_id: str, last_message: str, count: int = 2):
        await self.collection.update_one(
            {"session_id": session_id},
            {
                "$inc": {"message_count": count},
                "$set": {
                    "last_message": last_message,
                    "updated_at": self.now()
                }
            },
        )

    async def delete_user_session(self, session_id: str, user_id: str) -> int:
        result = await self.collection.delete_one({"session_id": session_id, "user_id": user_id})
        return result.deleted_count


class ChatHistoryRepository(BaseRepository):
    collection_name = "chat_history"

    async def find_session_messages(self, session_id: str, user_id: str) -> List[dict]:
        cursor = self.collection.find(
            {"session_id": session_id, "user_id": user_id}
        ).sort("created_at", 1)
        return await cursor.to_list(length=500)

    async def delete_session_messages(self, session_id: str, user_id: str) -> int:
        return await self.delete_many({"session_id": session_id, "user_id": user_id})
