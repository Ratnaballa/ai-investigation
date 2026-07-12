from fastapi import APIRouter, Depends, Query
from app.schemas.chat import ChatRequest, LegalChatResponse, ChatHistoryResponse, ChatSessionResponse
from app.schemas.common import SuccessResponse
from app.api.auth.dependencies import get_current_user
from app.dependencies import get_chat_service
from app.services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["Chatbot"])


@router.post(
    "",
    response_model=LegalChatResponse,
    summary="Analyse a legal query",
    description=(
        "Send a legal question or case description to the CaseMind AI. "
        "Returns a structured analysis with applicable BNS/IPC sections, "
        "investigation procedure, required evidence, and legal precautions.\n\n"
        "Set `use_rag: false` (default) for direct CaseMind analysis. "
        "Set `use_rag: true` only when a FAISS document index has been populated."
    ),
    responses={
        200: {"description": "Structured legal analysis returned"},
        401: {"description": "Missing or invalid access token"},
        503: {"description": "CaseMind AI service is temporarily unavailable"},
    },
)
async def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    """Analyse a legal query using the CaseMind AI and return structured JSON."""
    return await service.chat(request, current_user["_id"])


@router.post("/sessions", response_model=ChatSessionResponse)
async def create_session(
    current_user: dict = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    """Create a new empty chat session."""
    return await service.create_session(current_user["_id"])


@router.get("/sessions", response_model=dict)
async def get_sessions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    """Get all chat sessions for the current user."""
    return await service.get_user_sessions(current_user["_id"], page, page_size)


@router.get("/sessions/{session_id}", response_model=ChatHistoryResponse)
async def get_session_history(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    """Get full chat history for a session."""
    return await service.get_session_history(session_id, current_user["_id"])


@router.delete("/sessions/{session_id}", response_model=SuccessResponse)
async def delete_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    """Delete a chat session and its history."""
    await service.delete_session(session_id, current_user["_id"])
    return SuccessResponse(message="Chat session deleted successfully")
