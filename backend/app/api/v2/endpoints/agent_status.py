
"""
Agent Status Service.
Provides an API for the Frontend to audit the Auditors.
"""
from typing import Dict
from fastapi import APIRouter
from app.core.config import settings
from app.core.event_bus import event_bus

router = APIRouter(prefix="/system/agents", tags=["system"])

@router.get("/")
def get_agent_status() -> Dict:
    """
    Get the health and status of autonomous agents.
    """
    # In a Redis Stream architecture, we can query XINFO GROUPS to see consumer lag.
    redis_info = {}
    if event_bus.redis:
        try:
            # Check how far behind the 'embedded_auditor' is
            groups = event_bus.redis.xinfo_groups(event_bus.stream_key)
            for g in groups:
                 if g["name"] == "zenith_v3_group":
                     redis_info["lag"] = g.get("lag", 0)
                     redis_info["consumers"] = g.get("consumers", 0)
        except Exception:
             redis_info["status"] = "unavailable"

    return {
        "auditor": {
            "status": "active", # Since it's embedded in the API process
            "type": "event_driven",
            "stream_metrics": redis_info
        },
        "nurse": {
            "status": "active",
            "type": "polling",
            "interval_seconds": 30
        },
        "environment": "embedded" if getattr(settings, "ENABLE_EMBEDDED_AGENTS", False) else "distributed"
    }
