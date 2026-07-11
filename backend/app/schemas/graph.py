from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel
from app.models.enums import NodeType, RelationshipType


class GraphNodeCreateRequest(BaseModel):
    case_id: str
    node_type: NodeType
    label: str
    properties: Dict[str, Any] = {}


class GraphNodeResponse(BaseModel):
    id: Optional[str] = None
    case_id: str
    node_type: NodeType
    label: str
    properties: Dict[str, Any]
    created_by: str
    created_at: datetime

    model_config = {"populate_by_name": True}


class GraphRelationshipCreateRequest(BaseModel):
    case_id: str
    source_id: str
    target_id: str
    relationship_type: RelationshipType
    label: Optional[str] = None
    weight: float = 1.0
    properties: Dict[str, Any] = {}


class GraphRelationshipResponse(BaseModel):
    id: Optional[str] = None
    case_id: str
    source_id: str
    target_id: str
    relationship_type: RelationshipType
    label: Optional[str] = None
    weight: float
    properties: Dict[str, Any]
    created_by: str
    created_at: datetime

    model_config = {"populate_by_name": True}


class GraphDataResponse(BaseModel):
    case_id: str
    nodes: List[GraphNodeResponse]
    edges: List[GraphRelationshipResponse]
    node_count: int
    edge_count: int
