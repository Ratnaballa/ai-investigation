import time
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        start_time = time.time()

        logger.info(f"[{request_id}] {request.method} {request.url.path}")

        try:
            response = await call_next(request)
            duration = (time.time() - start_time) * 1000
            logger.info(
                f"[{request_id}] {request.method} {request.url.path} "
                f"-> {response.status_code} ({duration:.1f}ms)"
            )
            response.headers["X-Request-ID"] = request_id
            return response
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            logger.error(f"[{request_id}] {request.method} {request.url.path} -> ERROR ({duration:.1f}ms): {e}")
            raise
