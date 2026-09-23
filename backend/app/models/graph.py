from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime
from .base import BaseDocument
from .enums import NodeType, RelationshipType


class GraphNode(BaseDocument):
    case_id: str
    node_type: NodeType
    label: str
    description: Optional[str] = None
    importance: str = "Medium"  # High, Medium, Low
    status: str = "Active"       # Active, Under Review, Verified
    evidence_count: int = 0
    properties: Dict[str, Any] = Field(default_factory=dict)
    created_by: str

    class Settings:
        collection = "graph_nodes"


class GraphRelationship(BaseDocument):
    case_id: str
    source_id: str
    target_id: str
    relationship_type: str  # Can be RelationshipType or dynamic string
    label: Optional[str] = None
    weight: float = 1.0
    properties: Dict[str, Any] = Field(default_factory=dict)
    created_by: str

    class Settings:
        collection = "graph_relationships"


class TimelineEvent(BaseModel):
    id: Optional[str] = None
    date: str
    title: str
    description: Optional[str] = None
    category: str = "General"
    linked_entity_ids: List[str] = Field(default_factory=list)


class InvestigationGraph(BaseDocument):
    case_id: str
    nodes: List[Dict[str, Any]] = Field(default_factory=list)
    edges: List[Dict[str, Any]] = Field(default_factory=list)
    timeline: List[Dict[str, Any]] = Field(default_factory=list)
    statistics: Dict[str, int] = Field(default_factory=dict)
    investigation_score: int = 0
    score_breakdown: Dict[str, Any] = Field(default_factory=dict)
    created_by: str

    class Settings:
        collection = "investigation_graphs"

