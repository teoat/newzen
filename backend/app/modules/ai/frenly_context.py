"""
Frenly AI Context Builder
Maintains real-time context awareness by monitoring all application events
"""

import json
import time
import uuid
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)
# Try to use Redis for distributed context, fall back to in-memory
try:
    import redis

    REDIS_AVAILABLE = True
    redis_client = redis.Redis(host="localhost", port=6379, db=2, decode_responses=True)
    # Test connection
    redis_client.ping()
    logger.info("Redis connection established for Frenly context")
except Exception as e:
    REDIS_AVAILABLE = False
    logger.warning(f"Redis not available, using in-memory context: {e}")
    # Fallback to in-memory storage
    _memory_store: Dict[str, Any] = {}


class FrenlyContextBuilder:
    """
    Builds and maintains AI context from application events.
    Stores context in Redis (or memory) for fast access.
    """

    CONTEXT_TTL = 3600  # 1 hour
    ALERT_TTL = 300  # 5 minutes
    MAX_ALERTS = 50

    @classmethod
    def _get_redis_key(cls, key_type: str, identifier: str = "global") -> str:
        """Generate Redis key for different context types"""
        return f"frenly:{key_type}:{identifier}"

    @classmethod
    def _set(cls, key: str, value: Any, ttl: Optional[int] = None):
        """Set value in Redis or memory"""
        if REDIS_AVAILABLE:
            if ttl:
                redis_client.setex(key, ttl, json.dumps(value))
            else:
                redis_client.set(key, json.dumps(value))
        else:
            _memory_store[key] = {
                "value": value,
                "expires": time.time() + ttl if ttl else None,
            }

    @classmethod
    def _get(cls, key: str) -> Optional[Any]:
        """Get value from Redis or memory"""
        if REDIS_AVAILABLE:
            value = redis_client.get(key)
            return json.loads(value) if value else None
        else:
            item = _memory_store.get(key)
            if item:
                if item["expires"] and time.time() > item["expires"]:
                    del _memory_store[key]
                    return None
                return item["value"]
            return None

    @classmethod
    def _lpush(cls, key: str, value: Any):
        """Push to list in Redis or memory"""
        if REDIS_AVAILABLE:
            redis_client.lpush(key, json.dumps(value))
        else:
            if key not in _memory_store:
                _memory_store[key] = {"value": [], "expires": None}
            _memory_store[key]["value"].insert(0, value)

    @classmethod
    def _lrange(cls, key: str, start: int, end: int) -> List[Any]:
        """Get range from list in Redis or memory"""
        if REDIS_AVAILABLE:
            items = redis_client.lrange(key, start, end)
            return [json.loads(item) for item in items]
        else:
            item = _memory_store.get(key)
            if item:
                return item["value"][start:end + 1 if end >= 0 else None]
            return []

    @classmethod
    def _ltrim(cls, key: str, start: int, end: int):
        """Trim list in Redis or memory"""
        if REDIS_AVAILABLE:
            redis_client.ltrim(key, start, end)
        else:
            item = _memory_store.get(key)
            if item:
                item["value"] = item["value"][start:end + 1 if end >= 0 else None]

    @classmethod
    def update_context(cls, event):
        """
        Update Frenly AI context based on application event.
        Called automatically by EventBus for all events.
        Args:
            event: Event object from EventBus
        """
        # Build context snapshot
        context = {
            "last_event": event.event_type.value,
            "timestamp": event.timestamp.isoformat(),
            "data": event.data,
            "user_id": event.user_id,
            "project_id": event.project_id,
        }
        # Store user-specific context
        if event.user_id:
            key = cls._get_redis_key("context", event.user_id)
            cls._set(key, context, cls.CONTEXT_TTL)
        # Store project-specific context
        if event.project_id:
            key = cls._get_redis_key("project_context", event.project_id)
            cls._set(key, context, cls.CONTEXT_TTL)
        # Store global context (last 100 events)
        global_key = cls._get_redis_key("global_events", "all")
        cls._lpush(global_key, context)
        cls._ltrim(global_key, 0, 99)
        # Check if this event should trigger proactive alerts
        cls._check_proactive_triggers(event)
        logger.debug(f"Context updated for event: {event.event_type.value}")

    @classmethod
    def _check_proactive_triggers(cls, event):
        """
        Determine if event should trigger proactive Frenly AI alert.
        Args:
            event: Event object to analyze
        """
        from app.core.event_bus import EventType

        alerts = []
        # High-risk anomaly detected
        if event.event_type == EventType.ANOMALY_DETECTED:
            risk_score = event.data.get("risk_score", 0)
            if risk_score > 0.85:
                alerts.append(
                    {
                        "type": "high_risk",
                        "severity": "critical",
                        "title": "🚨 High-Risk Anomaly Detected",
                        "message": (
                            f"Transaction {event.data.get('transaction_id')} "
                            f"flagged with risk score {risk_score:.2f}"
                        ),
                        "actions": [
                            {"label": "Start Investigation", "route": "/investigate"},
                            {"label": "Review Details", "action": "show_transaction"},
                        ],
                        "metadata": event.data,
                    }
                )
        # Data quality issues
        elif event.event_type == EventType.DATA_VALIDATED:
            quality_score = event.data.get("quality_score", 100)
            issues_count = len(event.data.get("issues", []))
            if quality_score < 80 or issues_count > 5:
                alerts.append(
                    {
                        "type": "data_quality",
                        "severity": "warning",
                        "title": "⚠️ Data Quality Issues Found",
                        "message": (
                            f"Quality score: {quality_score}% | " f"{issues_count} issues detected"
                        ),
                        "actions": [
                            {"label": "Review Issues", "action": "show_validation"},
                            {"label": "Auto-fix", "action": "auto_fix_data"},
                        ],
                        "metadata": event.data,
                    }
                )
        # Batch job failures
        elif event.event_type == EventType.BATCH_JOB_FAILED:
            alerts.append(
                {
                    "type": "job_failure",
                    "severity": "warning",
                    "title": "❌ Batch Job Failed",
                    "message": (
                        f"Job {event.data.get('job_id')} failed: "
                        f"{event.data.get('error_message', 'Unknown error')}"
                    ),
                    "actions": [
                        {"label": "View Logs", "action": "show_job_logs"},
                        {"label": "Retry Job", "action": "retry_job"},
                    ],
                    "metadata": event.data,
                }
            )
        # Pattern identified (circular flow, etc.)
        elif event.event_type == EventType.PATTERN_IDENTIFIED:
            pattern_type = event.data.get("pattern_type")
            risk_level = event.data.get("risk_level", 0)
            if risk_level > 0.7:
                alerts.append(
                    {
                        "type": "pattern",
                        "severity": "critical" if risk_level > 0.85 else "warning",
                        "title": f"🔗 {pattern_type} Pattern Detected",
                        "message": event.data.get("description", "Suspicious pattern found"),
                        "actions": [
                            {"label": "Investigate", "route": "/investigate"},
                            {"label": "View Details", "action": "show_pattern"},
                        ],
                        "metadata": event.data,
                    }
                )
        # Reconciliation completed with gaps
        elif event.event_type == EventType.RECONCILIATION_COMPLETED:
            gap_count = event.data.get("unmatched_count", 0)
            total = event.data.get("total_count", 0)
            gap_percentage = (gap_count / total * 100) if total > 0 else 0
            if gap_percentage > 15:
                alerts.append(
                    {
                        "type": "reconciliation",
                        "severity": "warning",
                        "title": "📊 Reconciliation Gaps Detected",
                        "message": (
                            f"{gap_count} unmatched items ({gap_percentage:.1f}%) "
                            f"out of {total}"
                        ),
                        "actions": [
                            {"label": "Review Unmatched", "route": "/reconciliation"},
                            {"label": "Auto-Match", "action": "auto_match"},
                        ],
                        "metadata": event.data,
                    }
                )
        # Store all generated alerts
        for alert in alerts:
            cls._generate_proactive_alert(alert, event)

    @classmethod
    def _generate_proactive_alert(cls, alert: Dict[str, Any], event):
        """
        Store a proactive alert for frontend consumption.
        Args:
            alert: Alert data dictionary
            event: Source event that triggered alert
        """
        alert_data = {
            **alert,
            "id": str(uuid.uuid4()),
            "timestamp": time.time(),
            "event_type": event.event_type.value,
            "user_id": event.user_id,
            "project_id": event.project_id,
        }
        # Store in alerts list
        alerts_key = cls._get_redis_key("alerts", event.user_id or "global")
        cls._lpush(alerts_key, alert_data)
        cls._ltrim(alerts_key, 0, cls.MAX_ALERTS - 1)
        logger.info(
            f"Proactive alert generated: {alert['title']} " f"(severity: {alert['severity']})"
        )

    @classmethod
    def get_alerts(cls, user_id: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get proactive alerts for a user or globally.
        Args:
            user_id: User ID to get alerts for (None = global)
            limit: Maximum number of alerts to return
        Returns:
            List of alert dictionaries
        """
        alerts_key = cls._get_redis_key("alerts", user_id or "global")
        alerts = cls._lrange(alerts_key, 0, limit - 1)
        return alerts

    @classmethod
    def dismiss_alert(cls, alert_id: str, user_id: Optional[str] = None):
        """
        Dismiss/remove an alert.
        Args:
            alert_id: Alert ID to dismiss
            user_id: User ID (None = global)
        """
        alerts_key = cls._get_redis_key("alerts", user_id or "global")
        alerts = cls._lrange(alerts_key, 0, -1)
        # Filter out the dismissed alert
        filtered = [a for a in alerts if a.get("id") != alert_id]
        # Replace list
        if REDIS_AVAILABLE:
            redis_client.delete(alerts_key)
            for alert in reversed(filtered):
                cls._lpush(alerts_key, alert)
        else:
            if alerts_key in _memory_store:
                _memory_store[alerts_key]["value"] = filtered

    @classmethod
    def get_context(
        cls, user_id: Optional[str] = None, page: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get current Frenly AI context for user and/or page.
        Args:
            user_id: User ID
            page: Current page path
        Returns:
            Context dictionary with greeting, actions, tips
        """
        # Get user-specific context if available
        context_data = {}
        if user_id:
            key = cls._get_redis_key("context", user_id)
            context_data = cls._get(key) or {}
        # Build context response (can be enhanced with page-specific logic)
        return {
            "page": page or "unknown",
            "greeting": cls._get_greeting(context_data, page),
            "quick_actions": cls._get_quick_actions(page),
            "tips": cls._get_tips(context_data, page),
            "last_event": context_data.get("last_event"),
            "timestamp": context_data.get("timestamp"),
        }

    @classmethod
    def _get_greeting(cls, context: Dict, page: Optional[str]) -> str:
        """Generate context-aware greeting"""
        last_event = context.get("last_event")
        if last_event == "data.ingested":
            return "Data successfully ingested. Ready for reconciliation and analysis."
        elif last_event == "anomaly.detected":
            return "⚠️ Anomalies detected in recent data. Review recommended."
        elif last_event == "case.created":
            return "New investigation case created. Evidence collection in progress."
        else:
            return "Frenly AI ready to assist. How can I help with your forensic analysis?"

    @classmethod
    def _get_quick_actions(cls, page: Optional[str]) -> List[Dict[str, str]]:
        """Get page-specific quick actions"""
        actions_map = {
            "/reconciliation": [
                {"label": "Auto-Match Transactions", "action": "auto_match"},
                {"label": "Show Variance Analysis", "action": "analyze_variance"},
            ],
            "/investigate": [
                {"label": "Generate Dossier", "action": "generate_dossier"},
                {"label": "Run Deep Scan", "action": "deep_scan"},
            ],
            "/ingestion": [
                {"label": "Validate Data Quality", "action": "validate_quality"},
                {"label": "Preview Sample", "action": "preview_data"},
            ],
        }
        return actions_map.get(page, [])

    @classmethod
    def _get_tips(cls, context: Dict, page: Optional[str]) -> List[str]:
        """Generate context-aware tips"""
        tips = []
        # Page-specific tips
        if page == "/reconciliation":
            tips.append("💡 Use Tier 1 matching for exact invoice references")
        elif page == "/investigate":
            tips.append("🎯 Link evidence to specific transactions for stronger cases")
        # Event-based tips
        last_event = context.get("last_event")
        if last_event == "data.validated":
            tips.append("✅ Ensure all required columns are mapped correctly")
        return tips or ["💡 Ask me anything about the forensic data"]


# Initialize event bus subscription on module load
def init_frenly_context_tracking():
    """Initialize Frenly AI as global event listener"""
    from app.core.event_bus import get_event_bus

    event_bus = get_event_bus()
    event_bus.subscribe_all(FrenlyContextBuilder.update_context)
    logger.info("Frenly Context Builder subscribed to all events")


# Auto-initialize when module is imported
try:
    init_frenly_context_tracking()
except Exception as e:
    logger.warning(f"Failed to initialize Frenly context tracking: {e}")
