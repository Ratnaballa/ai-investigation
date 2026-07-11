from fastapi import APIRouter, Depends
from app.api.auth.dependencies import require_admin
from app.dependencies import get_user_service, get_case_service, get_document_service
from app.services.user_service import UserService
from app.services.case_service import CaseService
from app.services.document_service import DocumentService

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard", dependencies=[Depends(require_admin)])
async def get_dashboard(
    user_service: UserService = Depends(get_user_service),
    case_service: CaseService = Depends(get_case_service),
    doc_service: DocumentService = Depends(get_document_service),
):
    """Get admin dashboard statistics."""
    return {
        "users": await user_service.get_stats(),
        "cases": await case_service.get_case_stats(),
        "documents": await doc_service.get_index_stats(),
    }


@router.get("/health", dependencies=[Depends(require_admin)])
async def system_health():
    """Check system health status."""
    from app.database.mongodb import get_database
    from app.vector_store.faiss_store import get_vector_store

    db = get_database()
    vector_store = get_vector_store()

    try:
        await db.command("ping")
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {e}"

    return {
        "status": "operational",
        "database": db_status,
        "vector_store": {
            "status": "healthy",
            "total_vectors": vector_store.total_vectors,
        },
    }
