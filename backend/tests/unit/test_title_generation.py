"""
Unit tests for automatic investigation title generation
======================================================
Tests verify that:
1. Title generation prompt formats properly and cleans title string output.
2. Title is generated only once for new investigations ("New Investigation").
3. Generated title is preserved and returned in LegalChatResponse.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.chat_service import ChatService
from app.schemas.chat import ChatRequest, LegalChatResponse


@pytest.mark.asyncio
class TestTitleGeneration:

    @pytest.fixture
    def mock_chat_service(self):
        with patch("app.services.chat_service.ChatSessionRepository") as mock_session_repo_cls, \
             patch("app.services.chat_service.ChatHistoryRepository") as mock_history_repo_cls, \
             patch("app.services.chat_service.get_rag_pipeline") as mock_rag_fn, \
             patch("app.services.chat_service.get_grok_client") as mock_grok_fn:

            service = ChatService()
            service.session_repo = AsyncMock()
            service.history_repo = AsyncMock()
            service.grok = AsyncMock()
            yield service

    async def test_generate_title_from_query_success(self, mock_chat_service):
        mock_chat_service.grok.chat.return_value = ' "Cybercrime Investigation" '
        title = await mock_chat_service._generate_title_from_query("Someone hacked into my bank account")
        assert title == "Cybercrime Investigation"

    async def test_generate_title_from_query_with_prefix(self, mock_chat_service):
        mock_chat_service.grok.chat.return_value = 'Title: Mobile Theft Case'
        title = await mock_chat_service._generate_title_from_query("A mobile phone was stolen")
        assert title == "Mobile Theft Case"

    async def test_generate_title_fallback_on_error(self, mock_chat_service):
        mock_chat_service.grok.chat.side_effect = Exception("LLM connection error")
        title = await mock_chat_service._generate_title_from_query("Domestic violence complaint filed at station")
        assert title == "Domestic Violence Complaint Filed Case"

    async def test_chat_generates_title_only_once_for_new_investigation(self, mock_chat_service):
        # Setup existing session with title "New Investigation"
        mock_chat_service.session_repo.find_user_session.return_value = {
            "session_id": "sess_123",
            "user_id": "user_456",
            "title": "New Investigation",
            "language": "en",
        }
        mock_chat_service.grok.chat.return_value = "Cybercrime Investigation"
        mock_chat_service._call_grok_structured = AsyncMock(return_value=LegalChatResponse(
            session_id="sess_123",
            case_summary="Bank account hack summary",
        ))

        req = ChatRequest(message="Someone hacked into my bank account", session_id="sess_123")
        res = await mock_chat_service.chat(req, "user_456")

        assert res.title == "Cybercrime Investigation"
        mock_chat_service.session_repo.collection.update_one.assert_called_once_with(
            {"session_id": "sess_123"},
            {"$set": {"title": "Cybercrime Investigation"}}
        )

    async def test_chat_does_not_regenerate_title_if_already_set(self, mock_chat_service):
        # Setup existing session with established title
        mock_chat_service.session_repo.find_user_session.return_value = {
            "session_id": "sess_123",
            "user_id": "user_456",
            "title": "Cybercrime Investigation",
            "language": "en",
        }
        mock_chat_service._call_grok_structured = AsyncMock(return_value=LegalChatResponse(
            session_id="sess_123",
            case_summary="Follow up response",
        ))

        req = ChatRequest(message="What evidence is needed?", session_id="sess_123")
        res = await mock_chat_service.chat(req, "user_456")

        assert res.title == "Cybercrime Investigation"
        mock_chat_service.session_repo.collection.update_one.assert_not_called()

    async def test_call_grok_structured_does_not_raise_name_error(self, mock_chat_service):
        import json
        mock_chat_service.grok.analyze_legal_query.return_value = json.dumps({
            "case_summary": "Test summary",
            "recommended_bns_sections": [],
            "investigation_procedure": [],
            "required_evidence": [],
            "legal_precautions": []
        })
        res = await ChatService._call_grok_structured(mock_chat_service, session_id="sess_123", query="test query", language="en")
        assert res.session_id == "sess_123"
        assert res.case_summary == "Test summary"
        assert res.title is None
