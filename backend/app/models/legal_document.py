from typing import Optional, List
from pydantic import Field
from .base import BaseDocument
from .enums import DocumentType


class LegalDocument(BaseDocument):
    title: str
    description: Optional[str] = None
    document_type: DocumentType = DocumentType.OTHER
    file_path: str
    file_name: str
    file_size: int
    content_preview: Optional[str] = None
    chunk_count: int = 0
    is_indexed: bool = False
    uploaded_by: str
    tags: List[str] = Field(default_factory=list)
    language: str = "en"

    class Settings:
        collection = "legal_documents"
