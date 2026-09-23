from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.enums import NodeType


class GraphNodeCreateRequest(BaseModel):
    case_id: str
    node_type: NodeType
    label: str
    description: Optional[str] = None
    importance: str = "Medium"
    status: str = "Active"
    evidence_count: int = 0
    properties: Dict[str, Any] = Field(default_factory=dict)


class GraphNodeUpdateRequest(BaseModel):
    label: Optional[str] = None
    node_type: Optional[NodeType] = None
    description: Optional[str] = None
    importance: Optional[str] = None
    status: Optional[str] = None
    evidence_count: Optional[int] = None
    properties: Optional[Dict[str, Any]] = None


class GraphNodeResponse(BaseModel):
    id: Optional[str] = None
    case_id: str
    node_type: str
    label: str
    description: Optional[str] = None
    importance: str = "Medium"
    status: str = "Active"
    evidence_count: int = 0
    properties: Dict[str, Any] = Field(default_factory=dict)
    created_by: Optional[str] = "system"
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True}


class GraphRelationshipCreateRequest(BaseModel):
    case_id: str
    source_id: str
    target_id: str
    relationship_type: str
    label: Optional[str] = None
    weight: float = 1.0
    properties: Dict[str, Any] = Field(default_factory=dict)


class GraphRelationshipResponse(BaseModel):
    id: Optional[str] = None
    case_id: str
    source_id: str
    target_id: str
    relationship_type: str
    label: Optional[str] = None
    weight: float = 1.0
    properties: Dict[str, Any] = Field(default_factory=dict)
    created_by: Optional[str] = "system"
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True}


class TimelineEventResponse(BaseModel):
    id: Optional[str] = None
    date: str
    title: str
    description: Optional[str] = None
    category: str = "General"
    linked_entity_ids: List[str] = Field(default_factory=list)


class GraphStatistics(BaseModel):
    total_nodes: int = 0
    total_relationships: int = 0
    suspects_identified: int = 0
    victims_identified: int = 0
    evidence_collected: int = 0
    witnesses_recorded: int = 0
    locations_tracked: int = 0
    devices_tracked: int = 0
    transactions_tracked: int = 0


class CompletenessScoreBreakdown(BaseModel):
    evidence_availability: int = 0
    witness_statements: int = 0
    suspect_identification: int = 0
    forensic_reports: int = 0
    digital_evidence: int = 0
    financial_records: int = 0


class GraphDataResponse(BaseModel):
    case_id: str
    nodes: List[GraphNodeResponse]
    edges: List[GraphRelationshipResponse]
    node_count: int
    edge_count: int
    timeline: List[TimelineEventResponse] = Field(default_factory=list)
    statistics: GraphStatistics = Field(default_factory=GraphStatistics)
    investigation_score: int = 0
    score_breakdown: CompletenessScoreBreakdown = Field(default_factory=CompletenessScoreBreakdown)

