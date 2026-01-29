"""
CSRF Protection Middleware for Zenith Platform
Implements Double Submit Cookie pattern for CSRF protection.
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import secrets
import hmac
import hashlib
from typing import Optional


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """
    CSRF Protection using Double Submit Cookie pattern.
    Safe methods (GET, HEAD, OPTIONS) are exempted.
    """

    def __init__(
        self,
        app,
        secret_key: str,
        cookie_name: str = "csrf_token",
        header_name: str = "X-CSRF-Token",
        exempt_paths: Optional[list] = None
    ):
        super().__init__(app)
        self.secret_key = secret_key.encode()
        self.cookie_name = cookie_name
        self.header_name = header_name
        self.exempt_paths = exempt_paths or [
            "/health",
            "/api/health",
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/docs",
            "/openapi.json"
        ]
        self.safe_methods = {"GET", "HEAD", "OPTIONS", "TRACE"}

    def _generate_token(self) -> str:
        """Generate a new CSRF token"""
        random_bytes = secrets.token_bytes(32)
        signature = hmac.new(
            self.secret_key,
            random_bytes,
            hashlib.sha256
        ).digest()
        token = (random_bytes + signature).hex()
        return token

    def _verify_token(self, token: str) -> bool:
        """Verify a CSRF token"""
        try:
            token_bytes = bytes.fromhex(token)
            if len(token_bytes) != 64:  # 32 bytes random + 32 bytes signature
                return False

            random_bytes = token_bytes[:32]
            provided_signature = token_bytes[32:]

            expected_signature = hmac.new(
                self.secret_key,
                random_bytes,
                hashlib.sha256
            ).digest()

            return hmac.compare_digest(expected_signature, provided_signature)
        except Exception:
            return False

    async def dispatch(self, request: Request, call_next):
        # Exempt safe methods
        if request.method in self.safe_methods:
            response = await call_next(request)

            # Add CSRF token to response if not present
            if self.cookie_name not in request.cookies:
                token = self._generate_token()
                response.set_cookie(
                    key=self.cookie_name,
                    value=token,
                    httponly=True,
                    samesite="strict",
                    secure=False  # Set to True in production with HTTPS
                )

            return response

        # Exempt specific paths
        if request.url.path in self.exempt_paths:
            return await call_next(request)

        # Check CSRF token for state-changing methods
        cookie_token = request.cookies.get(self.cookie_name)
        header_token = request.headers.get(self.header_name)

        if not cookie_token or not header_token:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "detail": "CSRF token missing",
                    "code": "csrf_token_missing"
                }
            )

        if not self._verify_token(cookie_token):
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "detail": "Invalid CSRF token",
                    "code": "csrf_token_invalid"
                }
            )

        if cookie_token != header_token:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "detail": "CSRF token mismatch",
                    "code": "csrf_token_mismatch"
                }
            )

        # Token is valid
        response = await call_next(request)

        # Rotate token after use (optional, for extra security)
        # new_token = self._generate_token()
        # response.set_cookie(
        #     key=self.cookie_name,
        #     value=new_token,
        #     httponly=True,
        #     samesite="strict",
        #     secure=False
        # )

        return response


def get_csrf_middleware(secret_key: str):
    """Factory function to create CSRF middleware"""
    return lambda app: CSRFProtectionMiddleware(app, secret_key=secret_key)
