import time
from collections import defaultdict, deque
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Sliding-window rate limiter per client IP.
    Default: 100 requests per 60 seconds.
    Auth endpoints get a stricter limit: 10 requests per 60 seconds.
    """

    def __init__(self, app, requests_per_minute: int = 100, auth_requests_per_minute: int = 10):
        super().__init__(app)
        self._window = 60
        self._limit = requests_per_minute
        self._auth_limit = auth_requests_per_minute
        self._buckets: dict[str, deque] = defaultdict(deque)

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _is_allowed(self, key: str, limit: int) -> bool:
        now = time.time()
        bucket = self._buckets[key]
        while bucket and bucket[0] < now - self._window:
            bucket.popleft()
        if len(bucket) >= limit:
            return False
        bucket.append(now)
        return True

    async def dispatch(self, request: Request, call_next):
        ip = self._get_client_ip(request)
        is_auth = request.url.path.startswith("/api/v1/auth/login") or \
                  request.url.path.startswith("/api/v1/auth/register")

        limit = self._auth_limit if is_auth else self._limit
        key = f"{ip}:{'auth' if is_auth else 'general'}"

        if not self._is_allowed(key, limit):
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"success": False, "message": "Too many requests. Please slow down."},
                headers={"Retry-After": str(self._window)},
            )

        return await call_next(request)
