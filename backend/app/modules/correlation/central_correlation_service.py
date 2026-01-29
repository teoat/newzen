from typing import Dict, List
from collections import defaultdict
from app.core.event_bus import get_event_bus, EventType, Event
import logging

logger = logging.getLogger(__name__)


class CentralCorrelationService:
    """
    Acts as a higher-level orchestrator for correlation, listening to various
    correlation-related events, aggregating them, and applying meta-correlation rules.
    """

    def __init__(self, event_bus):
        self.event_bus = event_bus
        # Store for aggregating related correlation findings
        # Example: {project_id: {entity_id: {correlation_type: [events]}}}
        self.aggregated_correlations: Dict[str, Dict[str, Dict[str, List[Event]]]] = defaultdict(
            lambda: defaultdict(lambda: defaultdict(list))
        )
        self.event_bus.subscribe(EventType.CORRELATION_FOUND, self.handle_correlation_found)
        self.event_bus.subscribe(EventType.HIGH_RISK_ALERT, self.handle_high_risk_alert)
        logger.info(
            "CentralCorrelationService initialized and subscribed to CORRELATION_FOUND and HIGH_RISK_ALERT events."
        )

    async def handle_correlation_found(self, event: Event):
        """Processes incoming CORRELATION_FOUND events."""
        project_id = event.project_id
        if not project_id:
            logger.debug(
                f"CORRELATION_FOUND event {event.event_type.value} has no project_id, skipping aggregation."
            )
            return

        correlation_type = event.data.get("correlation_type", "unknown")
        entity_id = event.data.get("entity_id", "global")  # Use 'global' if no specific entity

        self.aggregated_correlations[project_id][entity_id][correlation_type].append(event)
        logger.debug(
            f"Aggregated CORRELATION_FOUND for project {project_id}, entity {entity_id}, type {correlation_type}"
        )

        await self.apply_meta_correlation_rules(project_id, entity_id)

    async def handle_high_risk_alert(self, event: Event):
        """Processes incoming HIGH_RISK_ALERT events."""
        project_id = event.project_id
        if not project_id:
            logger.debug(
                f"HIGH_RISK_ALERT event {event.event_type.value} has no project_id, skipping aggregation."
            )
            return

        # Treat high risk alerts as a type of correlation for meta-correlation rules
        entity_id = event.data.get(
            "id", "global"
        )  # Assuming 'id' in data can be an entity/transaction id
        self.aggregated_correlations[project_id][entity_id]["HighRiskAlert"].append(event)
        logger.debug(f"Aggregated HIGH_RISK_ALERT for project {project_id}, entity {entity_id}")

        await self.apply_meta_correlation_rules(project_id, entity_id)

    async def apply_meta_correlation_rules(self, project_id: str, entity_id: str):
        """
        Applies rules on aggregated correlation data to identify higher-order patterns.
        """
        project_correlations = self.aggregated_correlations[project_id]

        # Rule 1: Multiple strong correlations for the same entity/project
        # Example: CircularFlow, UBO identified, and a High Risk Alert for the same entity/project
        entity_data = project_correlations.get(entity_id, {})

        has_circular_flow = "CircularFlow" in entity_data
        has_ubo = "BeneficialOwnership" in entity_data
        has_high_risk_alert = "HighRiskAlert" in entity_data
        has_fraud_detection = "FraudDetection" in entity_data
        has_asset_nexus = "AssetTemporalNexus" in entity_data

        if (has_circular_flow and has_ubo and has_high_risk_alert) or (
            has_fraud_detection and has_asset_nexus and has_high_risk_alert
        ):

            # Check if this meta-correlation has already been published recently
            # (to avoid spamming events for persistent conditions)
            # This would require more sophisticated state management or a debounce mechanism.
            # For now, we'll keep it simple and assume a single publication is enough.

            meta_correlation_data = {
                "meta_correlation_type": "MajorFraudCaseIdentified",
                "project_id": project_id,
                "entity_id": entity_id,
                "triggered_by_correlations": {
                    "circular_flow": has_circular_flow,
                    "ubo_identified": has_ubo,
                    "high_risk_alert": has_high_risk_alert,
                    "fraud_detection": has_fraud_detection,
                    "asset_temporal_nexus": has_asset_nexus,
                },
                "description": (
                    f"Multiple severe fraud indicators correlated for project {project_id} and entity {entity_id}. "
                    "Requires immediate human investigation."
                ),
            }
            self.event_bus.publish(
                EventType.HIGH_RISK_ALERT,  # Re-using High Risk Alert for now, could define new type
                data=meta_correlation_data,
                project_id=project_id,
            )
            logger.critical(
                f"MAJOR FRAUD CASE IDENTIFIED for project {project_id}, entity {entity_id}"
            )

        # Add more meta-correlation rules as needed
        # Example: Correlation of CrossSystemAnomaly and a specific pattern.


# Global instance of the service
_central_correlation_service = None


def initialize_central_correlation_service():
    global _central_correlation_service
    if _central_correlation_service is None:
        event_bus = get_event_bus()
        _central_correlation_service = CentralCorrelationService(event_bus)
        logger.info("CentralCorrelationService module initialized.")


# Call initialization function on import
initialize_central_correlation_service()
