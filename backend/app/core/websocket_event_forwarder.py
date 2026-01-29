from app.core.event_bus import get_event_bus, EventType, Event
from app.core.sync import manager
import logging

logger = logging.getLogger(__name__)


async def forward_high_risk_alert_to_websocket(event: Event):
    """
    Subscribes to HIGH_RISK_ALERT events and forwards them to active WebSocket clients.
    """
    logger.info(f"Received HIGH_RISK_ALERT from EventBus: {event.data}")
    # Construct the message payload for the frontend WebSocket
    # This matches the original format sent by manager.broadcast in forensic_router.py
    websocket_message = {
        "type": "THREAT_ALERT",  # Frontend expects "THREAT_ALERT" type
        "payload": event.data,
    }
    try:
        await manager.broadcast(websocket_message)
        logger.info(
            f"Broadcasted HIGH_RISK_ALERT to {len(manager.active_connections)} WebSocket clients."
        )
    except Exception as e:
        logger.error(f"Failed to broadcast WebSocket message: {e}")


def initialize_websocket_event_forwarder():
    """
    Initializes the event forwarder by subscribing to relevant EventBus events.
    """
    event_bus = get_event_bus()
    event_bus.subscribe(EventType.HIGH_RISK_ALERT, forward_high_risk_alert_to_websocket)
    logger.info("WebSocket Event Forwarder initialized and subscribed to HIGH_RISK_ALERT.")


# This ensures the forwarder is initialized when the module is imported
# In a real application, you might want to call initialize_websocket_event_forwarder()
# explicitly during startup (e.g., in main.py's lifespan event).
# For now, we rely on module import.
initialize_websocket_event_forwarder()
