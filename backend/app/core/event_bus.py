"""
Event Bus - Unified event-driven architecture for Zenith
Enables decoupled communication between modules and Frenly AI context awareness
"""

from typing import Callable, List, Dict, Any, Optional
from enum import Enum
import logging
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class EventType(Enum):
    """All system events that can be published"""

    # Ingestion Events
    DATA_UPLOADED = "data.uploaded"
    DATA_VALIDATED = "data.validated"
    DATA_INGESTED = "data.ingested"
    BATCH_JOB_STARTED = "batch.job.started"
    BATCH_JOB_COMPLETED = "batch.job.completed"
    BATCH_JOB_FAILED = "batch.job.failed"
    # Reconciliation Events
    TRANSACTION_MATCHED = "transaction.matched"
    VARIANCE_DETECTED = "variance.detected"
    BULK_MATCHED = "bulk.matched"
    RECONCILIATION_COMPLETED = "reconciliation.completed"
    # Investigation Events
    CASE_CREATED = "case.created"
    CASE_UPDATED = "case.updated"
    CASE_CLOSED = "case.closed"
    EVIDENCE_ADDED = "evidence.added"
    EVIDENCE_VERIFIED = "evidence.verified"
    ENTITY_FLAGGED = "entity.flagged"
    # Fraud Detection Events
    ANOMALY_DETECTED = "anomaly.detected"
    RISK_SCORE_UPDATED = "risk.updated"
    PATTERN_IDENTIFIED = "pattern.identified"
    HIGH_RISK_ALERT = "high_risk.alert"
    CIRCULAR_FLOW_DETECTED = "circular_flow.detected"
    # Forensic Events
    SATELLITE_VERIFIED = "satellite.verified"
    NEXUS_ANALYZED = "nexus.analyzed"
    CORRELATION_FOUND = "correlation.found"
    # AI Events
    FRENLY_SUGGESTION = "frenly.suggestion"
    AI_INSIGHT_GENERATED = "ai.insight"
    PROACTIVE_ALERT = "proactive.alert"
    SQL_QUERY_EXECUTED = "sql.query.executed"
    # User Events
    USER_LOGIN = "user.login"
    USER_LOGOUT = "user.logout"
    PAGE_VIEWED = "page.viewed"
    ACTION_PERFORMED = "action.performed"
    # System Events
    HEALTH_CHECK = "system.health_check"
    ERROR_OCCURRED = "system.error"
    PERFORMANCE_ALERT = "system.performance"


class Event:
    """Event container with metadata"""

    def __init__(
        self,
        event_type: EventType,
        data: Dict[str, Any],
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
    ):
        self.event_type = event_type
        self.data = data
        self.user_id = user_id
        self.project_id = project_id
        self.timestamp = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary for serialization"""
        return {
            "event_type": self.event_type.value,
            "data": self.data,
            "user_id": self.user_id,
            "project_id": self.project_id,
            "timestamp": self.timestamp.isoformat(),
        }

    def to_json(self) -> str:
        """Convert event to JSON string"""
        return json.dumps(self.to_dict())


class EventBus:
    """
    Central event bus for pub/sub pattern.
    Modules publish events, subscribers (including Frenly AI) react.
    """

    def __init__(self):
        self._subscribers: Dict[EventType, List[Callable[[Event], None]]] = {}
        self._global_subscribers: List[Callable[[Event], None]] = []  # Listen to all events
        self._event_log: List[Event] = []  # Keep last 1000 events in memory
        self._max_log_size = 1000
        logger.info("EventBus initialized")

    def subscribe(self, event_type: EventType, callback: Callable[[Event], None]):
        """
        Subscribe to specific event type.
        Args:
            event_type: Type of event to listen for
            callback: Function to call when event is published
                      Should accept Event as parameter
        """
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(callback)
        logger.info(f"Subscribed to {event_type.value}: {callback.__name__}")

    def subscribe_all(self, callback: Callable[[Event], None]):
        """
        Subscribe to ALL events (global listener).
        Useful for Frenly AI context tracking and audit logging.
        Args:
            callback: Function called for every event
        """
        self._global_subscribers.append(callback)
        logger.info(f"Global subscriber added: {callback.__name__}")

    def publish(
        self,
        event_type: EventType,
        data: Dict[str, Any],
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
    ):
        """
        Publish an event to all subscribers.
        Args:
            event_type: Type of event
            data: Event data payload
            user_id: Optional user ID who triggered event
            project_id: Optional project ID context
        """
        event = Event(event_type, data, user_id, project_id)
        # Add to event log
        self._event_log.append(event)
        if len(self._event_log) > self._max_log_size:
            self._event_log = self._event_log[-self._max_log_size:]
        logger.debug(f"Event published: {event_type.value} | Data: {data}")
        # Notify specific subscribers
        if event_type in self._subscribers:
            for callback in self._subscribers[event_type]:
                try:
                    callback(event)
                except Exception as e:
                    logger.error(
                        f"Subscriber error for {event_type.value}: "
                        f"{callback.__name__} - {str(e)}"
                    )
        # Notify global subscribers (Frenly AI, audit log, etc.)
        for callback in self._global_subscribers:
            try:
                callback(event)
            except Exception as e:
                logger.error(f"Global subscriber error: {callback.__name__} - {str(e)}")

    def get_recent_events(
        self,
        event_type: Optional[EventType] = None,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        limit: int = 100,
    ) -> List[Event]:
        """
        Get recent events with optional filtering.
        Args:
            event_type: Filter by event type
            user_id: Filter by user
            project_id: Filter by project
            limit: Max number of events to return
        Returns:
            List of Event objects
        """
        filtered = self._event_log
        if event_type:
            filtered = [e for e in filtered if e.event_type == event_type]
        if user_id:
            filtered = [e for e in filtered if e.user_id == user_id]
        if project_id:
            filtered = [e for e in filtered if e.project_id == project_id]
        return filtered[-limit:]

    def clear_log(self):
        """Clear event log (use with caution)"""
        self._event_log = []
        logger.info("Event log cleared")


# Global singleton instance
_event_bus = None


def get_event_bus() -> EventBus:
    """Get or create global event bus instance"""
    global _event_bus
    if _event_bus is None:
        _event_bus = EventBus()
    return _event_bus


# Convenience function for publishing
def publish_event(
    event_type: EventType,
    data: Dict[str, Any],
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
):
    """
    Convenience function to publish an event.
    Usage:
        from app.core.event_bus import publish_event, EventType
        publish_event(
            EventType.ANOMALY_DETECTED,
            {'transaction_id': 'T-123', 'risk_score': 0.95},
            user_id='user-456',
            project_id='proj-789'
        )
    """
    bus = get_event_bus()
    bus.publish(event_type, data, user_id, project_id)


# Decorator for automatic event publishing
def publishes_event(event_type: EventType):
    """
    Decorator to automatically publish event when function completes.
    Usage:
        @publishes_event(EventType.CASE_CREATED)
        def create_case(case_data: dict):
            # ... case creation logic ...
            return new_case
        # Event will be published with return value as data
    """

    def decorator(func: Callable):
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            # Extract user_id and project_id if available
            user_id = kwargs.get("user_id")
            project_id = kwargs.get("project_id")
            # Publish event with result as data
            if isinstance(result, dict):
                data = result
            else:
                data = {"result": str(result)}
            publish_event(event_type, data, user_id, project_id)
            return result

        return wrapper

    return decorator
