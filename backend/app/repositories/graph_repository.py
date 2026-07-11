from typing import List
from .base_repository import BaseRepository


class GraphNodeRepository(BaseRepository):
    collection_name = "graph_nodes"

    async def find_by_case(self, case_id: str) -> List[dict]:
        return await self.find_many({"case_id": case_id}, limit=10000)

    async def delete_by_case(self, case_id: str) -> int:
        return await self.delete_many({"case_id": case_id})


class GraphRelationshipRepository(BaseRepository):
    collection_name = "graph_relationships"

    async def find_by_case(self, case_id: str) -> List[dict]:
        return await self.find_many({"case_id": case_id}, limit=10000)

    async def delete_by_node(self, node_id: str) -> int:
        return await self.delete_many(
            {"$or": [{"source_id": node_id}, {"target_id": node_id}]}
        )

    async def delete_by_case(self, case_id: str) -> int:
        return await self.delete_many({"case_id": case_id})
