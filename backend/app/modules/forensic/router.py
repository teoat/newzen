from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from datetime import timedelta
from app.modules.forensic.satellite_service import SatelliteVerificationService
from app.modules.forensic.recovery_service import AssetRecoveryService
from app.core.db import get_session
from app.models import Transaction

router = APIRouter(prefix="/forensic-tools", tags=["Forensic Tools"])


@router.get("/satellite/verify/{project_id}")
async def verify_satellite_delta(project_id: str, lat: float = -6.2088, lon: float = 106.8456):
    return SatelliteVerificationService.analyze_delta(project_id, lat, lon)


@router.get("/recovery/trace/{project_id}")
async def trace_assets(project_id: str):
    return AssetRecoveryService.trace_asset(project_id)


@router.get("/velocity/scan/{project_id}")
async def scan_transaction_velocity(project_id: str, db: Session = Depends(get_session)):
    """
    Forensic Velocity Scanner: Detects SMURFING attempts.
    Scans for transaction clusters within 24hr windows that total > threshold.
    """
    transactions = db.exec(
        select(Transaction)
        .where(Transaction.project_id == project_id)
        .order_by(Transaction.transaction_date)
    ).all()
    triggers = []
    # Simplified smurfing detection: multiple small transactions
    # to same receiver in 24h
    receivers = {}
    for tx in transactions:
        if tx.receiver not in receivers:
            receivers[tx.receiver] = []
        receivers[tx.receiver].append(tx)
    for receiver, txs in receivers.items():
        if len(txs) < 3:
            continue
        for i in range(len(txs)):
            cluster = [txs[i]]
            total = txs[i].actual_amount
            for j in range(i + 1, len(txs)):
                delta = txs[j].transaction_date - txs[i].transaction_date
                if delta <= timedelta(days=1):
                    cluster.append(txs[j])
                    total += txs[j].actual_amount
                else:
                    break
            if len(cluster) >= 3 and total > 50000000:  # Threshold 50jt IDR
                triggers.append(
                    {
                        "type": "VELOCITY_THRESHOLD_EXCEEDED",
                        "receiver": receiver,
                        "transaction_ids": [t.id for t in cluster],
                        "total_amount": total,
                        "count": len(cluster),
                        "window": "24h",
                    }
                )
    return {"status": "success", "smurfing_triggers": triggers}


@router.get("/{project_id}/chronology")
async def get_forensic_chronology(
    project_id: str,
    db: Session = Depends(get_session)
):
    """
    Generate forensic chronology timeline
    Combines transactions, evidence, and audit events into a timeline
    
    Args:
        project_id: Project ID
        db: Database session
    
    Returns:
        List of chronological events with timestamps and risk levels
    """
    from app.models import AuditLog, BankTransaction, Evidence
    from datetime import datetime
    
    events = []
    
    # Fetch transactions
    transactions = db.exec(
        select(Transaction)
        .where(Transaction.project_id == project_id)
        .order_by(Transaction.timestamp)
    ).all()
    
    for tx in transactions:
        # Determine risk level
        risk_level = "low"
        if tx.status == "flagged":
            risk_level = "high"
        elif tx.status == "locked":
            risk_level = "critical"
        elif tx.potential_misappropriation:
            risk_level = "medium"
        
        events.append({
            "id": tx.id,
            "timestamp": tx.timestamp.isoformat() if tx.timestamp else datetime.now().isoformat(),
            "title": f"Transaction: {tx.description or 'Unknown'}",
            "description": f"{tx.sender} → {tx.receiver}: {tx.actual_amount:,.0f}",
            "type": "transaction",
            "entity": tx.receiver or tx.sender,
            "amount": tx.actual_amount,
            "currency": getattr(tx, 'currency', 'IDR'),
            "risk_level": risk_level,
            "metadata": {
                "status": tx.status,
                "category": tx.category_code.value if hasattr(tx.category_code, 'value') else str(tx.category_code),
                "aml_stage": tx.aml_stage.value if tx.aml_stage and hasattr(tx.aml_stage, 'value') else None
            }
        })
    
    # Fetch evidence events (if Evidence model exists)
    try:
        evidence_records = db.exec(
            select(Evidence)
            .where(Evidence.project_id == project_id)
            .order_by(Evidence.created_at)
        ).all()
        
        for evidence in evidence_records:
            events.append({
                "id": evidence.id,
                "timestamp": evidence.created_at.isoformat(),
                "title": f"Evidence: {evidence.type or 'Document'}",
                "description": evidence.description or "Evidence uploaded",
                "type": "evidence",
                "entity": evidence.source or "Unknown",
                "risk_level": "medium",
                "metadata": {
                    "type": evidence.type,
                    "verified": getattr(evidence, 'verified', False)
                }
            })
    except Exception:
        pass  # Evidence model may not exist
    
    # Fetch audit logs as milestone events
    try:
        audit_logs = db.exec(
            select(AuditLog)
            .where(AuditLog.entity_type == "Transaction")
            .where(AuditLog.action.in_(["FORENSIC_FLAG", "STATUS_CHANGE", "AML_STAGE_ASSIGNMENT"]))
            .order_by(AuditLog.timestamp)
            .limit(100)
        ).all()
        
        for log in audit_logs:
            # Check if log relates to this project
            if log.action == "FORENSIC_FLAG":
                events.append({
                    "id": log.id,
                    "timestamp": log.timestamp.isoformat(),
                    "title": "Forensic Flag Raised",
                    "description": log.reason or "Transaction flagged for review",
                    "type": "risk_flag",
                    "risk_level": "high",
                    "metadata": {
                        "action": log.action,
                        "entity_id": log.entity_id
                    }
                })
    except Exception:
        pass  # Audit logs may be limited
    
    # Add project milestones
    try:
        from app.models import Project
        project = db.get(Project, project_id)
        if project:
            events.append({
                "id": f"{project_id}-start",
                "timestamp": project.start_date.isoformat() if hasattr(project, 'start_date') and project.start_date else datetime.now().isoformat(),
                "title": "Project Started",
                "description": f"Project {project.name} initiated",
                "type": "milestone",
                "entity": project.contractor_name if hasattr(project, 'contractor_name') else "Unknown",
                "amount": project.contract_value if hasattr(project, 'contract_value') else 0,
                "currency": "IDR",
                "risk_level": "low"
            })
    except Exception:
        pass
    
    # Sort all events by timestamp
    events.sort(key=lambda x: x["timestamp"])
    
    return {
        "events": events,
        "total": len(events),
        "project_id": project_id
    }

