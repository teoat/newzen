"""
Rate Limiting Middleware for Zenith Platform
Implements per-user rate limiting using Redis
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.redis_client import redis_client
import time
from typing import Optional


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Per-user rate limiting middleware using sliding window algorithm.
    Limits requests per user per minute.
    """

    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.window_size = 60  # 1 minute in seconds

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/api/health"]:
            return await call_next(request)

        # Get user identifier (from JWT or IP)
        user_id = await self._get_user_identifier(request)

        if user_id:
            # Check rate limit
            is_allowed, retry_after = self._check_rate_limit(user_id)

            if not is_allowed:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": "Rate limit exceeded",
                        "retry_after": retry_after
                    },
                    headers={"Retry-After": str(retry_after)}
                )

        response = await call_next(request)
        return response

    async def _get_user_identifier(self, request: Request) -> Optional[str]:
        """Extract user ID from JWT token or fall back to IP"""
        # Try to get user from auth header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                from app.core.security import decode_token
                token = auth_header.split(" ")[1]
                payload = decode_token(token)
                return payload.get("sub")  # User ID
            except Exception:
                pass

        # Fallback to IP address
        return request.client.host if request.client else "unknown"

    def _check_rate_limit(self, user_id: str) -> tuple[bool, int]:
        """
        Check if user has exceeded rate limit using sliding window.
        Returns: (is_allowed, retry_after_seconds)
        """
        key = f"rate_limit:{user_id}"
        current_time = int(time.time())
        window_start = current_time - self.window_size

        try:
            # Use Redis sorted set for sliding window
            pipe = redis_client.client.pipeline()

            # Remove old entries outside the window
            pipe.zremrangebyscore(key, 0, window_start)

            # Count requests in current window
            pipe.zcard(key)

            # Add current request
            pipe.zadd(key, {str(current_time): current_time})

            # Set expiry
            pipe.expire(key, self.window_size)

            results = pipe.execute()
            request_count = results[1]

            if request_count >= self.requests_per_minute:
                # Get oldest request timestamp in window
                oldest = redis_client.client.zrange(key, 0, 0, withscores=True)
                if oldest:
                    oldest_time = int(oldest[0][1])
                    retry_after = self.window_size - (current_time - oldest_time)
                    return False, max(1, retry_after)

            return True, 0

        except Exception as e:
            # If Redis fails, allow the request (fail open)
            print(f"Rate limit Redis error: {e}")
            return True, 0


def get_rate_limit_middleware(requests_per_minute: int = 60):
    """Factory function to create rate limit middleware with custom limits"""
    return RateLimitMiddleware
