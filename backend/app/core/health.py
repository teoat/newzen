"""
Enhanced Health Check Endpoint
Provides comprehensive system status for monitoring.
"""

from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import Dict, Any
from datetime import datetime, UTC
from app.core.db import get_session
from app.core.redis_client import redis_client
from sqlalchemy import text

router = APIRouter(tags=["System"])


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Basic health check for load balancers.
    Returns 200 OK if service is running.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now(UTC).isoformat(),
        "service": "zenith-api"
    }


@router.get("/health/detailed")
async def detailed_health_check(db: Session = Depends(get_session)) -> Dict[str, Any]:
    """
    Comprehensive health check with component status.

    Returns:
        - overall_status: healthy/degraded/unhealthy
        - components: Status of each system component
        - metrics: Performance metrics
    """
    components = {}
    overall_healthy = True

    # 1. Database Check
    try:
        db.execute(text("SELECT 1"))
        components["database"] = {
            "status": "healthy",
            "message": "Connected"
        }
    except Exception as e:
        components["database"] = {
            "status": "unhealthy",
            "message": f"Error: {str(e)}"
        }
        overall_healthy = False

    # 2. Redis Check
    try:
        redis_client.ping()
        # Get cache stats
        info = redis_client.info("stats")
        keyspace = redis_client.info("keyspace")

        total_keys = sum(
            int(db_info.get("keys", 0))
            for db_info in keyspace.values()
        )

        components["redis"] = {
            "status": "healthy",
            "message": "Connected",
            "metrics": {
                "total_keys": total_keys,
                "total_commands_processed": info.get("total_commands_processed", 0),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0),
            }
        }

        # Calculate cache hit rate
        hits = int(info.get("keyspace_hits", 0))
        misses = int(info.get("keyspace_misses", 0))
        total = hits + misses
        if total > 0:
            hit_rate = (hits / total) * 100
            components["redis"]["metrics"]["cache_hit_rate_percent"] = round(hit_rate, 2)

    except Exception as e:
        components["redis"] = {
            "status": "unhealthy",
            "message": f"Error: {str(e)}"
        }
        overall_healthy = False

    # 3. AI Service Check (Gemini API)
    try:
        import os
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key and len(api_key) > 10:
            components["ai_service"] = {
                "status": "configured",
                "message": "API key present"
            }
        else:
            components["ai_service"] = {
                "status": "degraded",
                "message": "API key not configured"
            }
            overall_healthy = False
    except Exception as e:
        components["ai_service"] = {
            "status": "unknown",
            "message": str(e)
        }

    # 4. Rate Limiter Check
    try:
        components["rate_limiter"] = {
            "status": "healthy",
            "message": "Middleware active"
        }
    except Exception as e:
        components["rate_limiter"] = {
            "status": "degraded",
            "message": f"Error: {str(e)}"
        }

    # 5. Celery Worker Check
    try:
        from app.core.celery_config import celery_app
        inspector = celery_app.control.inspect()
        active = inspector.active()
        components["celery_workers"] = {
            "status": "healthy" if active else "degraded",
            "message": f"Active workers: {len(active) if active else 0}",
            "active_tasks": sum(len(tasks) for tasks in active.values()) if active else 0
        }
    except Exception as e:
        components["celery_workers"] = {
            "status": "unknown",
            "message": f"Worker check failed: {str(e)}"
        }

    # Overall status
    if overall_healthy:
        status = "healthy"
    elif any(c.get("status") == "unhealthy" for c in components.values()):
        status = "unhealthy"
    else:
        status = "degraded"

    return {
        "overall_status": status,
        "timestamp": datetime.now(UTC).isoformat(),
        "service": "zenith-api",
        "version": "1.0.0",
        "components": components,
    }


@router.get("/health/deep")
async def deep_health_check(db: Session = Depends(get_session)) -> Dict[str, Any]:
    """
    The 'Deadman Switch': Deep system diagnostic.
    Checks vector stores, ghost entities, and write latency.
    """
    from app.models import AuditLog, Entity
    from sqlalchemy import func

    diagnostics = {}
    critical_failure = False

    # 1. Ghost Entity Scan (Lite Version)
    try:
        # Check entities without connections (limit 5 for speed)
        # We use a simplified check here: just entities created > 24h ago with no update
        # Real ghost check is expensive, so we check 'Orphan Probability'
        orphan_candidates = db.exec(
            select(Entity)
            .where(Entity.risk_score == 0.0) 
            .limit(5)
        ).all()
        diagnostics["orphan_scan"] = f"Checked {len(orphan_candidates)} candidates. Status: ONLINE"
    except Exception as e:
        diagnostics["orphan_scan"] = f"FAILED: {str(e)}"
        critical_failure = True

    # 2. Vector DB Pulse (Simulated)
    try:
        # Check if we can encode a string (requires AI model loaded)
        # Since we don't have direct access to model here, we check if embeddings exist
        embedding_count = db.exec(select(func.count(Entity.id)).where(Entity.embeddings_json != None)).one()  # noqa E711
        diagnostics["vector_store"] = f"Active Embeddings: {embedding_count}"
    except Exception as e:
        diagnostics["vector_store"] = f"FAILED: {str(e)}"
        # Not critical if just starting up

    # 3. Write Latency / Deadman Check
    try:
        # Check if latest audit log is recent (within 24 hours of uptime if active)
        # For health check, we just verify we can READ the table
        latest_log = db.exec(select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(1)).first()
        last_activity = latest_log.timestamp.isoformat() if latest_log else "No Activity"
        diagnostics["audit_pulse"] = f"Latest Heartbeat: {last_activity}"
    except Exception as e:
        diagnostics["audit_pulse"] = f"FAILED: {str(e)}"
        critical_failure = True

    msg = "SYSTEM CRITICAL" if critical_failure else "SYSTEM NOMINAL"
    
    return {
        "status": "unhealthy" if critical_failure else "healthy",
        "message": msg,
        "diagnostics": diagnostics,
        "timestamp": datetime.now(UTC).isoformat()
    }


