from typing import List, Optional
from pydantic import Field
from .base import BaseDocument
from .enums import MessageRole


class ChatMessage(BaseDocument):
    session_id: str
    user_id: str
    role: MessageRole
    content: str
    language: str = "en"
    rag_context_used: bool = False
    sources: List[str] = Field(default_factory=list)
    tokens_used: Optional[int] = None

    class Settings:
        collection = "chat_history"


class ChatSession(BaseDocument):
    user_id: str
    title: str = "New Conversation"
    language: str = "en"
    message_count: int = 0
    is_active: bool = True

    class Settings:
        collection = "chat_sessions"
