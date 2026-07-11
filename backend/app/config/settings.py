from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "AI Investigation Assistant"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "ai_investigation_db"

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Groq API
    GROK_API_KEY: str 
    GROK_API_BASE_URL: str = "https://api.groq.com/openai/v1"
    GROK_MODEL: str = "llama-3.3-70b-versatile"

    # Embedding
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # FAISS
    FAISS_INDEX_PATH: str = "./app/vector_store/faiss_index"
    FAISS_INDEX_NAME: str = "legal_docs_index"

    # File Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: str = "pdf,docx,txt"

    # Reports
    REPORTS_DIR: str = "./reports"

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/app.log"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # Admin
    ADMIN_EMAIL: str = "admin@investigation.gov"
    ADMIN_PASSWORD: str = "Admin@123456"
    ADMIN_FULL_NAME: str = "System Administrator"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    @property
    def allowed_extensions_list(self) -> List[str]:
        return [e.strip().lower() for e in self.ALLOWED_EXTENSIONS.split(",")]

    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
