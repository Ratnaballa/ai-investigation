from fastapi import APIRouter, Depends, status
from app.schemas.graph import (
    GraphNodeCreateRequest, GraphNodeResponse,
    GraphRelationshipCreateRequest, GraphRelationshipResponse,
    GraphDataResponse,
)
from app.schemas.common import SuccessResponse
from app.api.auth.dependencies import get_current_user, require_law_enforcement, require_legal_professional
from app.dependencies import get_graph_service
from app.services.graph_service import GraphService

router = APIRouter(prefix="/graph", tags=["Evidence Graph"])


@router.get("/cases/{case_id}", response_model=GraphDataResponse,
            dependencies=[Depends(require_legal_professional)])
async def get_case_graph(case_id: str, service: GraphService = Depends(get_graph_service)):
    """Get the complete evidence relationship graph for a case."""
    return await service.get_case_graph(case_id)


@router.post("/nodes", response_model=GraphNodeResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_law_enforcement)])
async def add_node(
    data: GraphNodeCreateRequest,
    current_user: dict = Depends(get_current_user),
    service: GraphService = Depends(get_graph_service),
):
    """Add a node (suspect, victim, witness, etc.) to the graph."""
    node = await service.add_node(data, current_user["_id"])
    return GraphNodeResponse(
        id=str(node.id), case_id=node.case_id, node_type=node.node_type,
        label=node.label, properties=node.properties,
        created_by=node.created_by, created_at=node.created_at,
    )


@router.post("/relationships", response_model=GraphRelationshipResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_law_enforcement)])
async def add_relationship(
    data: GraphRelationshipCreateRequest,
    current_user: dict = Depends(get_current_user),
    service: GraphService = Depends(get_graph_service),
):
    """Add a relationship (edge) between two graph nodes."""
    rel = await service.add_relationship(data, current_user["_id"])
    return GraphRelationshipResponse(
        id=str(rel.id), case_id=rel.case_id, source_id=rel.source_id,
        target_id=rel.target_id, relationship_type=rel.relationship_type,
        label=rel.label, weight=rel.weight, properties=rel.properties,
        created_by=rel.created_by, created_at=rel.created_at,
    )


@router.delete("/nodes/{node_id}", response_model=SuccessResponse,
               dependencies=[Depends(require_law_enforcement)])
async def delete_node(node_id: str, service: GraphService = Depends(get_graph_service)):
    """Delete a graph node and all its relationships."""
    await service.delete_node(node_id)
    return SuccessResponse(message="Node and its relationships deleted successfully")


@router.delete("/relationships/{rel_id}", response_model=SuccessResponse,
               dependencies=[Depends(require_law_enforcement)])
async def delete_relationship(rel_id: str, service: GraphService = Depends(get_graph_service)):
    """Delete a graph relationship."""
    await service.delete_relationship(rel_id)
    return SuccessResponse(message="Relationship deleted successfully")
