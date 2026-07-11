from typing import Optional, Dict, Any
from pydantic import Field
from .base import BaseDocument
from .enums import NodeType, RelationshipType


class GraphNode(BaseDocument):
    case_id: str
    node_type: NodeType
    label: str
    properties: Dict[str, Any] = Field(default_factory=dict)
    created_by: str

    class Settings:
        collection = "graph_nodes"


class GraphRelationship(BaseDocument):
    case_id: str
    source_id: str
    target_id: str
    relationship_type: RelationshipType
    label: Optional[str] = None
    weight: float = 1.0
    properties: Dict[str, Any] = Field(default_factory=dict)
    created_by: str

    class Settings:
        collection = "graph_relationships"
