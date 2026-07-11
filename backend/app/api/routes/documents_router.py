import math
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, status
from app.schemas.document import DocumentResponse, DocumentUploadResponse
from app.schemas.common import SuccessResponse, PaginatedResponse
from app.api.auth.dependencies import get_current_user, require_admin, require_legal_professional
from app.dependencies import get_document_service
from app.models.enums import DocumentType
from app.services.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["Document Upload"])


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_legal_professional)])
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    document_type: DocumentType = Form(DocumentType.OTHER),
    description: Optional[str] = Form(None),
    tags: str = Form(""),
    language: str = Form("en"),
    current_user: dict = Depends(get_current_user),
    service: DocumentService = Depends(get_document_service),
):
    """Upload a legal document (PDF, DOCX, TXT) and index it in FAISS for RAG."""
    file_content = await file.read()
    tags_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
    return await service.upload_and_index(
        file_content=file_content, filename=file.filename, title=title,
        document_type=document_type, description=description,
        tags=tags_list, uploaded_by=current_user["_id"], language=language,
    )


@router.get("", response_model=PaginatedResponse, dependencies=[Depends(require_legal_professional)])
async def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    document_type: Optional[str] = None,
    service: DocumentService = Depends(get_document_service),
):
    """List all uploaded legal documents."""
    docs, total = await service.list_documents(page, page_size, document_type)
    return PaginatedResponse(
        items=[
            DocumentResponse(
                id=str(d.id), title=d.title, description=d.description,
                document_type=d.document_type, file_name=d.file_name,
                file_size=d.file_size, chunk_count=d.chunk_count,
                is_indexed=d.is_indexed, uploaded_by=d.uploaded_by,
                tags=d.tags, language=d.language, created_at=d.created_at,
            )
            for d in docs
        ],
        total=total, page=page, page_size=page_size,
        total_pages=math.ceil(total / page_size) if total else 0,
    )


@router.get("/stats", dependencies=[Depends(require_legal_professional)])
async def get_index_stats(service: DocumentService = Depends(get_document_service)):
    """Get FAISS index statistics."""
    return await service.get_index_stats()


@router.get("/{doc_id}", response_model=DocumentResponse, dependencies=[Depends(require_legal_professional)])
async def get_document(doc_id: str, service: DocumentService = Depends(get_document_service)):
    """Get document details by ID."""
    doc = await service.get_document(doc_id)
    return DocumentResponse(
        id=str(doc.id), title=doc.title, description=doc.description,
        document_type=doc.document_type, file_name=doc.file_name,
        file_size=doc.file_size, chunk_count=doc.chunk_count,
        is_indexed=doc.is_indexed, uploaded_by=doc.uploaded_by,
        tags=doc.tags, language=doc.language, created_at=doc.created_at,
    )


@router.delete("/{doc_id}", response_model=SuccessResponse, dependencies=[Depends(require_admin)])
async def delete_document(doc_id: str, service: DocumentService = Depends(get_document_service)):
    """Delete a document and remove it from FAISS index (Admin only)."""
    await service.delete_document(doc_id)
    return SuccessResponse(message="Document deleted and removed from index")
