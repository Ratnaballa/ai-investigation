from typing import List
import json
from loguru import logger
from app.repositories.chat_repository import ChatSessionRepository, ChatHistoryRepository
from app.rag.pipeline import get_rag_pipeline
from app.rag.grok_client import get_grok_client
from app.models.enums import MessageRole
from app.schemas.chat import (
    ChatRequest, LegalChatResponse, BNSSection, InvestigationStep,
    ChatHistoryResponse, ChatMessageResponse, ChatSessionResponse,
)
from app.utils.helpers import generate_session_id
from app.core.exceptions import NotFoundException, ServiceUnavailableException


class ChatService:
    def __init__(self):
        self.session_repo = ChatSessionRepository()
        self.history_repo = ChatHistoryRepository()
        self.rag = get_rag_pipeline()
        self.grok = get_grok_client()

    async def chat(self, request: ChatRequest, user_id: str) -> LegalChatResponse:
        session_id = request.session_id or generate_session_id()

        # ── Ensure session exists ────────────────────────────────────────────
        session = await self.session_repo.find_user_session(session_id, user_id)
        if not session:
            title = await self._generate_title_from_query(request.message)
            await self.session_repo.insert_one({
                "session_id": session_id,
                "user_id": user_id,
                "title": title,
                "language": request.language,
                "message_count": 0,
                "is_active": True,
                "last_message": request.message,
            })
        else:
            # If session exists but has a placeholder title, update it
            if session.get("title") == "New Investigation":
                new_title = await self._generate_title_from_query(request.message)
                await self.session_repo.collection.update_one(
                    {"session_id": session_id},
                    {"$set": {"title": new_title}}
                )

        # ── Persist user message ─────────────────────────────────────────────
        await self.history_repo.insert_one({
            "session_id": session_id,
            "user_id": user_id,
            "role": MessageRole.USER,
            "content": request.message,
            "language": request.language,
            "rag_context_used": False,
            "sources": [],
        })

        # ── Call Grok and build structured response ──────────────────────────
        if request.use_rag:
            # RAG path: returns plain text, wrap it in a minimal structure
            ai_text, context_chunks, sources = await self.rag.query(
                user_message=request.message,
                language=request.language,
            )
            structured = LegalChatResponse(
                session_id=session_id,
                case_summary=ai_text,
                recommended_bns_sections=[],
                investigation_procedure=[],
                required_evidence=[],
                legal_precautions=[],
                sources=sources,
            )
        else:
            structured = await self._call_grok_structured(
                session_id=session_id,
                query=request.message,
                language=request.language,
            )

        # ── Persist AI response as JSON string ───────────────────────────────
        await self.history_repo.insert_one({
            "session_id": session_id,
            "user_id": user_id,
            "role": MessageRole.ASSISTANT,
            "content": structured.model_dump_json(),
            "language": request.language,
            "rag_context_used": request.use_rag,
            "sources": structured.sources,
        })

        await self.session_repo.update_session_activity(session_id, request.message)
        logger.info(
            f"[CHAT] Response sent | session={session_id} | user={user_id} "
            f"| sections={len(structured.recommended_bns_sections)}"
        )
        return structured

    # ── Private: call Grok and parse structured JSON ─────────────────────────

    async def _call_grok_structured(
        self, session_id: str, query: str, language: str
    ) -> LegalChatResponse:
        """
        Call GrokClient.analyze_legal_query(), parse the JSON response,
        and return a validated LegalChatResponse.

        Falls back gracefully if Grok returns malformed JSON or is unavailable.
        """
        try:
            raw = await self.grok.analyze_legal_query(query, language)
        except Exception as exc:
            logger.error(f"[CHAT] Grok API call failed: {exc}")
            raise ServiceUnavailableException(
                "The AI service is temporarily unavailable. Please try again shortly."
            )

        # Strip markdown code fences if Grok wraps the JSON despite instructions
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            # drop first line (```json or ```) and last line (```)
            cleaned = "\n".join(lines[1:-1]).strip()

        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError as exc:
            logger.error(
                f"[CHAT] Grok returned non-JSON response: {exc}\n"
                f"Raw (first 500 chars): {raw[:500]}"
            )
            # Return the raw text as the case_summary so the caller still gets
            # a valid LegalChatResponse rather than a 500 error
            return LegalChatResponse(
                session_id=session_id,
                case_summary=raw,
                recommended_bns_sections=[],
                investigation_procedure=[],
                required_evidence=[],
                legal_precautions=[],
                sources=[],
            )

        # ── Parse sub-objects defensively ────────────────────────────────────
        bns_sections = [
            BNSSection(
                section=s.get("section", ""),
                title=s.get("title", ""),
                description=s.get("description", ""),
                punishment=s.get("punishment", ""),
                relevance=s.get("relevance", ""),
            )
            for s in data.get("recommended_bns_sections", [])
            if isinstance(s, dict)
        ]

        inv_steps = [
            InvestigationStep(
                step=s.get("step", i + 1),
                action=s.get("action", ""),
                responsible=s.get("responsible", ""),
                time_frame=s.get("time_frame", ""),
            )
            for i, s in enumerate(data.get("investigation_procedure", []))
            if isinstance(s, dict)
        ]

        return LegalChatResponse(
            session_id=session_id,
            case_summary=data.get("case_summary", ""),
            recommended_bns_sections=bns_sections,
            investigation_procedure=inv_steps,
            required_evidence=[
                str(e) for e in data.get("required_evidence", []) if e
            ],
            legal_precautions=[
                str(p) for p in data.get("legal_precautions", []) if p
            ],
            sources=[],
        )

    async def get_session_history(self, session_id: str, user_id: str) -> ChatHistoryResponse:
        session = await self.session_repo.find_user_session(session_id, user_id)
        if not session:
            raise NotFoundException("Chat session")

        messages = await self.history_repo.find_session_messages(session_id, user_id)

        return ChatHistoryResponse(
            session=ChatSessionResponse(
                id=session["session_id"],
                title=session["title"],
                language=session["language"],
                message_count=session["message_count"],
                is_active=session["is_active"],
                created_at=session["created_at"],
                updated_at=session.get("updated_at"),
                last_message=session.get("last_message", "No messages yet"),
            ),
            messages=[
                ChatMessageResponse(
                    id=str(m["_id"]),
                    session_id=m["session_id"],
                    role=m["role"],
                    content=m["content"],
                    language=m["language"],
                    rag_context_used=m.get("rag_context_used", False),
                    sources=m.get("sources", []),
                    created_at=m["created_at"],
                )
                for m in messages
            ],
        )

    async def get_user_sessions(self, user_id: str, page: int = 1, page_size: int = 20) -> dict:
        sessions, total = await self.session_repo.list_user_sessions(user_id, page, page_size)
        return {
            "sessions": [
                ChatSessionResponse(
                    id=s["session_id"],
                    title=s["title"],
                    language=s["language"],
                    message_count=s["message_count"],
                    is_active=s["is_active"],
                    created_at=s["created_at"],
                    updated_at=s.get("updated_at"),
                    last_message=s.get("last_message", "No messages yet"),
                )
                for s in sessions
            ],
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    async def delete_session(self, session_id: str, user_id: str):
        if await self.session_repo.delete_user_session(session_id, user_id) == 0:
            raise NotFoundException("Chat session")
        await self.history_repo.delete_session_messages(session_id, user_id)

    async def create_session(self, user_id: str) -> ChatSessionResponse:
        session_id = generate_session_id()
        session_doc = {
            "session_id": session_id,
            "user_id": user_id,
            "title": "New Investigation",
            "language": "en",
            "message_count": 0,
            "is_active": True,
            "last_message": "No messages yet",
        }
        await self.session_repo.insert_one(session_doc)
        return ChatSessionResponse(
            id=session_id,
            title=session_doc["title"],
            language=session_doc["language"],
            message_count=session_doc["message_count"],
            is_active=session_doc["is_active"],
            created_at=session_doc["created_at"],
            updated_at=session_doc.get("updated_at"),
            last_message=session_doc.get("last_message"),
        )

    async def _generate_title_from_query(self, query: str) -> str:
        try:
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are a legal assistant. Generate a very short, concise, professional "
                        "investigation title (maximum 3-4 words) from the user's first query. "
                        "Do not include quotes, markdown formatting, or any extra text. "
                        "Examples: 'Mobile Phone Theft', 'Cyber Fraud', 'Domestic Violence', "
                        "'Cheque Bounce', 'Murder Investigation'."
                    )
                },
                {
                    "role": "user",
                    "content": f"Query: {query}"
                }
            ]
            title = await self.grok.chat(messages, temperature=0.3, max_tokens=15)
            cleaned_title = title.strip().replace('"', '').replace("'", "")
            if len(cleaned_title) > 40:
                cleaned_title = cleaned_title[:37] + "..."
            return cleaned_title or "New Investigation"
        except Exception as exc:
            logger.warning(f"Failed to generate title using AI: {exc}")
            # Fallback to simple truncation of the user's message
            return query[:30] + ("..." if len(query) > 30 else "")
