"""Tests for SecurityHeadersMiddleware and RateLimitMiddleware in app/core/security_middleware.py"""

import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI
from app.core.security_middleware import SecurityHeadersMiddleware, RateLimitMiddleware


@pytest.fixture
def test_app_security_headers():
    """Create a test FastAPI app with SecurityHeadersMiddleware"""
    app = FastAPI()

    @app.get("/")
    async def root():
        return {"message": "Hello World"}

    @app.get("/auth/test")
    async def auth_test():
        return {"message": "Auth Test"}

    app.add_middleware(SecurityHeadersMiddleware)
    return app


@pytest.fixture
def client_security_headers(test_app_security_headers):
    """Create a TestClient for the security headers test app"""
    return TestClient(test_app_security_headers)


@pytest.fixture
def test_app_rate_limit():
    """Create a test FastAPI app with RateLimitMiddleware"""
    app = FastAPI()

    @app.get("/")
    async def root():
        return {"message": "Hello World"}

    @app.get("/auth/login")
    async def login():
        return {"message": "Login"}

    @app.get("/api/v1/ai/generate")
    async def ai_generate():
        return {"message": "AI Generate"}

    @app.get("/ingestion/upload")
    async def ingestion_upload():
        return {"message": "Ingestion Upload"}

    app.add_middleware(RateLimitMiddleware)
    return app


@pytest.fixture
def client_rate_limit(test_app_rate_limit):
    """Create a TestClient for the rate limit test app"""
    return TestClient(test_app_rate_limit)


class TestSecurityHeadersMiddleware:
    """Tests for SecurityHeadersMiddleware"""

    def test_security_headers_are_applied_to_all_responses(self, client_security_headers):
        """Test that all security headers are applied to every response"""
        response = client_security_headers.get("/")

        assert response.status_code == 200

        # Check all security headers
        assert "Content-Security-Policy" in response.headers
        assert "X-Frame-Options" in response.headers
        assert "X-Content-Type-Options" in response.headers
        assert "X-XSS-Protection" in response.headers
        assert "Referrer-Policy" in response.headers
        assert "Permissions-Policy" in response.headers
        assert "Cross-Origin-Embedder-Policy" in response.headers
        assert "Cross-Origin-Resource-Policy" in response.headers
        assert "Cross-Origin-Opener-Policy" in response.headers
        assert "Server" in response.headers

    def test_csp_header_has_expected_default_value(self, client_security_headers):
        """Test that Content-Security-Policy has default values"""
        response = client_security_headers.get("/")
        csp = response.headers.get("Content-Security-Policy")

        assert csp is not None
        assert "default-src 'self'" in csp
        assert "script-src 'self' 'unsafe-inline'" in csp
        assert "style-src 'self' 'unsafe-inline'" in csp
        assert "font-src 'self'" in csp
        assert "img-src 'self' data: https: blob:" in csp
        assert "connect-src 'self' ws: wss:" in csp

    def test_x_frame_options_is_deny(self, client_security_headers):
        """Test that X-Frame-Options is set to DENY"""
        response = client_security_headers.get("/")
        assert response.headers.get("X-Frame-Options") == "DENY"

    def test_x_content_type_options_is_nosniff(self, client_security_headers):
        """Test that X-Content-Type-Options is set to nosniff"""
        response = client_security_headers.get("/")
        assert response.headers.get("X-Content-Type-Options") == "nosniff"

    def test_x_xss_protection_is_enabled(self, client_security_headers):
        """Test that X-XSS-Protection is enabled with mode=block"""
        response = client_security_headers.get("/")
        assert response.headers.get("X-XSS-Protection") == "1; mode=block"

    def test_referrer_policy_is_strict_origin_when_cross_origin(self, client_security_headers):
        """Test that Referrer-Policy is set to strict-origin-when-cross-origin"""
        response = client_security_headers.get("/")
        assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"

    def test_permissions_policy_disables_unnecessary_features(self, client_security_headers):
        """Test that Permissions-Policy disables unnecessary browser features"""
        response = client_security_headers.get("/")
        permissions_policy = response.headers.get("Permissions-Policy")

        assert permissions_policy is not None
        assert "geolocation=()" in permissions_policy
        assert "microphone=()" in permissions_policy
        assert "camera=()" in permissions_policy
        assert "payment=()" in permissions_policy

    def test_cross_origin_headers_are_correct(self, client_security_headers):
        """Test that all cross-origin headers are correctly set"""
        response = client_security_headers.get("/")
        assert response.headers.get("Cross-Origin-Embedder-Policy") == "require-corp"
        assert response.headers.get("Cross-Origin-Resource-Policy") == "same-origin"
        assert response.headers.get("Cross-Origin-Opener-Policy") == "same-origin"

    def test_server_header_is_custom(self, client_security_headers):
        """Test that Server header is set to custom value"""
        response = client_security_headers.get("/")
        assert response.headers.get("Server") == "Zenith-Forensic"

    def test_hsts_header_is_added_over_https(self, client_security_headers):
        """Test that Strict-Transport-Security header is added only over HTTPS"""
        # Test over HTTP (default for TestClient)
        http_response = client_security_headers.get("/")
        assert "Strict-Transport-Security" not in http_response.headers

    def test_cache_control_for_auth_endpoints(self, client_security_headers):
        """Test that auth endpoints get cache control headers"""
        response = client_security_headers.get("/auth/test")
        assert response.headers.get("Cache-Control") == "no-store, no-cache, must-revalidate"
        assert response.headers.get("Pragma") == "no-cache"
        assert response.headers.get("Expires") == "0"

    def test_custom_csp_config_is_applied(self):
        """Test that custom CSP configuration is correctly applied"""
        custom_csp = {
            "default-src": ["'self'", "https://example.com"],
            "script-src": ["'self'", "https://cdn.example.com"],
            "style-src": ["'self'", "https://cdn.example.com"],
        }

        app = FastAPI()

        @app.get("/")
        async def root():
            return {"message": "Hello World"}

        app.add_middleware(SecurityHeadersMiddleware, csp_config=custom_csp)
        client = TestClient(app)
        response = client.get("/")
        csp = response.headers.get("Content-Security-Policy")

        assert csp is not None
        assert "default-src 'self' https://example.com" in csp
        assert "script-src 'self' https://cdn.example.com" in csp
        assert "style-src 'self' https://cdn.example.com" in csp


class TestRateLimitMiddleware:
    """Tests for RateLimitMiddleware"""

    def test_rate_limit_headers_are_added(self, client_rate_limit):
        """Test that rate limit headers are added to all responses"""
        response = client_rate_limit.get("/")

        assert response.status_code == 200
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert "X-RateLimit-Window" in response.headers

    def test_default_rate_limit_is_applied(self, client_rate_limit):
        """Test that default rate limit (100 requests per minute) is applied to general endpoints"""
        response = client_rate_limit.get("/")

        assert response.headers.get("X-RateLimit-Limit") == "100"
        assert response.headers.get("X-RateLimit-Window") == "60"

    def test_auth_rate_limit_is_applied(self, client_rate_limit):
        """Test that stricter rate limit is applied to auth endpoints"""
        response = client_rate_limit.get("/auth/login")

        assert response.headers.get("X-RateLimit-Limit") == "5"
        assert response.headers.get("X-RateLimit-Window") == "60"

    def test_ai_rate_limit_is_applied(self, client_rate_limit):
        """Test that specific rate limit is applied to AI endpoints"""
        response = client_rate_limit.get("/api/v1/ai/generate")

        assert response.headers.get("X-RateLimit-Limit") == "20"
        assert response.headers.get("X-RateLimit-Window") == "60"

    def test_ingestion_rate_limit_is_applied(self, client_rate_limit):
        """Test that specific rate limit is applied to ingestion endpoints"""
        response = client_rate_limit.get("/ingestion/upload")

        assert response.headers.get("X-RateLimit-Limit") == "10"
        assert response.headers.get("X-RateLimit-Window") == "60"


def test_add_security_middleware():
    """Test that add_security_middleware correctly adds all middleware"""
    from app.core.security_middleware import add_security_middleware

    app = FastAPI()
    original_middleware_count = len(app.user_middleware)

    add_security_middleware(app)
    assert len(app.user_middleware) > original_middleware_count


class TestRateLimitExceeded:
    """Test that RateLimitMiddleware raises 429 when rate limit is exceeded"""

    def test_rate_limit_exceeded_raises_429(self):
        """Test that exceeding rate limit raises HTTP 429"""
        app = FastAPI()

        @app.get("/auth/login")
        async def login():
            return {"message": "Login"}

        app.add_middleware(RateLimitMiddleware)
        client = TestClient(app)

        # Auth endpoint has limit of 5 requests per minute
        for i in range(5):
            response = client.get("/auth/login")
            assert response.status_code == 200

        # 6th request should be rate limited
        with pytest.raises(Exception):
            response = client.get("/auth/login")