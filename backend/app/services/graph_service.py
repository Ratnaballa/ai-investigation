from loguru import logger
from app.repositories.graph_repository import GraphNodeRepository, GraphRelationshipRepository
from app.models.graph import GraphNode, GraphRelationship
from app.schemas.graph import (
    GraphNodeCreateRequest, GraphRelationshipCreateRequest, GraphDataResponse,
    GraphNodeResponse, GraphRelationshipResponse,
)
from app.core.exceptions import NotFoundException, BadRequestException


class GraphService:
    def __init__(self):
        self.node_repo = GraphNodeRepository()
        self.rel_repo = GraphRelationshipRepository()

    async def add_node(self, data: GraphNodeCreateRequest, created_by: str) -> GraphNode:
        doc = await self.node_repo.insert_one({**data.model_dump(), "created_by": created_by})
        logger.info(f"Graph node added: {data.label} ({data.node_type}) for case {data.case_id}")
        return GraphNode(**doc)

    async def add_relationship(self, data: GraphRelationshipCreateRequest, created_by: str) -> GraphRelationship:
        source = await self.node_repo.find_by_id(data.source_id)
        target = await self.node_repo.find_by_id(data.target_id)
        if not source or not target:
            raise NotFoundException("Source or target node")
        if source.get("case_id") != data.case_id or target.get("case_id") != data.case_id:
            raise BadRequestException("Nodes must belong to the same case")

        doc = await self.rel_repo.insert_one({**data.model_dump(), "created_by": created_by})
        return GraphRelationship(**doc)

    async def get_case_graph(self, case_id: str) -> GraphDataResponse:
        nodes_docs = await self.node_repo.find_by_case(case_id)
        rels_docs = await self.rel_repo.find_by_case(case_id)

        nodes = [
            GraphNodeResponse(
                id=str(n["_id"]), case_id=n["case_id"], node_type=n["node_type"],
                label=n["label"], properties=n.get("properties", {}),
                created_by=n["created_by"], created_at=n["created_at"],
            )
            for n in nodes_docs
        ]
        edges = [
            GraphRelationshipResponse(
                id=str(r["_id"]), case_id=r["case_id"], source_id=r["source_id"],
                target_id=r["target_id"], relationship_type=r["relationship_type"],
                label=r.get("label"), weight=r.get("weight", 1.0),
                properties=r.get("properties", {}),
                created_by=r["created_by"], created_at=r["created_at"],
            )
            for r in rels_docs
        ]
        return GraphDataResponse(
            case_id=case_id, nodes=nodes, edges=edges,
            node_count=len(nodes), edge_count=len(edges),
        )

    async def delete_node(self, node_id: str):
        if await self.node_repo.delete_by_id(node_id) == 0:
            raise NotFoundException("Graph node")
        await self.rel_repo.delete_by_node(node_id)

    async def delete_relationship(self, rel_id: str):
        if await self.rel_repo.delete_by_id(rel_id) == 0:
            raise NotFoundException("Graph relationship")
