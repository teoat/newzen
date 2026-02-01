"""
The Watchtower - Proactive Forensic Sentinel
Analyzes project momentum and flags ingestion silence or variance acceleration.
"""

from app.core.celery_config import celery_app
from app.core.db import engine
from app.models import Project, Ingestion, Transaction, FraudAlert
from app.core.event_bus import publish_event, EventType
from sqlmodel import Session, select, func, desc
from datetime import datetime, UTC, timedelta
import logging

logger = logging.getLogger(__name__)

@celery_app.task(name="zenith_forensic.tasks.watchtower.evaluate_momentum")
def evaluate_momentum():
    """
    Evaluates every active project for momentum failures.
    Runs every 6 hours to detect 'Data Silence' or 'Fraud Acceleration'.
    """
    with Session(engine) as db:
        projects = db.exec(select(Project).where(Project.status != "closed")).all()
        
        for project in projects:
            # 1. Detect Ingestion Silence (> 5 days)
            last_ingestion = db.exec(
                select(Ingestion)
                .where(Ingestion.project_id == project.id)
                .order_by(desc(Ingestion.created_at))
                .limit(1)
            ).first()
            
            if last_ingestion:
                silence_duration = datetime.now(UTC) - last_ingestion.created_at
                if silence_duration > timedelta(days=5):
                    _trigger_sentinel_alert(
                        db, project.id, 
                        "INGESTION_SILENCE", 
                        f"Project has received no new data for {silence_duration.days} days. Potential audit gap."
                    )
            
            # 2. Variance Acceleration (Week-over-Week)
            now = datetime.now(UTC)
            this_week_start = now - timedelta(days=7)
            last_week_start = now - timedelta(days=14)
            
            this_week_variants = db.exec(
                select(func.count(Transaction.id))
                .where(Transaction.project_id == project.id)
                .where(Transaction.risk_score > 0.7)
                .where(Transaction.timestamp >= this_week_start)
            ).one()
            
            last_week_variants = db.exec(
                select(func.count(Transaction.id))
                .where(Transaction.project_id == project.id)
                .where(Transaction.risk_score > 0.7)
                .where(Transaction.timestamp >= last_week_start)
                .where(Transaction.timestamp < this_week_start)
            ).one()
            
            if last_week_variants > 0:
                acceleration = (this_week_variants - last_week_variants) / last_week_variants
                if acceleration > 0.3: # 30% increase
                    _trigger_sentinel_alert(
                        db, project.id,
                        "VARIANCE_ACCELERATION",
                        f"Anomalous activity has accelerated by {acceleration*100:.1f}% this week. High fraud pressure detected."
                    )

def _trigger_sentinel_alert(db: Session, project_id: str, alert_type: str, message: str):
    """Internal helper to log and broadcast sovereign alerts."""
    alert = FraudAlert(
        project_id=project_id,
        alert_type=f"SENTINEL_{alert_type}",
        severity="CRITICAL",
        risk_score=0.9,
        description=message,
        created_at=datetime.now(UTC)
    )
    db.add(alert)
    db.commit()
    
    publish_event(
        EventType.HIGH_RISK_ALERT,
        {
            "type": "SENTINEL",
            "subtype": alert_type,
            "message": message,
            "project_id": project_id
        },
        project_id=project_id
    )
    logger.warning(f"Sovereign Sentinel Alert for {project_id}: {alert_type}")
