from typing import Optional
from fastapi import APIRouter, Depends, Query, UploadFile, File, status
from app.schemas.graph import (
    GraphNodeCreateRequest, GraphNodeUpdateRequest, GraphNodeResponse,
    GraphRelationshipCreateRequest, GraphRelationshipResponse,
    GraphDataResponse,
)
from app.schemas.common import SuccessResponse
from app.api.auth.dependencies import get_current_user, require_law_enforcement, require_legal_professional
from app.dependencies import get_graph_service
from app.services.graph_service import GraphService

router = APIRouter(prefix="/graph", tags=["Evidence Graph"])


@router.get("", response_model=GraphDataResponse, dependencies=[Depends(require_legal_professional)])
async def get_graph_by_query(
    case_id: Optional[str] = Query(None),
    service: GraphService = Depends(get_graph_service),
):
    """Get the complete evidence relationship graph for a case or demo case."""
    target_case_id = case_id or "default_case"
    return await service.get_case_graph(target_case_id)


@router.get("/cases/{case_id}", response_model=GraphDataResponse,
            dependencies=[Depends(require_legal_professional)])
async def get_case_graph(case_id: str, service: GraphService = Depends(get_graph_service)):
    """Get the complete evidence relationship graph for a case."""
    return await service.get_case_graph(case_id)


@router.post("/cases/{case_id}/generate", response_model=GraphDataResponse,
             dependencies=[Depends(require_law_enforcement)])
async def generate_ai_graph(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    service: GraphService = Depends(get_graph_service),
):
    """Reanalyze case description & evidence with AI to rebuild entities, relationships, timeline, and score."""
    return await service.generate_ai_graph(case_id, current_user["_id"])


@router.post("/cases/{case_id}/upload-evidence", response_model=GraphDataResponse,
             dependencies=[Depends(require_law_enforcement)])
async def upload_evidence_file(
    case_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    service: GraphService = Depends(get_graph_service),
):
    """Upload evidence file (PDF, DOCX, image), extract metadata, and auto-update graph."""
    content = await file.read()
    return await service.process_evidence_upload(case_id, content, file.filename, current_user["_id"])


@router.post("/nodes", response_model=GraphNodeResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_law_enforcement)])
async def add_node(
    data: GraphNodeCreateRequest,
    current_user: dict = Depends(get_current_user),
    service: GraphService = Depends(get_graph_service),
):
    """Add a node (suspect, victim, witness, evidence, location, device, transaction, etc.) to the graph."""
    return await service.add_node(data, current_user["_id"])


@router.put("/nodes/{node_id}", response_model=GraphNodeResponse,
            dependencies=[Depends(require_law_enforcement)])
async def update_node(
    node_id: str,
    data: GraphNodeUpdateRequest,
    service: GraphService = Depends(get_graph_service),
):
    """Update node properties."""
    return await service.update_node(node_id, data)


@router.post("/relationships", response_model=GraphRelationshipResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_law_enforcement)])
@router.post("/edges", response_model=GraphRelationshipResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_law_enforcement)])
async def add_relationship(
    data: GraphRelationshipCreateRequest,
    current_user: dict = Depends(get_current_user),
    service: GraphService = Depends(get_graph_service),
):
    """Add a relationship (edge) between two graph nodes."""
    return await service.add_relationship(data, current_user["_id"])


@router.delete("/nodes/{node_id}", response_model=SuccessResponse,
               dependencies=[Depends(require_law_enforcement)])
async def delete_node(node_id: str, service: GraphService = Depends(get_graph_service)):
    """Delete a graph node and all its relationships."""
    await service.delete_node(node_id)
    return SuccessResponse(message="Node and its relationships deleted successfully")


@router.delete("/relationships/{rel_id}", response_model=SuccessResponse,
               dependencies=[Depends(require_law_enforcement)])
@router.delete("/edges/{rel_id}", response_model=SuccessResponse,
               dependencies=[Depends(require_law_enforcement)])
async def delete_relationship(rel_id: str, service: GraphService = Depends(get_graph_service)):
    """Delete a graph relationship."""
    await service.delete_relationship(rel_id)
    return SuccessResponse(message="Relationship deleted successfully")

