"""
Auditor Agent (Micro-Agent).
Listens to 'transaction.created' events and runs Prophet V2 Analysis.
This is the "Autonomous Watchdog" for the V3 architecture.
"""
import asyncio
from sqlmodel import Session
from app.core.db import engine
from app.core.event_bus import event_bus, EventType, EventPublisher
from app.models import Transaction, FraudAlert
from app.services.intelligence.prophet_service import ProphetService

class AuditorAgent:
    def __init__(self, consumer_name: str = "auditor_1"):
        self.stream_client = event_bus
        self.consumer_name = consumer_name

    async def run_forever(self):
        """
        Main Event Loop.
        Consumes events -> Processes them -> Publishes results.
        """
        print(f"🕵️ Auditor Agent '{self.consumer_name}' started...")
        while True:
            # 1. Consume
            events = self.stream_client.consume_events(
                self.consumer_name, count=5, block=2000
            )

            if not events:
                await asyncio.sleep(0.1)
                continue

            # 2. Process
            with Session(engine) as db:
                for event in events:
                    await self._handle_event(db, event)
                    # 3. Ack
                    self.stream_client.ack_message(event["id"])

    async def _handle_event(self, db: Session, event: dict):
        ev_type = event.get("type")
        payload = event.get("payload", {})
        
        if ev_type == EventType.TRANSACTION_CREATED:
            await self._audit_transaction(db, payload)
        
        # Add other handlers here (e.g. ENTITY_UPDATED)

    async def _audit_transaction(self, db: Session, payload: dict):
        try:
            tx_id = payload.get("entity_id")
            project_id = payload.get("project_id")
            
            print(f"   Analyzing Transaction {tx_id}...")
            
            # Fetch Transaction
            tx = db.get(Transaction, tx_id)
            if not tx:
                print(f"   ⚠️ Transaction {tx_id} not found in DB.")
                return 

            # Run Prophet Risk Analysis
            prophet = ProphetService(db)
            risk_report = await prophet.predict_transaction_risk({
                "amount": tx.actual_amount,
                "description": tx.description,
                "receiver": tx.receiver,
                "date": tx.transaction_date.isoformat() if tx.transaction_date else None
            })
            
            # Decision Logic
            if risk_report["risk_score"] >= 50:
                # AUTOMATICALLY FLAGGING
                alert = FraudAlert(
                    project_id=project_id,
                    transaction_id=tx.id,
                    alert_type="PROPHET_AUTO_FLAG",
                    severity=risk_report["risk_level"],
                    risk_score=risk_report["risk_score"],
                    description=f"Auto-Flagged: {', '.join(risk_report['factors'])}",
                    metadata_json=risk_report
                )
                db.add(alert)
                db.commit()
                
                # Emit ALERT_RAISED event
                EventPublisher.publish(
                    EventType.ALERT_RAISED, 
                    entity_id=alert.id,
                    project_id=project_id,
                    data=risk_report,
                    user_id="agent:auditor"
                )
                print(f"   🚨 HIGH RISK DETECTED: {risk_report['risk_score']}")
            else:
                print(f"   ✅ CLEAN (Score: {risk_report['risk_score']})")
        except Exception as e:
            import traceback
            print(f"   ❌ AGENT CRASHED analyzing {payload}: {e}")
            traceback.print_exc()

if __name__ == "__main__":
    # For testing locally, run this file directly
    agent = AuditorAgent()
    asyncio.run(agent.run_forever())
