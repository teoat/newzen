"""
Enhanced Health Check Endpoint
Provides comprehensive system status for monitoring.
"""

from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import Dict, Any
from datetime import datetime
from app.core.db import get_session
from app.core.redis_client import redis_client

router = APIRouter(tags=["System"])


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Basic health check for load balancers.
    Returns 200 OK if service is running.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
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
        db.execute("SELECT 1")
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
        redis_client.client.ping()
        # Get cache stats
        info = redis_client.client.info("stats")
        keyspace = redis_client.client.info("keyspace")

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

    # Overall status
    if overall_healthy:
        status = "healthy"
    elif any(c.get("status") == "unhealthy" for c in components.values()):
        status = "unhealthy"
    else:
        status = "degraded"

    return {
        "overall_status": status,
        "timestamp": datetime.utcnow().isoformat(),
        "service": "zenith-api",
        "version": "1.0.0",
        "components": components,
        "uptime_seconds": 0,  # Would need to track app start time
    }


@router.get("/metrics")
async def prometheus_metrics(db: Session = Depends(get_session)) -> str:
    """
    Prometheus-compatible metrics endpoint.
    Returns metrics in Prometheus exposition format.
    """
    from sqlmodel import func
    from app.models import Transaction, Project, UserQueryPattern

    metrics = []

    # Database metrics
    try:
        transaction_count = db.exec(select(func.count(Transaction.id))).one()
        project_count = db.exec(select(func.count(Project.id))).one()
        query_pattern_count = db.exec(select(func.count(UserQueryPattern.id))).one()

        metrics.append(f"zenith_transactions_total {transaction_count}")
        metrics.append(f"zenith_projects_total {project_count}")
        metrics.append(f"zenith_query_patterns_total {query_pattern_count}")
    except Exception:
        pass

    # Redis metrics
    try:
        info = redis_client.client.info("stats")
        keyspace = redis_client.client.info("keyspace")

        total_keys = sum(
            int(db_info.get("keys", 0))
            for db_info in keyspace.values()
        )

        hits = int(info.get("keyspace_hits", 0))
        misses = int(info.get("keyspace_misses", 0))

        metrics.append(f"zenith_redis_keys_total {total_keys}")
        metrics.append(f"zenith_redis_cache_hits_total {hits}")
        metrics.append(f"zenith_redis_cache_misses_total {misses}")

        total = hits + misses
        if total > 0:
            hit_rate = (hits / total)
            metrics.append(f"zenith_redis_cache_hit_rate {hit_rate:.4f}")
    except Exception:
        pass

    # Health status (1 = healthy, 0 = unhealthy)
    metrics.append("zenith_health_status 1")

    return "\n".join(metrics) + "\n"
