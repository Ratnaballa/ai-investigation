import os
from pathlib import Path
from typing import Tuple
import aiofiles
from loguru import logger
from app.config.settings import settings
from app.core.exceptions import UnsupportedFileTypeException, FileTooLargeException


async def save_upload_file(file_content: bytes, filename: str, subfolder: str = "") -> Tuple[str, str]:
    upload_dir = Path(settings.UPLOAD_DIR) / subfolder
    upload_dir.mkdir(parents=True, exist_ok=True)

    safe_name = Path(filename).name
    file_path = upload_dir / safe_name

    counter = 1
    while file_path.exists():
        stem = Path(safe_name).stem
        suffix = Path(safe_name).suffix
        file_path = upload_dir / f"{stem}_{counter}{suffix}"
        counter += 1

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(file_content)

    return str(file_path), file_path.name


def validate_file(filename: str, file_size: int):
    ext = Path(filename).suffix.lower().lstrip(".")
    if ext not in settings.allowed_extensions_list:
        raise UnsupportedFileTypeException(settings.allowed_extensions_list)
    if file_size > settings.max_file_size_bytes:
        raise FileTooLargeException(settings.MAX_FILE_SIZE_MB)


def extract_text_from_file(file_path: str) -> str:
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        return _extract_from_pdf(file_path)
    elif ext == ".docx":
        return _extract_from_docx(file_path)
    elif ext == ".txt":
        return _extract_from_txt(file_path)
    raise UnsupportedFileTypeException(["pdf", "docx", "txt"])


def _extract_from_pdf(file_path: str) -> str:
    try:
        import pdfplumber
        text_parts = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
        return "\n\n".join(text_parts)
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        return "\n\n".join(page.extract_text() or "" for page in reader.pages)


def _extract_from_docx(file_path: str) -> str:
    from docx import Document
    doc = Document(file_path)
    return "\n\n".join(para.text for para in doc.paragraphs if para.text.strip())


def _extract_from_txt(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()
