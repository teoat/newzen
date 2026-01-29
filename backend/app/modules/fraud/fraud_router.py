from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.core.db import get_session
from app.models import Transaction, FraudAlert, Project
from app.modules.fraud.rules import fraud_engine
from app.core.sync import manager
from app.core.auth_middleware import verify_project_access

router = APIRouter(prefix="/forensic/{project_id}/fraud", tags=["Fraud Engine"])


@router.post("/evaluate")
async def evaluate_new_transaction(
    project_id: str,
    tx_data: dict,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    Simulates a new transaction event, runs it through the fraud engine,
    and broadcasts the result via WebSocket.
    """
    # Create the transaction object in project context
    tx = Transaction(
        amount=tx_data.get("amount", 0),
        sender=tx_data.get("sender", "Unknown"),
        receiver=tx_data.get("receiver", "Unknown"),
        description=tx_data.get("description", ""),
        project_id=project.id,
        status="pending",
    )
    # Run evaluation
    results = fraud_engine.evaluate_transaction(tx)
    tx.risk_score = results["risk_score"]
    tx.status = results["status"]
    db.add(tx)
    db.commit()
    db.refresh(tx)

    # If high risk, create a FraudAlert
    if tx.risk_score >= 0.5:
        alert = FraudAlert(
            transaction_id=tx.id,
            project_id=project.id,
            alert_type="Heuristic Match",
            severity="High",
            risk_score=tx.risk_score,
            description=", ".join(results["alerts"]),
        )
        db.add(alert)
        db.commit()

        # BROADCAST to all connected clients (scoped to project)
        await manager.broadcast(
            {
                "type": "THREAT_ALERT",
                "project_id": project.id,
                "payload": {
                    "id": tx.id,
                    "title": f"Suspicious Activity: {tx.receiver}",
                    "source": "Fraud Engine Lite",
                    "priority": "high",
                    "time": "JUST NOW",
                },
            }
        )
    return {"transaction_id": tx.id, "evaluation": results}
