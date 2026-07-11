from .auth_router import router as auth_router
from .users_router import router as users_router
from .chat_router import router as chat_router
from .legal_router import router as legal_router
from .cases_router import router as cases_router
from .graph_router import router as graph_router
from .documents_router import router as documents_router
from .reports_router import router as reports_router
from .admin_router import router as admin_router

__all__ = [
    "auth_router", "users_router", "chat_router", "legal_router",
    "cases_router", "graph_router", "documents_router", "reports_router", "admin_router",
]
