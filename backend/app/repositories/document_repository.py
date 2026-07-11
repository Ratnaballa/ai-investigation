from typing import Optional, List
from .base_repository import BaseRepository


class DocumentRepository(BaseRepository):
    collection_name = "legal_documents"

    async def list_with_filters(
        self,
        page: int,
        page_size: int,
        document_type: Optional[str] = None,
    ) -> tuple[List[dict], int]:
        query: dict = {}
        if document_type:
            query["document_type"] = document_type
        skip = (page - 1) * page_size
        docs = await self.find_many(query, skip=skip, limit=page_size)
        total = await self.count(query)
        return docs, total

    async def get_index_stats(self, total_vectors: int) -> dict:
        total_docs = await self.count({})
        indexed_docs = await self.count({"is_indexed": True})
        return {
            "total_documents": total_docs,
            "indexed_documents": indexed_docs,
            "total_vectors": total_vectors,
        }
