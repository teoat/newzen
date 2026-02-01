"""
Zenith V3 Event Bus Schema Definition.
Defines the language of the Event-Driven Architecture.
"""
import enum
import uuid
import logging
from typing import Dict, Any, List, Callable, Optional
from datetime import datetime, UTC
from app.core.redis_client import RedisStreamClient

logger = logging.getLogger(__name__)

# Global Event Bus Client (Redis Stream)
event_bus = RedisStreamClient("zenith:v3:events")


class EventType(str, enum.Enum):
    # Transaction Lifecycle
    TRANSACTION_CREATED = "transaction.created"
    TRANSACTION_UPDATED = "transaction.updated"
    TRANSACTION_FLAGGED = "transaction.flagged"

    # Forensic Triggers
    ALERT_RAISED = "alert.raised"
    ANOMALY_DETECTED = "anomaly.detected"
    HIGH_RISK_ALERT = "high.risk.alert"

    # Entity Verification
    ENTITY_VERIFIED = "entity.verified"
    ENTITY_WATCHLISTED = "entity.watchlisted"

    # Case Management
    CASE_OPENED = "case.opened"
    CASE_CLOSED = "case.closed"
    EVIDENCE_ADDED = "evidence.added"

    # Ingestion Lifecycle
    DATA_UPLOADED = "data.uploaded"
    DATA_VALIDATED = "data.validated"
    DATA_INGESTED = "data.ingested"

    # Batch & AI
    BATCH_JOB_FAILED = "batch.job.failed"
    PATTERN_IDENTIFIED = "pattern.identified"
    RECONCILIATION_COMPLETED = "reconciliation.completed"


class Event:
    """
    Standardized Event Object for Zenith V3.
    """
    def __init__(
        self, 
        event_type: EventType, 
        data: Dict[str, Any], 
        project_id: str = "global", 
        entity_id: str = "global", 
        user_id: str = "system",
        event_id: Optional[str] = None,
        timestamp: Optional[datetime] = None
    ):
        self.event_type = event_type
        self.data = data
        self.project_id = project_id
        self.entity_id = entity_id
        self.user_id = user_id
        self.event_id = event_id or str(uuid.uuid4())
        self.timestamp = timestamp or datetime.now(UTC)


class EventBus:
    """
    Central Event Bus for the application.
    Provides a unified interface for publishing and subscribing to events.
    """
    def __init__(self):
        self._subscribers: Dict[str, List[Callable]] = {}
        self._all_subscribers: List[Callable] = []

    def publish(
        self, 
        event_type: str, 
        data: Optional[Dict[str, Any]] = None, 
        project_id: str = "global", 
        entity_id: str = "global",
        user_id: str = "system"
    ):
        """
        Publish an event to the bus.
        """
        # Ensure it's an EventType enum if possible
        et = event_type
        if isinstance(event_type, str):
            try:
                et = EventType(event_type)
            except ValueError:
                pass

        event = Event(
            event_type=et,
            data=data or {},
            project_id=project_id,
            entity_id=entity_id,
            user_id=user_id
        )

        payload = {
            "event_id": event.event_id,
            "entity_id": event.entity_id,
            "project_id": event.project_id,
            "data": event.data,
            "user_id": event.user_id,
            "published_at": event.timestamp.isoformat()
        }
        
        # 1. Publish to Redis (Durable)
        msg_id = event_bus.publish_event(str(et), payload)
        
        # 2. Trigger local subscribers (In-process, immediate)
        self._trigger_local(event)
        
        return msg_id

    def subscribe(self, event_type: str, callback: Callable):
        """Subscribe to a specific event type."""
        et_str = str(event_type)
        if et_str not in self._subscribers:
            self._subscribers[et_str] = []
        self._subscribers[et_str].append(callback)

    def subscribe_all(self, callback: Callable):
        """Subscribe to all events."""
        self._all_subscribers.append(callback)

    def _trigger_local(self, event: Event):
        import asyncio
        import inspect

        def run_callback(cb, ev):
            try:
                if inspect.iscoroutinefunction(cb):
                    try:
                        loop = asyncio.get_running_loop()
                        loop.create_task(cb(ev))
                    except RuntimeError:
                        # No running loop, can't easily run async from here 
                        # in a thread-safe way without a loop. 
                        # But in FastAPI/Uvicorn there's usually a loop.
                        pass
                else:
                    cb(ev)
            except Exception as e:
                logger.error(f"Error in event subscriber {cb}: {e}")

        # Specific subscribers
        et_str = str(event.event_type)
        if et_str in self._subscribers:
            for cb in self._subscribers[et_str]:
                run_callback(cb, event)
        
        # Global subscribers
        for cb in self._all_subscribers:
            run_callback(cb, event)

# Singleton Instance
_global_bus = EventBus()


def get_event_bus():
    """Retrieve the global event bus instance."""
    return _global_bus

def publish_event(
    event_type: str, 
    data: Optional[Dict[str, Any]] = None,
    project_id: str = "global", 
    entity_id: str = "global",
    user_id: str = "system"
):
    """
    Compatibility wrapper for publishing events.
    """
    return get_event_bus().publish(
        event_type=event_type,
        data=data,
        project_id=project_id,
        entity_id=entity_id,
        user_id=user_id
    )

class EventPublisher:
    """
    Static publisher class for convenience.
    """
    @staticmethod
    def publish(
        event_type: str, 
        entity_id: str = "global", 
        project_id: str = "global", 
        data: Optional[Dict[str, Any]] = None,
        user_id: str = "system"
    ):
        return get_event_bus().publish(
            event_type=event_type,
            data=data,
            project_id=project_id,
            entity_id=entity_id,
            user_id=user_id
        )
