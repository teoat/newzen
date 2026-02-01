"""
Security middleware for comprehensive security headers and CSP
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import time
from typing import Dict, Any


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds comprehensive security headers to all responses
    """
    
    def __init__(self, app: FastAPI, csp_config: Dict[str, Any] = None):
        super().__init__(app)
        self.csp_config = csp_config or self._get_default_csp()
    
    def _get_default_csp(self) -> Dict[str, Any]:
        """Get default Content Security Policy configuration"""
        return {
            "default-src": ["'self'"],
            "script-src": [
                "'self'",
                "'unsafe-inline'",  # Required for some frontend frameworks
                "https://fonts.googleapis.com",
                "https://apis.google.com"
            ],
            "style-src": [
                "'self'",
                "'unsafe-inline'",  # Required for CSS-in-JS
                "https://fonts.googleapis.com",
                "https://cdnjs.cloudflare.com"
            ],
            "font-src": [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com"
            ],
            "img-src": [
                "'self'",
                "data:",
                "https:",
                "blob:"  # For file uploads and avatars
            ],
            "connect-src": [
                "'self'",
                "ws:",  # WebSockets
                "wss:",
                "https://generativelanguage.googleapis.com",  # Gemini API
                "https://api.github.com"  # If needed
            ],
            "frame-ancestors": ["'none'"],
            "base-uri": ["'self'"],
            "form-action": ["'self'"],
            "manifest-src": ["'self'"],
            "media-src": ["'self'"],
            "object-src": ["'none'"],
            "worker-src": ["'self'", "blob:"]
        }
    
    def _build_csp_header(self) -> str:
        """Build CSP header string from configuration"""
        directives = []
        for directive, sources in self.csp_config.items():
            sources_str = " ".join(sources)
            directives.append(f"{directive} {sources_str}")
        return "; ".join(directives)
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Content Security Policy
        response.headers["Content-Security-Policy"] = self._build_csp_header()
        
        # Other security headers
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=(), "
            "payment=(), usb=(), magnetometer=(), gyroscope=()"
        )
        response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        
        # Strict Transport Security (only in production)
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        
        # Cache control for sensitive endpoints
        if request.url.path.startswith("/auth/"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        
        # Remove server information
        response.headers["Server"] = "Zenith-Forensic"
        
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Enhanced rate limiting with different limits for different endpoint types
    """
    
    def __init__(self, app: FastAPI):
        super().__init__(app)
        # In production, use Redis instead of in-memory
        self.requests: Dict[str, list] = {}
        
    def _get_client_identifier(self, request: Request) -> str:
        """Get client identifier for rate limiting"""
        # Try to get user ID from auth headers first
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            # In production, decode JWT to get user ID
            return "user: jwt_decode_placeholder"
        
        # Fallback to IP
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return f"ip: {forwarded_for.split(',')[0].strip()}"
        return f"ip: {request.client.host}"
    
    def _get_rate_limit(self, request: Request) -> Dict[str, int]:
        """Get rate limit based on endpoint type"""
        path = request.url.path
        
        if path.startswith("/auth/"):
            return {"requests": 5, "window": 60}  # 5 requests per minute
        elif path.startswith("/api/v1/ai/"):
            return {"requests": 20, "window": 60}  # 20 requests per minute
        elif path.startswith("/ingestion/"):
            return {"requests": 10, "window": 60}  # 10 requests per minute
        else:
            return {"requests": 100, "window": 60}  # 100 requests per minute
    
    def _is_rate_limited(self, identifier: str, limit: Dict[str, int]) -> bool:
        """Check if identifier has exceeded rate limit"""
        now = time.time()
        window_start = now - limit["window"]
        
        # Clean old requests
        if identifier in self.requests:
            self.requests[identifier] = [
                req_time for req_time in self.requests[identifier] 
                if req_time > window_start
            ]
        else:
            self.requests[identifier] = []
        
        # Check current count
        current_count = len(self.requests[identifier])
        if current_count >= limit["requests"]:
            return True
        
        # Add this request
        self.requests[identifier].append(now)
        return False
    
    async def dispatch(self, request: Request, call_next):
        identifier = self._get_client_identifier(request)
        rate_limit = self._get_rate_limit(request)
        
        if self._is_rate_limited(identifier, rate_limit):
            from fastapi import HTTPException
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded",
                headers={
                    "Retry-After": str(rate_limit["window"]),
                    "X-RateLimit-Limit": str(rate_limit["requests"]),
                    "X-RateLimit-Window": str(rate_limit["window"]),
                    "X-RateLimit-Remaining": str(max(0, rate_limit["requests"] - len(self.requests.get(identifier, []))))
                }
            )
        
        response = await call_next(request)
        
        # Add rate limit headers
        current_count = len(self.requests.get(identifier, []))
        response.headers["X-RateLimit-Limit"] = str(rate_limit["requests"])
        response.headers["X-RateLimit-Remaining"] = str(max(0, rate_limit["requests"] - current_count))
        response.headers["X-RateLimit-Window"] = str(rate_limit["window"])
        
        return response


def add_security_middleware(app: FastAPI):
    """Add all security middleware to FastAPI app"""
    
    # Add CORS middleware first
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "https://your-production-domain.com"],  # Configure for production
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=["*"],
        expose_headers=["X-RateLimit-*", "X-Content-Type-Options"]
    )
    
    # Add rate limiting
    app.add_middleware(RateLimitMiddleware)
    
    # Add security headers
    csp_config = {
        "default-src": ["'self'"],
        "script-src": [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
            "https://apis.google.com"
        ],
        "style-src": [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com"
        ],
        "font-src": [
            "'self'",
            "https://fonts.gstatic.com"
        ],
        "img-src": [
            "'self'",
            "data:",
            "https:"
        ],
        "connect-src": [
            "'self'",
            "ws:",
            "wss:",
            "https://generativelanguage.googleapis.com"
        ]
    }
    
    app.add_middleware(SecurityHeadersMiddleware, csp_config=csp_config)