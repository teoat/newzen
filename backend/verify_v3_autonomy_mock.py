
import asyncio
import uuid
import time
from datetime import datetime, UTC
from sqlmodel import Session, select
from app.core.db import engine
from app.models import Transaction, FraudAlert, Project
from app.core import event_bus as event_bus_module
from app.modules.agents.auditor import AuditorAgent
import logging

# Suppress noisy SQL logs
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

# --- MOCK EVENT BUS ---
class MockStreamClient:
    def __init__(self):
        self.queue = []
        
    def publish_event(self, event_type, payload):
        # Determine msg_id
        msg_id = f"{int(time.time()*1000)}-0"
        self.queue.append({
            "id": msg_id,
            "type": event_type,
            "payload": payload,
            "timestamp": datetime.now(UTC).isoformat()
        })
        print(f"   [MockBus] Published {event_type}")
        return msg_id
        
    def consume_events(self, consumer_name, count=1, block=2000):
        # Return all in queue
        res = list(self.queue)
        # self.queue = [] # Keep them for now
        return res
        
    def ack_message(self, message_id):
        # Remove from queue
        self.queue = [m for m in self.queue if m["id"] != message_id]

# Monkeypatch the singleton
mock_bus = MockStreamClient()
event_bus_module.event_bus = mock_bus
# ----------------------

async def verify_autonomy():
    print("🧪 STARTING V3 AUTONOMY VERIFICATION (WITH MOCK BUS)")
    print("---------------------------------------")
    
    # 0. Start the Agent in Background
    print("0. Launching AuditorAgent in background...")
    # Pass our mock bus explicitly if possible, but we patched the module
    agent = AuditorAgent(consumer_name="test_verifier")
    # Since we patched the module `event_bus`, the agent's `self.stream_client = event_bus` 
    # will pick up the real one if it imported it *before* we patched?
    # Actually, AuditorAgent imports `event_bus` at top level.
    # So we need to patch the instance on the agent itself to be safe.
    agent.stream_client = mock_bus
    
    task = asyncio.create_task(agent.run_forever())
    await asyncio.sleep(0.5)

    # 1. Create Data
    tx_id = str(uuid.uuid4())
    project_id = str(uuid.uuid4())
    
    print("1. Creating Prerequisite Data...")
    try:
        with Session(engine) as db:
            proj = Project(
                id=project_id,
                name="V3 Verification Project",
                code=f"V3-{uuid.uuid4().hex[:4]}",
                contract_value=1_000_000_000,
                start_date=datetime.now(UTC),
                contractor_name="Tester Inc"
            )
            db.add(proj)
            
            tx = Transaction(
                id=tx_id,
                project_id=project_id,
                description="urgent facilitation payment for official", # +15 +50 = 65
                actual_amount=50_000_000, # +20 = 85
                receiver="Mr. X",
                sender="Cashier",
                transaction_date=datetime.now(UTC)
            )
            db.add(tx)
            db.commit()
            print("   ✅ Data DB Insert Success")
    except Exception as e:
        print(f"   ❌ DB Insert Failed: {e}")
        task.cancel()
        return

    # 2. Publish Event
    print("2. Publishing 'transaction.created' event...")
    # Use the mock bus directly
    mock_bus.publish_event(
        "transaction.created",
        {
            "entity_id": tx_id,
            "project_id": project_id
        }
    )

    # 3. Wait for Reaction
    print("3. Waiting for Auditor Agent (3 seconds)...")
    await asyncio.sleep(3)
    
    # 4. Check for Alert
    print("4. Checking database for Fraud Alert...")
    with Session(engine) as db:
        alert = db.exec(
            select(FraudAlert).where(FraudAlert.transaction_id == tx_id)
        ).first()
        
        if alert:
            print("\n✅ SUCCESS! V3 Autonomy is WORKING.")
            print(f"   Alert Created: {alert.alert_type}")
            print(f"   Risk Score: {alert.risk_score}")
        else:
            print("\n❌ FAILURE. Agent did not react.")
            
    task.cancel()

if __name__ == "__main__":
    asyncio.run(verify_autonomy())
