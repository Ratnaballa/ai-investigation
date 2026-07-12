from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.enums import MessageRole


class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=3,
        max_length=2000,
        description="The legal question or case description to analyse",
        examples=["A person was caught stealing a mobile phone worth Rs 15,000 from a shop."],
    )
    session_id: Optional[str] = Field(
        default=None,
        description="Existing session ID to continue a conversation. Omit to start a new session.",
    )
    language: str = Field(
        default="en",
        description="ISO 639-1 language code for the response (e.g. 'en', 'hi')",
    )
    use_rag: bool = Field(
        default=False,
        description="Set true only when a FAISS index is populated. Leave false for direct Grok analysis.",
    )


# ---------------------------------------------------------------------------
# Structured legal analysis response
# ---------------------------------------------------------------------------

class BNSSection(BaseModel):
    """A single recommended BNS / IPC section."""
    section: str = Field(..., description="Section number, e.g. 'BNS Section 303' or 'IPC 420'")
    title: str = Field(..., description="Short title of the section")
    description: str = Field(..., description="What the section covers")
    punishment: str = Field(..., description="Prescribed punishment")
    relevance: str = Field(..., description="Why this section applies to the query")


class InvestigationStep(BaseModel):
    """A single step in the recommended investigation procedure."""
    step: int = Field(..., description="Step number (1-based)")
    action: str = Field(..., description="Action to be taken")
    responsible: str = Field(..., description="Who should perform this action")
    time_frame: str = Field(..., description="Suggested time frame, e.g. 'Within 24 hours'")


class LegalChatResponse(BaseModel):
    """
    Structured legal analysis returned by POST /api/v1/chat.
    Every field maps directly to the required response format.
    """
    session_id: str = Field(..., description="Session ID for this conversation")
    case_summary: str = Field(
        ...,
        description="Concise summary of the case / legal situation described",
    )
    recommended_bns_sections: List[BNSSection] = Field(
        default_factory=list,
        description="Applicable BNS / IPC sections with punishment details",
    )
    investigation_procedure: List[InvestigationStep] = Field(
        default_factory=list,
        description="Step-by-step investigation procedure for law enforcement",
    )
    required_evidence: List[str] = Field(
        default_factory=list,
        description="List of evidence items that should be collected",
    )
    legal_precautions: List[str] = Field(
        default_factory=list,
        description="Legal precautions and rights to be observed during investigation",
    )
    sources: List[str] = Field(
        default_factory=list,
        description="Reference sources (reserved for future RAG integration)",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "session_id": "sess_abc123",
                "case_summary": "Theft of a mobile phone worth Rs 15,000 from a retail shop.",
                "recommended_bns_sections": [
                    {
                        "section": "BNS Section 303(2)",
                        "title": "Theft",
                        "description": "Whoever commits theft shall be punished.",
                        "punishment": "Imprisonment up to 3 years, or fine, or both",
                        "relevance": "Direct theft of movable property.",
                    }
                ],
                "investigation_procedure": [
                    {
                        "step": 1,
                        "action": "Register FIR under BNS Section 303(2)",
                        "responsible": "Station House Officer",
                        "time_frame": "Immediately",
                    }
                ],
                "required_evidence": ["CCTV footage", "Witness statements"],
                "legal_precautions": ["Inform accused of rights under Section 50 CrPC"],
                "sources": [],
            }
        }
    }


class ChatMessageResponse(BaseModel):
    id: Optional[str] = None
    session_id: str
    role: MessageRole
    content: str
    language: str
    rag_context_used: bool
    sources: List[str]
    created_at: datetime

    model_config = {"populate_by_name": True}


class ChatResponse(BaseModel):
    session_id: str
    message: ChatMessageResponse
    response: ChatMessageResponse


class ChatSessionResponse(BaseModel):
    id: Optional[str] = None
    title: str
    language: str
    message_count: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_message: Optional[str] = None

    model_config = {"populate_by_name": True}


class ChatHistoryResponse(BaseModel):
    session: ChatSessionResponse
    messages: List[ChatMessageResponse]
