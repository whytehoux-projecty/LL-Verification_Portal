"""
Rate limiting middleware using SlowAPI and Redis
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from starlette.status import HTTP_429_TOO_MANY_REQUESTS
import os
from ..config import settings

# Initialize rate limiter with Redis backend
_storage_uri = os.getenv("REDIS_URL") or "memory://"
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=_storage_uri,
    default_limits=["100/minute"],
    headers_enabled=False
)

async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> Response:
    """Custom handler for rate limit exceeded errors"""
    return Response(
        content=f"Rate limit exceeded: {exc.detail}. Please try again later.",
        status_code=HTTP_429_TOO_MANY_REQUESTS,
        headers={
            "Retry-After": str(exc.detail),
            "X-RateLimit-Limit": str(exc.detail),
        }
    )
