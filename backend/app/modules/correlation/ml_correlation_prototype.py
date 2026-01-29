from typing import Dict
from collections import deque
from app.core.event_bus import get_event_bus, EventType, Event, publish_event
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class MLCorrelationPrototype:
    """
    A prototype for ML-based correlation, demonstrating simple event sequence analysis.
    Subscribes to relevant EventBus events and applies hardcoded "ML rules" to detect patterns.
    Publishes PROACTIVE_ALERT when a predefined pattern is matched.
    """

    def __init__(self, event_bus):
        self.event_bus = event_bus
        self.project_event_buffers: Dict[str, deque] = {}  # {project_id: deque(events)}
        self.buffer_window_seconds = 600  # Keep events for the last 10 minutes
        self.watched_event_types = [
            EventType.CORRELATION_FOUND,
            EventType.VARIANCE_DETECTED,
            EventType.ERROR_OCCURRED,
            EventType.HIGH_RISK_ALERT,
        ]

        # Subscribe to relevant event types
        for event_type in self.watched_event_types:
            self.event_bus.subscribe(event_type, self.handle_event)

        logger.info(
            f"MLCorrelationPrototype initialized and subscribed to {len(self.watched_event_types)} event types."
        )

    async def handle_event(self, event: Event):
        """Processes incoming events from the EventBus."""
        project_id = event.project_id
        if not project_id:
            logger.debug(
                f"Event {event.event_type.value} has no project_id, skipping ML correlation."
            )
            return

        if project_id not in self.project_event_buffers:
            # Using deque with a dynamic maxlen based on time window rather than fixed count
            self.project_event_buffers[project_id] = deque()

        # Add event and clean up old events
        self.project_event_buffers[project_id].append(event)
        self._cleanup_old_events(project_id)

        logger.debug(f"Event {event.event_type.value} added to ML buffer for project {project_id}.")

        # Apply simple ML rules
        await self.apply_ml_rules(project_id)

    def _cleanup_old_events(self, project_id: str):
        """Removes events older than buffer_window_seconds from the deque."""
        buffer = self.project_event_buffers[project_id]
        cutoff_time = datetime.utcnow() - timedelta(seconds=self.buffer_window_seconds)
        while buffer and buffer[0].timestamp < cutoff_time:
            buffer.popleft()

    async def apply_ml_rules(self, project_id: str):
        """
        Applies simple hardcoded "ML rules" to detect patterns in event sequences.
        This would be replaced by an actual ML model in a production system.
        """
        events_in_window = list(self.project_event_buffers[project_id])

        # Rule: VARIANCE_DETECTED -> ERROR_OCCURRED -> CORRELATION_FOUND (FraudDetection)
        # This implies a potential attempt to cover up or a system failure related to fraud.
        has_variance = any(e.event_type == EventType.VARIANCE_DETECTED for e in events_in_window)
        has_error = any(e.event_type == EventType.ERROR_OCCURRED for e in events_in_window)
        has_fraud_correlation = any(
            e.event_type == EventType.CORRELATION_FOUND
            and e.data.get("correlation_type") == "FraudDetection"
            for e in events_in_window
        )

        if has_variance and has_error and has_fraud_correlation:
            # Further refine with temporal order if needed (for this prototype, presence is enough)

            # Check if this proactive alert has already been published recently for this project
            # (simple debounce to avoid spamming alerts)
            last_alert_time = getattr(self, f"_last_ml_alert_time_{project_id}", None)
            if (
                last_alert_time and (datetime.utcnow() - last_alert_time).total_seconds() < 3600
            ):  # 1 hour debounce
                return

            alert_data = {
                "alert_type": "ML_Anomaly_Sequence",
                "project_id": project_id,
                "description": (
                    "ML Prototype detected a suspicious sequence: Variance Detected -> System Error -> Fraud Correlation. "
                    "Suggests potential sophisticated activity or system compromise."
                ),
                "triggering_events_count": {
                    "VARIANCE_DETECTED": sum(
                        1 for e in events_in_window if e.event_type == EventType.VARIANCE_DETECTED
                    ),
                    "ERROR_OCCURRED": sum(
                        1 for e in events_in_window if e.event_type == EventType.ERROR_OCCURRED
                    ),
                    "CORRELATION_FOUND_FraudDetection": sum(
                        1
                        for e in events_in_window
                        if e.event_type == EventType.CORRELATION_FOUND
                        and e.data.get("correlation_type") == "FraudDetection"
                    ),
                },
            }
            publish_event(EventType.PROACTIVE_ALERT, data=alert_data, project_id=project_id)
            setattr(self, f"_last_ml_alert_time_{project_id}", datetime.utcnow())
            logger.critical(
                f"ML Prototype issued PROACTIVE_ALERT for project {project_id}: Anomaly Sequence Detected."
            )


# Global instance of the prototype
_ml_correlation_prototype = None


def initialize_ml_correlation_prototype():
    global _ml_correlation_prototype
    if _ml_correlation_prototype is None:
        event_bus = get_event_bus()
        _ml_correlation_prototype = MLCorrelationPrototype(event_bus)
        logger.info("MLCorrelationPrototype module initialized.")


# Call initialization function on import
initialize_ml_correlation_prototype()
