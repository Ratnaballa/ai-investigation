from typing import List, Optional
from loguru import logger
from app.repositories.document_repository import DocumentRepository
from app.vector_store.faiss_store import get_vector_store
from app.utils.file_handler import save_upload_file, validate_file, extract_text_from_file
from app.utils.text_chunker import chunk_text_with_metadata
from app.models.legal_document import LegalDocument
from app.models.enums import DocumentType
from app.schemas.document import DocumentResponse, DocumentUploadResponse
from app.core.exceptions import NotFoundException


class DocumentService:
    def __init__(self):
        self.repo = DocumentRepository()
        self.vector_store = get_vector_store()

    async def upload_and_index(
        self,
        file_content: bytes,
        filename: str,
        title: str,
        document_type: DocumentType,
        description: Optional[str],
        tags: List[str],
        uploaded_by: str,
        language: str = "en",
    ) -> DocumentUploadResponse:
        validate_file(filename, len(file_content))
        file_path, saved_name = await save_upload_file(file_content, filename, subfolder="legal_docs")

        text = extract_text_from_file(file_path)
        chunks = chunk_text_with_metadata(text, source=saved_name)
        chunks_added = self.vector_store.add_documents(chunks)

        doc = await self.repo.insert_one({
            "title": title,
            "description": description,
            "document_type": document_type,
            "file_path": file_path,
            "file_name": saved_name,
            "file_size": len(file_content),
            "content_preview": text[:500] if text else None,
            "chunk_count": chunks_added,
            "is_indexed": chunks_added > 0,
            "uploaded_by": uploaded_by,
            "tags": tags,
            "language": language,
        })

        logger.info(f"Document uploaded and indexed: {saved_name}, {chunks_added} chunks")

        doc_response = DocumentResponse(
            id=str(doc["_id"]),
            title=doc["title"],
            description=doc["description"],
            document_type=doc["document_type"],
            file_name=doc["file_name"],
            file_size=doc["file_size"],
            chunk_count=doc["chunk_count"],
            is_indexed=doc["is_indexed"],
            uploaded_by=doc["uploaded_by"],
            tags=doc["tags"],
            language=doc["language"],
            created_at=doc["created_at"],
        )
        return DocumentUploadResponse(
            document=doc_response,
            message=f"Document uploaded and indexed successfully with {chunks_added} chunks",
            chunks_created=chunks_added,
        )

    async def list_documents(
        self, page: int = 1, page_size: int = 20, document_type: Optional[str] = None
    ) -> tuple[List[LegalDocument], int]:
        docs, total = await self.repo.list_with_filters(page, page_size, document_type)
        return [LegalDocument(**d) for d in docs], total

    async def get_document(self, doc_id: str) -> LegalDocument:
        doc = await self.repo.find_by_id(doc_id)
        if not doc:
            raise NotFoundException("Document")
        return LegalDocument(**doc)

    async def delete_document(self, doc_id: str):
        doc = await self.get_document(doc_id)
        self.vector_store.delete_by_source(doc.file_name)
        await self.repo.delete_by_id(doc_id)
        logger.info(f"Document deleted: {doc_id}")

    async def get_index_stats(self) -> dict:
        return await self.repo.get_index_stats(self.vector_store.total_vectors)
