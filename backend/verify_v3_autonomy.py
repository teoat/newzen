
import asyncio
import uuid
from datetime import datetime, UTC
from sqlmodel import Session, select
from app.core.db import engine
from app.models import Transaction, FraudAlert, Project
from app.core.event_bus import EventPublisher, EventType
from app.modules.agents.auditor import AuditorAgent

async def verify_autonomy():
    print("🧪 STARTING V3 AUTONOMY VERIFICATION")
    print("---------------------------------------")
    
    # 0. Start the Agent in Background
    print("0. Launching AuditorAgent in background...")
    agent = AuditorAgent(consumer_name="test_verifier")
    # We use create_task to run it concurrently
    task = asyncio.create_task(agent.run_forever())
    
    # Give it a second to connect to Redis
    await asyncio.sleep(1)

    # 1. Create Data
    tx_id = str(uuid.uuid4())
    project_id = str(uuid.uuid4())
    
    print("1. Creating Prerequisite Data...")
    with Session(engine) as db:
        # Must create Project first to satisfy FK
        proj = Project(
            id=project_id,
            name="V3 Verification Project",
            code=f"V3-{uuid.uuid4().hex[:4]}",
            contract_value=1_000_000_000,
            start_date=datetime.now(UTC),
            contractor_name="Tester Inc"
        )
        db.add(proj)
        
        # Create Transaction
        print(f"   Creating Transaction {tx_id}...")
        tx = Transaction(
            id=tx_id,
            project_id=project_id,
            description="urgent facilitation payment for official", # Keyword Trigger
            actual_amount=50_000_000, # Round Number Trigger
            receiver="Mr. X",
            sender="Cashier",
            transaction_date=datetime.now(UTC)
        )
        db.add(tx)
        db.commit()

    # 2. Publish Event
    print("2. Publishing 'transaction.created' event...")
    # The Agent listens for this
    msg_id = EventPublisher.publish(
        EventType.TRANSACTION_CREATED,
        entity_id=tx_id,
        project_id=project_id,
        data={"amount": 50000000, "desc": "urgent"}
    )
    print(f"   Event published! Msg ID: {msg_id}")

    # 3. Wait for Reaction
    print("3. Waiting for Auditor Agent (5 seconds)...")
    await asyncio.sleep(5)
    
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
            print(f"   Reasoning: {alert.description}")
        else:
            print("\n❌ FAILURE. Agent did not react.")
            
    # Cleanup
    task.cancel()

if __name__ == "__main__":
    asyncio.run(verify_autonomy())
