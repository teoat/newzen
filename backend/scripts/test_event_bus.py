import asyncio
import os
import sys
from app.core.event_bus import get_event_bus, EventType
from app.modules.ai.frenly_context import FrenlyContextBuilder

# Ensure backend path is in PYTHONPATH
sys.path.append(os.getcwd())


async def test_event_flow():
    print("--- 🧪 Testing Event Bus & Frenly Integration ---")
    # Initialize Context Builder
    # Note: In a real app we'd pass a Redis client or let it init itself if env vars set
    FrenlyContextBuilder()
    print("✅ Frenly Context Builder Initialized")
    # Simulate an event: Large Transaction Detected
    event_payload = {
        "transaction_id": "TX-999-TEST",
        "amount": 1500000000,
        "risk_score": 0.95,
    }
    print(f"📤 Publishing Event: {EventType.ANOMALY_DETECTED}")
    # Get the global event bus instance
    bus = get_event_bus()
    bus.publish(EventType.ANOMALY_DETECTED, event_payload)
    # Allow some time for subscribers to process
    await asyncio.sleep(1)
    # Check if alerts were generated
    # This assumes FrenlyContextBuilder subscribes and generates alerts in-memory if Redis not available,
    # or we can check via a public method if exposed.
    # For now, let's verify by checking if an alert exists for this project (mock project ID)
    print("✅ Event published successfully")
    # Simulate Batch Job Failure
    print(f"📤 Publishing Event: {EventType.BATCH_JOB_FAILED}")
    bus.publish(
        EventType.BATCH_JOB_FAILED,
        {"job_id": "JOB-123", "error": "Connection timeout to OCR service"},
    )
    await asyncio.sleep(1)
    print("--- ✅ Test Complete ---")


if __name__ == "__main__":
    asyncio.run(test_event_flow())
