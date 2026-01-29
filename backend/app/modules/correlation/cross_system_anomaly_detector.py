from typing import Dict
from collections import deque
from app.core.event_bus import get_event_bus, EventType, Event
import logging

logger = logging.getLogger(__name__)


class CrossSystemAnomalyDetector:
    """
    Detects higher-order anomalies by correlating events and data points from multiple system modules.
    Subscribes to various EventTypes from the EventBus.
    Maintains a state/context of recent events to identify suspicious patterns or deviations.
    Publishes CORRELATION_FOUND (or a more specific event) when such an anomaly is detected.
    """

    def __init__(self, event_bus):
        self.event_bus = event_bus
        self.recent_events_buffer: Dict[str, deque] = {}  # {project_id: deque(events)}
        self.buffer_size = 50  # Max events to keep per project
        self.watched_event_types = [
            EventType.VARIANCE_DETECTED,
            EventType.ANOMALY_DETECTED,  # This is not published yet, but is a target
            EventType.HIGH_RISK_ALERT,
            EventType.ERROR_OCCURRED,
            EventType.SATELLITE_DISCREPANCY,  # If SiteTruthValidator eventually publishes this
            EventType.CIRCULAR_FLOW_DETECTED,
            EventType.CORRELATION_FOUND,  # Can correlate correlations!
        ]

        # Subscribe to relevant event types
        for event_type in self.watched_event_types:
            self.event_bus.subscribe(event_type, self.handle_event)

        logger.info(
            f"CrossSystemAnomalyDetector initialized and subscribed to {len(self.watched_event_types)} event types."
        )

    async def handle_event(self, event: Event):
        """Processes incoming events from the EventBus."""
        project_id = event.project_id
        if not project_id:
            logger.debug(
                f"Event {event.event_type.value} has no project_id, skipping cross-system analysis."
            )
            return

        if project_id not in self.recent_events_buffer:
            self.recent_events_buffer[project_id] = deque(maxlen=self.buffer_size)

        self.recent_events_buffer[project_id].append(event)
        logger.debug(f"Event {event.event_type.value} added to buffer for project {project_id}.")

        # Perform correlation logic
        await self.correlate_events(project_id)

    async def correlate_events(self, project_id: str):
        """
        Main correlation logic. Examines buffered events for patterns indicating a cross-system anomaly.
        This is where the 'magic' of correlation happens.
        """
        events = list(self.recent_events_buffer.get(project_id, []))
        if len(events) < 2:  # Need at least two events to correlate
            return

        # Example correlation rule: High Risk Alert followed by an Error Ocurred within a short window
        high_risk_alerts = [e for e in events if e.event_type == EventType.HIGH_RISK_ALERT]
        error_occurred_events = [e for e in events if e.event_type == EventType.ERROR_OCCURRED]

        for hra in high_risk_alerts:
            for eoe in error_occurred_events:
                time_diff = abs((hra.timestamp - eoe.timestamp).total_seconds())
                if time_diff < 300:  # 5 minutes window
                    correlation_data = {
                        "anomaly_type": "HighRiskAlert_followed_by_SystemError",
                        "project_id": project_id,
                        "high_risk_alert_details": hra.to_dict(),
                        "error_details": eoe.to_dict(),
                        "time_difference_seconds": time_diff,
                        "description": "A high-risk alert was closely followed by a system error, potentially indicating a coordinated attack or system instability triggered by fraudulent activity.",
                    }
                    self.event_bus.publish(
                        EventType.CORRELATION_FOUND, data=correlation_data, project_id=project_id
                    )
                    logger.warning(
                        f"Cross-System Anomaly Detected (HighRiskAlert_followed_by_SystemError) for project {project_id}"
                    )
                    return  # Only publish once per detection round for this specific rule

        # Add more correlation rules here based on various event combinations
        # Example: Circular Flow Detected + Variance Detected for the same project
        circular_flows = [e for e in events if e.event_type == EventType.CIRCULAR_FLOW_DETECTED]
        variances = [e for e in events if e.event_type == EventType.VARIANCE_DETECTED]

        if circular_flows and variances:
            # Simple rule: if both types of events exist for the project, it's a correlation
            correlation_data = {
                "anomaly_type": "CircularFlow_and_VarianceDetected",
                "project_id": project_id,
                "description": "Both circular money flows and significant variances have been detected for this project, indicating potential sophisticated financial manipulation.",
            }
            self.event_bus.publish(
                EventType.CORRELATION_FOUND, data=correlation_data, project_id=project_id
            )
            logger.warning(
                f"Cross-System Anomaly Detected (CircularFlow_and_VarianceDetected) for project {project_id}"
            )

        # Further complex rules can be added here
        # E.g., using a simple state machine or pattern matching across event sequences.


# Global instance of the detector
_cross_system_anomaly_detector = None


def initialize_cross_system_anomaly_detector():
    global _cross_system_anomaly_detector
    if _cross_system_anomaly_detector is None:
        event_bus = get_event_bus()
        _cross_system_anomaly_detector = CrossSystemAnomalyDetector(event_bus)
        logger.info("CrossSystemAnomalyDetector module initialized.")


# Call initialization function on import
initialize_cross_system_anomaly_detector()
