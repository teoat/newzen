import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.core.db import init_db
from app.core.rate_limit import RateLimitMiddleware
from app.core.csrf_protection import CSRFProtectionMiddleware
from app.core.config import settings
from app.modules.cases.router import router as cases_router
from app.modules.fraud.reconciliation_router import (
    router as reconciliation_router,
)
from app.modules.fraud.geo_link_router import router as geo_link_router
from app.modules.fraud.fraud_router import router as fraud_router
from app.modules.fraud.forensic_router import router as forensic_router
from app.modules.fraud.sankey_router import router as sankey_router
from app.modules.fraud.asset_router import router as asset_router
from app.modules.fraud.nexus_router import router as nexus_router
from app.modules.fraud.analyst_comparison_router import (
    router as analyst_comparison_router,
)
from app.modules.evidence.router import router as evidence_router
from app.modules.ai.router import router as ai_router
from app.modules.forensic.router import router as forensic_tools_router
from app.modules.legal.router import router as legal_router
from app.core.sync import router as sync_router
from app.modules.project.router import router as project_router
from app.api.v1.endpoints.batch_jobs import router as batch_jobs_router
from app.modules.auth.router import router as auth_router
from app.modules.ingestion.router import router as ingestion_router
from app.modules.admin.user_management_router import router as user_mgmt_router
from app.modules.admin.feedback_router import router as feedback_router
from app.modules.notifications.router import router as notifications_router
from app.modules.forensic.mcp_router import router as forensic_mcp_router
from app.modules.ai.frenly_router import router as frenly_ai_router
from app.modules.forensic.compliance_router import router as compliance_router
from app.api.v2.endpoints.reasoning import router as reasoning_v2
from app.api.v2.endpoints.graph import router as graph_v2
from app.modules.currency.router import router as currency_router
from app.core.health import router as health_router

load_dotenv()  # Load env vars before importing other modules

app = FastAPI(title="Zenith Lite", version="1.0.0")


@app.on_event("startup")
def on_startup():
    init_db()


# CORS Middleware - Improving developer experience by allowing frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:2000",
        "http://localhost:3000",
        "http://localhost:3200",
        "http://127.0.0.1:2000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3200",
    ],  # Restricted to local dev ports. In prod, list specific domains.
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Advanced Per-User Rate Limiting Middleware (Redis-based)
app.add_middleware(RateLimitMiddleware, requests_per_minute=60)

# CSRF Protection Middleware (Double Submit Cookie)
app.add_middleware(CSRFProtectionMiddleware, secret_key=settings.SECRET_KEY)


@app.get("/")
async def root():
    """Root info endpoint."""
    return {
        "status": "active",
        "service": "Zenith Lite API",
        "version": "1.0.0",
    }


@app.get("/api/v1/health")
async def health_check():
    """Dedicated health check endpoint for Kubernetes."""
    return {"status": "healthy", "timestamp": time.time()}


# V1 Legacy Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(ingestion_router, prefix="/api/v1")
app.include_router(cases_router, prefix="/api/v1")
app.include_router(user_mgmt_router, prefix="/api/v1")
app.include_router(feedback_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(reconciliation_router, prefix="/api/v1")
app.include_router(geo_link_router, prefix="/api/v1")
app.include_router(sankey_router, prefix="/api/v1")
app.include_router(fraud_router, prefix="/api/v1")
app.include_router(forensic_router, prefix="/api/v1")
app.include_router(nexus_router, prefix="/api/v1")
app.include_router(project_router, prefix="/api/v1")
app.include_router(evidence_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")
app.include_router(frenly_ai_router, prefix="/api/v1")  # Enhanced Frenly AI
app.include_router(analyst_comparison_router, prefix="/api/v1")
app.include_router(forensic_tools_router, prefix="/api/v1")
app.include_router(legal_router, prefix="/api/v1")
app.include_router(asset_router, prefix="/api/v1")
app.include_router(forensic_mcp_router, prefix="/api/v1")
app.include_router(compliance_router, prefix="/api/v1")
app.include_router(batch_jobs_router, prefix="/api/v1")
app.include_router(currency_router, prefix="/api/v1")  # Multi-currency support
# V2 Next-Gen Routers (Active Advancement)
app.include_router(reasoning_v2, prefix="/api/v2/reasoning")
app.include_router(graph_v2, prefix="/api/v2/graph")
app.include_router(sync_router)
# Health & Metrics
app.include_router(health_router)  # Enhanced health endpoints
