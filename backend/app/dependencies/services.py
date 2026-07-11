"""
Centralised dependency providers for all services.
Import from here in all routers — never instantiate services directly in routes.
"""
from functools import lru_cache
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.services.case_service import CaseService
from app.services.chat_service import ChatService
from app.services.document_service import DocumentService
from app.services.legal_service import LegalService
from app.services.report_service import ReportService
from app.services.graph_service import GraphService


def get_auth_service() -> AuthService:
    return AuthService()


def get_user_service() -> UserService:
    return UserService()


def get_case_service() -> CaseService:
    return CaseService()


def get_chat_service() -> ChatService:
    return ChatService()


def get_document_service() -> DocumentService:
    return DocumentService()


def get_legal_service() -> LegalService:
    return LegalService()


def get_report_service() -> ReportService:
    return ReportService()


def get_graph_service() -> GraphService:
    return GraphService()
