from typing import Optional, List, Any
from datetime import datetime, timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database.mongodb import get_database


class BaseRepository:
    collection_name: str

    def __init__(self):
        self._db: Optional[AsyncIOMotorDatabase] = None

    @property
    def db(self) -> AsyncIOMotorDatabase:
        if self._db is None:
            self._db = get_database()
        return self._db

    @property
    def collection(self):
        return self.db[self.collection_name]

    @staticmethod
    def to_object_id(id_str: str) -> Optional[ObjectId]:
        from bson.errors import InvalidId
        try:
            return ObjectId(id_str)
        except (InvalidId, ValueError, TypeError):
            return None

    @staticmethod
    def now() -> datetime:
        return datetime.now(timezone.utc)

    async def find_by_id(self, id_str: str) -> Optional[dict]:
        obj_id = self.to_object_id(id_str)
        if obj_id is None:
            return None
        return await self.collection.find_one({"_id": obj_id})

    async def find_one(self, query: dict) -> Optional[dict]:
        return await self.collection.find_one(query)

    async def find_many(
        self,
        query: dict,
        skip: int = 0,
        limit: int = 20,
        sort_field: str = "created_at",
        sort_dir: int = -1,
    ) -> List[dict]:
        cursor = self.collection.find(query).skip(skip).limit(limit).sort(sort_field, sort_dir)
        return await cursor.to_list(length=limit)

    async def count(self, query: dict) -> int:
        return await self.collection.count_documents(query)

    async def insert_one(self, document: dict) -> dict:
        now = self.now()
        document.setdefault("created_at", now)
        document.setdefault("updated_at", now)
        result = await self.collection.insert_one(document)
        document["_id"] = result.inserted_id
        return document

    async def update_by_id(self, id_str: str, update_data: dict) -> int:
        obj_id = self.to_object_id(id_str)
        if obj_id is None:
            return 0
        update_data["updated_at"] = self.now()
        result = await self.collection.update_one(
            {"_id": obj_id}, {"$set": update_data}
        )
        return result.matched_count

    async def delete_by_id(self, id_str: str) -> int:
        obj_id = self.to_object_id(id_str)
        if obj_id is None:
            return 0
        result = await self.collection.delete_one({"_id": obj_id})
        return result.deleted_count

    async def delete_many(self, query: dict) -> int:
        result = await self.collection.delete_many(query)
        return result.deleted_count

    async def aggregate(self, pipeline: List[dict]) -> List[dict]:
        return await self.collection.aggregate(pipeline).to_list(length=None)
