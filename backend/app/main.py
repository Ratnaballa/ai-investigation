"""
Application Entry Point
=======================
Wires together all middleware, exception handlers, and routers.

Startup sequence
----------------
1. Logging is configured.
2. MongoDB connection is established (3 retries, 2 s apart).
3. Database indexes are created.
4. Default admin account is seeded if it doesn't exist.

Middleware stack (outermost → innermost)
-----------------------------------------
CORSMiddleware → GZipMiddleware → RateLimitMiddleware → RequestLoggingMiddleware

Exception handlers
------------------
AppException          → structured JSON with the correct HTTP status code
RequestValidationError → 422 with per-field error list
Exception             → 500 with a generic message (details logged server-side)
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
from loguru import logger

from app.config.settings import settings
from app.core.logging import setup_logging
from app.core.exceptions import AppException
from app.database.mongodb import connect_db, disconnect_db
from app.middleware.logging_middleware import RequestLoggingMiddleware
from app.middleware.rate_limit_middleware import RateLimitMiddleware
from app.api.routes import (
    auth_router,
    users_router,
    chat_router,
    legal_router,
    cases_router,
    graph_router,
    documents_router,
    reports_router,
    admin_router,
)


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    try:
        await connect_db()
        await _seed_default_admin()
    except Exception as e:
        logger.error(f"Startup DB error (server will still run): {e}")
        logger.warning("API endpoints requiring DB will fail until MongoDB is available")

    logger.info("Application startup complete")
    yield

    await disconnect_db()
    logger.info("Application shutdown complete")


async def _seed_default_admin() -> None:
    """Create the default admin account on first run (idempotent)."""
    from app.repositories.user_repository import UserRepository
    from app.core.security import hash_password
    from app.models.enums import UserRole

    repo = UserRepository()
    if not await repo.find_by_email(settings.ADMIN_EMAIL):
        await repo.insert_one({
            "full_name": settings.ADMIN_FULL_NAME,
            "email": settings.ADMIN_EMAIL.lower().strip(),
            "hashed_password": hash_password(settings.ADMIN_PASSWORD),
            "role": UserRole.ADMIN,
            "is_active": True,
            "is_verified": True,
            "preferred_language": "en",
            "refresh_token": None,
        })
        logger.info(f"Default admin seeded: {settings.ADMIN_EMAIL}")


# ── App factory ───────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "AI-powered legal support and investigation platform.\n\n"
        "## Authentication\n"
        "1. Call `POST /api/v1/auth/login` with your credentials.\n"
        "2. Copy the `access_token` from the response.\n"
        "3. Click the **Authorize** button (🔒) at the top of this page.\n"
        "4. Paste the token and click **Authorize**.\n\n"
        "## Roles\n"
        "| Role | Description |\n"
        "|------|-------------|\n"
        "| `admin` | Full system access |\n"
        "| `police_officer` | Case & evidence management |\n"
        "| `investigation_officer` | Case & evidence management |\n"
        "| `lawyer` | Read access to cases, documents, reports |\n"
        "| `public` | Chat and legal search only |\n"
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)


# ── OpenAPI security scheme ───────────────────────────────────────────────────

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    # Add BearerAuth security scheme so the Swagger "Authorize" button works
    schema.setdefault("components", {})
    schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Paste your JWT access token (obtained from POST /api/v1/auth/login)",
        }
    }

    # Apply the scheme globally to every operation
    for path_item in schema.get("paths", {}).values():
        for operation in path_item.values():
            if isinstance(operation, dict):
                operation.setdefault("security", [{"BearerAuth": []}])

    app.openapi_schema = schema
    return app.openapi_schema


app.openapi = custom_openapi


# ── Middleware ────────────────────────────────────────────────────────────────
# Starlette applies middleware in reverse registration order.
# The last one added wraps the innermost layer.

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    RateLimitMiddleware,
    requests_per_minute=100,
    auth_requests_per_minute=10,
)
app.add_middleware(RequestLoggingMiddleware)


# ── Exception handlers ────────────────────────────────────────────────────────

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": exc.detail},
        headers=exc.headers or {},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = [
        {"field": " -> ".join(str(loc) for loc in e["loc"]), "message": e["msg"]}
        for e in exc.errors()
    ]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Request validation failed",
            "errors": errors,
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}: {exc}",
        exc_info=True,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "message": "An internal server error occurred"},
    )


# ── Routers ───────────────────────────────────────────────────────────────────

API_PREFIX = "/api/v1"

app.include_router(auth_router,      prefix=API_PREFIX)
app.include_router(users_router,     prefix=API_PREFIX)
app.include_router(chat_router,      prefix=API_PREFIX)
app.include_router(legal_router,     prefix=API_PREFIX)
app.include_router(cases_router,     prefix=API_PREFIX)
app.include_router(graph_router,     prefix=API_PREFIX)
app.include_router(documents_router, prefix=API_PREFIX)
app.include_router(reports_router,   prefix=API_PREFIX)
app.include_router(admin_router,     prefix=API_PREFIX)


# ── Health endpoints ──────────────────────────────────────────────────────────

@app.get("/", tags=["Health"], summary="Root — service info")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"], summary="Health check")
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION}
