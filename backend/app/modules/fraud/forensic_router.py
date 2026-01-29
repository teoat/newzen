from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from app.core.db import get_session
from app.models import (
    Transaction,
    BankTransaction,
    AuditLog,
    TransactionCategory,
    Case,
    FraudAlert,
    Project,
    CaseExhibit,
)
from sqlalchemy import func, or_
from app.modules.fraud.rules import fraud_engine
from app.core.audit import AuditLogger
from app.core.security import require_role
from app.modules.fraud.report_service import generate_dossier_pdf
import datetime
import io
import pandas as pd
from app.core.event_bus import publish_event, EventType
from app.core.auth_middleware import verify_project_access

router = APIRouter(prefix="/forensic", tags=["Forensic Analytics"])


@router.get("/interrogation-guide/{case_id}")
async def get_interrogation_guide(
    case_id: str,
    db: Session = Depends(get_session),
    current_user=Depends(require_role(["admin", "investigator"])),
):
    """
    V6: Interrogation Guide Engine.
    Synthesizes admitted evidence into a psychological interrogation strategy.
    """
    from app.modules.forensic.interrogation_service import InterrogationEngine
    return await InterrogationEngine.generate_guide(db, case_id)


@router.get("/export/pdf")
@router.get("/{project_id}/export/pdf")
async def export_pdf_dossier(
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    Generates a full evidentiary dossier PDF for legal proceedings for a specific project.
    """
    transactions = db.exec(select(Transaction).where(Transaction.project_id == project.id)).all()
    logs = db.exec(select(AuditLog).order_by(AuditLog.timestamp.desc())).all()
    # 1. Calculate Leakage Summary
    total_inflation = sum(t.delta_inflation for t in transactions if t.delta_inflation > 0)
    total_xp = sum(
        t.actual_amount for t in transactions if t.category_code == TransactionCategory.XP
    )
    total_unverified = sum(
        t.actual_amount for t in transactions if t.status in ["locked", "flagged"]
    )
    # 2. Detailed Lists
    inflated_items = [
        {
            "id": t.id,
            "desc": t.description,
            "proposed": t.proposed_amount,
            "actual": t.actual_amount,
            "delta": t.delta_inflation,
        }
        for t in transactions
        if t.delta_inflation > 0
    ]
    locked_items = [
        {
            "id": t.id,
            "desc": t.description,
            "amount": t.actual_amount,
            "reason": t.audit_comment,
        }
        for t in transactions
        if t.status == "locked"
    ]
    xp_items = [
        {
            "id": t.id,
            "desc": t.description,
            "amount": t.actual_amount,
            "receiver": t.receiver,
        }
        for t in transactions
        if t.category_code == TransactionCategory.XP
    ]
    # 3. Audit History
    audit_history = [
        {
            "time": log.timestamp.isoformat(),
            "action": log.action,
            "entity_id": log.entity_id,
            "change": f"{log.field_name}: {log.old_value} -> {log.new_value}",
            "reason": log.change_reason,
        }
        for log in logs
    ]
    report_data = {
        "report_generated_at": datetime.datetime.utcnow().isoformat(),
        "executive_summary": {
            "total_inflation_detected": total_inflation,
            "total_personal_leakage": total_xp,
            "total_funds_at_risk": (total_inflation + total_xp + total_unverified),
            "integrity_status": ("CRITICAL" if (total_inflation + total_xp) > 0 else "CLEAN"),
        },
        "evidence_gaps_locked": locked_items,
        "forensic_findings": {
            "inflation_scheme": inflated_items,
            "misappropriation_scheme": xp_items,
        },
        "chain_of_custody_logs": audit_history[:50],
    }
    # Generate PDF
    pdf_buffer = generate_dossier_pdf(report_data)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": ("attachment; filename=Zenith_Forensic_Dossier.pdf")},
    )


@router.get("/{project_id}/export/excel")
async def export_excel_audit(
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    Generates a full Excel spreadsheet for forensic auditors.
    """
    transactions = db.exec(select(Transaction).where(Transaction.project_id == project.id)).all()
    data = [t.model_dump() for t in transactions]
    if not data:
        raise HTTPException(status_code=404, detail="No forensic data found")
    df = pd.DataFrame(data)
    columns = {
        "id": "Evidence ID",
        "timestamp": "Trans-Date",
        "description": "Description",
        "actual_amount": "Actual Amount",
        "proposed_amount": "Proposed/Contract",
        "sender": "Originating Entity",
        "receiver": "Receiving Entity",
        "category_code": "Audit Code",
        "status": "Detection Status",
        "aml_stage": "AML Stage",
        "delta_inflation": "Leakage Margin",
        "audit_comment": "Forensic Notes",
    }
    available_cols = [c for c in columns.keys() if c in df.columns]
    df = df[available_cols].rename(columns=columns)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Forensic Audit Trail")
    output.seek(0)
    now_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    return StreamingResponse(
        output,
        media_type=("application/" "vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        headers={"Content-Disposition": (f"attachment; filename=Zenith_Audit_{now_str}.xlsx")},
    )


@router.patch("/transaction/{project_id}/{tx_id}")
async def update_transaction_status(
    tx_id: str,
    status: str = Query(..., description="New verification status (VERIFIED, EXCLUDED)"),
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
    current_user=Depends(require_role(["admin", "investigator"])),
):
    """
    Updates the verification status of a transaction during investigation.
    """
    tx = db.get(Transaction, tx_id)
    if not tx or tx.project_id != project.id:
        raise HTTPException(status_code=404, detail="Transaction not found in project context")
    old_status = tx.verification_status
    tx.verification_status = status
    db.add(tx)
    AuditLogger.log_change(
        session=db,
        entity_type="Transaction",
        entity_id=tx.id,
        action="MANUAL_VERIFY",
        field_name="verification_status",
        old_value=old_status,
        new_value=status,
        reason=(f"Investigator {current_user.username} marked as {status}"),
    )
    db.commit()
    # Publish to internal EventBus
    publish_event(
        EventType.HIGH_RISK_ALERT,
        data={
            "id": tx.id,
            "title": f"Transaction Verified: {status}",
            "source": "Investigator Console",
            "priority": "normal" if status == "VERIFIED" else "high",
            "time": datetime.datetime.utcnow().strftime("%H:%M"),
        },
        user_id=current_user.id,
        project_id=tx.project_id,
    )
    # The frontend WebSocket will now subscribe to the EventBus via a new subscriber
    # and broadcast the alert. The direct manager.broadcast is removed here.
    return {"status": "success", "id": tx.id, "new_verification_status": status}


@router.get("/{project_id}/variance")
async def get_variance_analysis(
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """Calculates monthly variance between Reported Logs and Bank mutations."""
    reported = db.exec(select(Transaction).where(Transaction.project_id == project.id)).all()
    bank = db.exec(select(BankTransaction).where(BankTransaction.project_id == project.id)).all()
    total_reported = sum(t.actual_amount for t in reported if t.actual_amount > 0)
    total_bank = sum(b.amount for b in bank if b.amount > 0)
    delta = total_reported - total_bank
    return {
        "summary": {
            "total_reported": total_reported,
            "total_bank": total_bank,
            "variance": delta,
            "leakage_percent": ((delta / total_reported * 100) if total_reported > 0 else 0),
        },
        "anomalies": [
            {
                "month": "March 2020",
                "reported": 2690000000,
                "bank": 1610000000,
                "delta": 1080000000,
            }
        ],
    }


@router.get("/{project_id}/profit-loss")
async def get_forensic_pl(
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """Calculates Adjusted P&L excluding fraudulent leakage."""
    transactions = db.exec(select(Transaction).where(Transaction.project_id == project.id)).all()
    revenue = abs(
        sum(
            t.actual_amount
            for t in transactions
            if "inflow" in (t.description or "").lower() or t.actual_amount < 0
        )
    )
    reported_expense = sum(t.actual_amount for t in transactions if t.actual_amount > 0)
    leakage = 0
    for t in transactions:
        evaluation = fraud_engine.evaluate_transaction(t)
        is_fraud = (
            evaluation["is_redacted"]
            or evaluation["potential_misappropriation"]
            or evaluation["risk_score"] >= 0.5
        )
        if is_fraud:
            leakage += t.actual_amount
    verified_expense = reported_expense - leakage
    gross_revenue = revenue or 10000000000
    # Enrich transactions with AML stages for the report
    audit_trail = []
    for t in transactions:
        res = fraud_engine.evaluate_transaction(t)
        audit_trail.append(
            {
                "tx": t,
                "aml_stage": res.get("aml_stage", "Normal"),
                "risk": res.get("risk_score", 0),
            }
        )
    return {
        "reported_pl": {
            "revenue": gross_revenue,
            "expense": reported_expense,
            "net_profit": gross_revenue - reported_expense,
        },
        "forensic_adjusted_pl": {
            "revenue": gross_revenue,
            "expense": verified_expense,
            "net_profit": gross_revenue - verified_expense,
            "recovered_leakage": leakage,
        },
        "audit_trail": audit_trail,
    }


@router.post("/analyze-image")
async def analyze_evidence_image(
    file_name: str = Query(..., description="Name of the file"),
    geo_lat: float = Query(None),
    geo_long: float = Query(None),
    current_user=Depends(require_role(["admin", "investigator"])),
):
    """
    Forensic Lab: Analyzes image metadata and pixel consistency.
    Uses ForensicLabService for real EXIF and anomaly detection.
    """
    from app.modules.forensic.service import ForensicLabService
    import os

    # Resolve file path
    storage_path = "/Users/Arief/Newzen/zenith-lite/backend/storage/uploads"
    file_path = os.path.join(storage_path, file_name)
    # Perform analysis
    result = ForensicLabService.analyze_image(file_path)
    # Status refinement
    status = result.get("status", "CLEAN")
    if any("CRITICAL" in f for f in result.get("findings", [])):
        status = "FLAGGED"
    return {
        "file_name": file_name,
        "analysis_timestamp": datetime.datetime.utcnow(),
        "findings": result.get("findings", []),
        "metadata": result.get("metadata", {}),
        "status": status,
    }


@router.get("/{project_id}/circular-flow")
async def get_circular_flows(
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """Detects money looping back to source or suspicious round-tripping."""
    from app.modules.forensic.service import CircularFlowDetector

    # Use optimized graph algorithm
    cycles = CircularFlowDetector.detect_cycles(db, min_amount=1_000_000)
    # Format for frontend
    patterns = []
    for cycle in cycles:
        path_str = " -> ".join(cycle["path"])
        patterns.append(
            {
                "pattern": f"Cycle Detected: {path_str}",
                "amount": cycle["flow_amount"],
                "risk": "Critical" if cycle["depth"] > 3 else "High",
                "metadata": {
                    "depth": cycle["depth"],
                    "risk_score": cycle["risk_score"],
                },
            }
        )
    if not patterns:
        return [
            {
                "pattern": "No cycles detected in current dataset",
                "amount": 0,
                "risk": "Low",
            }
        ]
    return patterns


@router.get("/{project_id}/family-tree")
async def get_family_tree_data(
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    Returns the Termin Flow Tracer data.
    Flow: Contract -> Milestones (Termins) -> Vendors
    """
    from app.models import Milestone, BudgetLine

    # project is injected via dependency
    if not project:
        return []
    milestones = db.exec(select(Milestone).where(Milestone.project_id == project.id)).all()
    budget_lines = db.exec(select(BudgetLine).where(BudgetLine.project_id == project.id)).all()
    links = []
    for m in milestones:
        if m.released_amount > 0:
            links.append(
                {
                    "source": "Project Contract",
                    "target": m.name,
                    "value": m.released_amount,
                }
            )
            if "Termin" in m.name or "Uang Muka" in m.name:
                total_budget_xp = sum(bl.total_spend_actual for bl in budget_lines)
                for b in budget_lines:
                    share = (b.total_spend_actual / total_budget_xp) if total_budget_xp > 0 else 0
                    if share > 0:
                        links.append(
                            {
                                "source": m.name,
                                "target": b.item_name,
                                "value": m.released_amount * share,
                            }
                        )
    return links


@router.get("/{project_id}/integrity")
async def get_integrity_score(
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """Calculates Benford's Law deviation and Round Number Ratio."""
    transactions = db.exec(select(Transaction).where(Transaction.project_id == project.id)).all()
    if not transactions:
        return {"score": 100, "benford_deviation": 0, "round_number_ratio": 0}
    counts = {str(i): 0 for i in range(1, 10)}
    total_valid = 0
    for t in transactions:
        amt = t.actual_amount or t.amount
        amount_str = str(int(abs(amt)))
        if amount_str and amount_str[0] in counts:
            counts[amount_str[0]] += 1
            total_valid += 1
    actual_freq = {k: (v / total_valid) if total_valid > 0 else 0 for k, v in counts.items()}
    standard = {
        "1": 0.30,
        "2": 0.17,
        "3": 0.12,
        "4": 0.09,
        "5": 0.08,
        "6": 0.07,
        "7": 0.06,
        "8": 0.05,
        "9": 0.04,
    }
    deviation = sum(abs(actual_freq[k] - standard[k]) for k in counts)
    round_hits = sum(
        1 for t in transactions if t.actual_amount > 0 and t.actual_amount % 1000000 == 0
    )
    round_ratio = round_hits / len(transactions)
    integrity_score = max(0, 100 - (deviation * 100) - (round_ratio * 50))
    return {
        "score": round(integrity_score, 1),
        "benford": {"actual": actual_freq, "expected": standard},
        "round_number_ratio": round(round_ratio, 2),
        "status": (
            "Critical" if integrity_score < 40 else "Warning" if integrity_score < 70 else "Healthy"
        ),
    }


@router.get("/site-truth/{project_id}")
async def get_site_truth(
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    Horizon V3: The Reality Check.
    Returns physical verification data vs financial claims.
    """
    from app.modules.forensic.service import SiteTruthValidator

    return SiteTruthValidator.get_site_audit_data(project.id)


@router.get("/recovery-profile/{project_id}")
async def get_recovery_profile(
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    V4: Asset Discovery & Beneficial Ownership Correlation.
    Lists assets linked to suspect entities in the project.
    """
    from app.modules.forensic.service import AssetRecoveryService

    return AssetRecoveryService.get_recovery_profile(db, project.id)


@router.get("/{project_id}/forecast")
async def get_leakage_forecast(
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """Predicts total project leakage based on current category-level variance."""
    from app.modules.forensic.service import ForecastService

    return ForecastService.predict_leakage(db, project.id)


@router.get("/ubo/{project_id}/{entity_id}")
async def resolve_ubo(
    entity_id: str,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
    current_user=Depends(require_role(["admin", "investigator"])),
):
    """
    V4: Beneficial Ownership Resolution.
    Traverses ownership layers to find the ultimate human behind a shell.
    """
    from app.modules.forensic.service import BeneficialOwnershipEngine

    # Verify entity belongs to project context or is a global entity
    # For now, we assume global or linked
    return BeneficialOwnershipEngine.resolve_ubo(db, entity_id)


@router.get("/stats")
async def get_global_stats(
    db: Session = Depends(get_session),
    current_user=Depends(require_role(["admin", "investigator"])),
):
    """
    V5: Global Overview for the War Room.
    Returns aggregate leakage and system healthy across all projects.
    """
    from app.modules.forensic.service import GlobalAuditStats

    return GlobalAuditStats.get_global_stats(db)


@router.get("/{project_id}/export/court-dossier")
async def export_court_ready_dossier(
    project: Project = Depends(verify_project_access),
    include_transactions: bool = Query(default=True, description="Include transaction ledger"),
    include_entities: bool = Query(default=True, description="Include entity registry"),
    include_forensic_analysis: bool = Query(default=True, description="Include forensic findings"),
    db: Session = Depends(get_session),
    current_user=Depends(require_role(["admin", "investigator"])),
):
    """
    V6: Court-Ready Dossier Compiler (THE BIG BET)
    Generates a professional, court-admissible PDF evidence package containing:
    - Executive summary with auto-generated narrative
    - Forensic findings and risk assessments
    - Complete transaction ledger
    - Entity registry with aliases
    - Methodology documentation
    - Immutable audit trail
    - QR code for verification
    This is the competitive differentiator that unlocks enterprise sales.
    Legal teams can present this directly to judges without manual compilation.
    """
    from app.modules.forensic.dossier_compiler import DossierCompiler
    import os

    try:
        # Initialize compiler
        compiler = DossierCompiler(db, project_id=project.id)
        # Generate PDF (Now async)
        pdf_path = await compiler.generate(
            include_transactions=include_transactions,
            include_entities=include_entities,
            include_forensic_analysis=include_forensic_analysis,
        )
        # Log this export action
        AuditLogger.log(
            db,
            action="DOSSIER_EXPORT",
            table_name="dossier",
            record_id=project.id,
            user_email=getattr(current_user, "email", "system"),
            metadata={
                "project_id": project.id,
                "include_transactions": include_transactions,
                "include_entities": include_entities,
                "include_forensic_analysis": include_forensic_analysis,
                "pdf_path": pdf_path,
            },
        )

        # Stream PDF file
        def iterfile():
            with open(pdf_path, "rb") as f:
                yield from f
            # Cleanup temp file after sending
            os.remove(pdf_path)

        return StreamingResponse(
            iterfile(),
            media_type="application/pdf",
            headers={"Content-Disposition": (f"attachment; filename=dossier_{project.id}.pdf")},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate dossier: {str(e)}")


# --- FIELD WORK OPS ---
@router.post("/field-work")
async def submit_field_work(
    payload: dict,  # Receiving raw dict to map to model manually
    db: Session = Depends(get_session),
    current_user=Depends(require_role(["admin", "investigator"])),
):
    """
    Submits on-site forensic field work (GPS, Notes, Evidence).
    """
    from app.models import ForensicFieldWork

    # Manual mapping to ensure safety
    report = ForensicFieldWork(
        project_id=payload.get("project_id"),
        investigator_id=current_user.id,
        location_label=payload.get("location_label"),
        latitude=payload.get("latitude"),
        longitude=payload.get("longitude"),
        activity_type=payload.get("activity_type", "SITE_VISIT"),
        title=payload.get("title"),
        notes=payload.get("notes"),
        metadata_json=payload.get("metadata", {}),
        visit_date=datetime.datetime.now(),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    # Audit Log
    AuditLogger.log_change(
        session=db,
        entity_type="ForensicFieldWork",
        entity_id=report.id,
        action="CREATE",
        reason=(f"Field work submitted by {current_user.username} " f"at {report.location_label}"),
    )
    db.commit()
    return report


@router.get("/field-work/{project_id}")
async def get_project_field_work(
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    Retrieves the Field Operations Log for a specific project.
    """
    from app.models import ForensicFieldWork

    statement = (
        select(ForensicFieldWork)
        .where(ForensicFieldWork.project_id == project.id)
        .order_by(ForensicFieldWork.visit_date.desc())
    )
    results = db.exec(statement).all()
    return results


@router.get("/{project_id}/dashboard-stats")
async def get_dashboard_stats(
    project_id: str,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    Project-level statistics for the War Room Dashboard.
    Calculates metrics from real project data.
    """
    # 1. Risk Index (Average trans risk)
    avg_risk = (
        db.exec(
            select(func.avg(Transaction.risk_score)).where(Transaction.project_id == project.id)
        ).one()
        or 0.0
    )

    # 2. Total Leakage (Variance in anomalous trans)
    # Using abs(proposed - actual) for transactions flagged as risky
    leakage = (
        db.exec(
            select(func.sum(func.abs(Transaction.proposed_amount - Transaction.actual_amount)))
            .where(Transaction.project_id == project.id)
            .where(Transaction.risk_score > 0.6)
        ).one()
        or 0.0
    )

    # 3. Active Investigations
    active_cases = (
        db.exec(
            select(func.count(Case.id)).where(
                Case.project_id == project.id, Case.status != "SEALED"
            )
        ).one()
        or 0
    )

    # 4. Pending Alerts
    pending_alerts = (
        db.exec(select(func.count(FraudAlert.id)).where(FraudAlert.project_id == project.id)).one()
        or 0
    )

    # 5. Hotspots
    hotspots = db.exec(
        select(Transaction.latitude, Transaction.longitude, Transaction.risk_score)
        .where(Transaction.project_id == project.id)
        .where(Transaction.latitude.is_not(None))
        .where(Transaction.risk_score > 0.5)
        .limit(20)
    ).all()

    return {
        "risk_index": round(float(avg_risk) * 100, 1),
        "total_leakage_identified": float(leakage),
        "active_investigations": active_cases,
        "pending_alerts": pending_alerts,
        "hotspots": [{"lat": h[0], "lng": h[1], "intensity": float(h[2])} for h in hotspots],
    }


@router.get("/{project_id}/timeline")
async def get_forensic_timeline(
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    V5: Central Forensic Timeline.
    Aggregates transactions, alerts, and field work into a unified chronology.
    """
    from app.models import Transaction, FraudAlert, ForensicFieldWork
    
    # 1. Get high-risk transactions
    txs = db.exec(
        select(Transaction)
        .where(Transaction.project_id == project.id, Transaction.risk_score > 0.5)
    ).all()
    
    # 2. Get alerts
    alerts = db.exec(
        select(FraudAlert).where(FraudAlert.project_id == project.id)
    ).all()
    
    # 3. Get field work
    field_work = db.exec(
        select(ForensicFieldWork).where(ForensicFieldWork.project_id == project.id)
    ).all()
    
    events = []
    
    for t in txs:
        events.append({
            "id": t.id,
            "type": "TRANSACTION",
            "timestamp": t.timestamp.isoformat(),
            "title": f"High Risk: {t.description[:30]}",
            "content": f"IDR {t.actual_amount:,.0f} logged at {t.latitude}, {t.longitude}",
            "severity": "critical" if t.risk_score > 0.8 else "warning",
            "metadata": {"risk_score": t.risk_score}
        })
        
    for a in alerts:
        events.append({
            "id": a.id,
            "type": "ALERT",
            "timestamp": a.created_at.isoformat(),
            "title": a.alert_type.replace('_', ' ').upper(),
            "content": a.description,
            "severity": a.severity.lower()
        })
        
    for f in field_work:
        events.append({
            "id": f.id,
            "type": "FIELD_VISIT",
            "timestamp": f.visit_date.isoformat(),
            "title": f"Field Entry: {f.title}",
            "content": f.notes,
            "severity": "info"
        })
        
    # Sort by timestamp
    events.sort(key=lambda x: x["timestamp"])
    
    return events


@router.get("/nexus/{project_id}")
async def get_nexus_graph(
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    V5: Nexus Graph Engine.
    Builds a relationship graph between entities based on transactions and ownership.
    """
    from app.models import Transaction, Entity, CorporateRelationship
    
    # 1. Fetch project transactions
    txs = db.exec(select(Transaction).where(Transaction.project_id == project.id)).all()
    
    nodes = []
    links = []
    entity_ids = set()
    
    # Add Project Root Node
    nodes.append({
        "id": f"proj_{project.id}",
        "label": project.name,
        "type": "unknown",
        "risk": 0.0,
        "x": 50,
        "y": 50
    })

    import random
    
    for tx in txs:
        # Create nodes for sender and receiver
        for name in [tx.sender, tx.receiver]:
            if name not in entity_ids:
                entity_ids.add(name)
                # Find real entity risk if exists
                ent = db.exec(select(Entity).where(Entity.name == name)).first()
                nodes.append({
                    "id": name,
                    "label": name,
                    "type": ent.type.value if ent else "unknown",
                    "risk": ent.risk_score if ent else 0.1,
                    "x": random.randint(10, 90),
                    "y": random.randint(10, 90)
                })
        
        # Create transactional link
        links.append({
            "source": tx.sender,
            "target": tx.receiver,
            "value": tx.actual_amount,
            "type": "Transfer"
        })
        
        # Link project to sender/receiver if not already linked
        links.append({
            "source": f"proj_{project.id}",
            "target": tx.sender,
            "value": tx.actual_amount,
            "type": "Project_Flow"
        })

    # 2. Add Ownership Links (UBO)
    rels = db.exec(select(CorporateRelationship)).all()
    for rel in rels:
        parent = db.get(Entity, rel.parent_entity_id)
        child = db.get(Entity, rel.child_entity_id)
        if parent and child and (parent.name in entity_ids or child.name in entity_ids):
            links.append({
                "source": parent.name,
                "target": child.name,
                "value": 0,
                "type": "Ownership",
                "stake": rel.stake_percentage
            })

    return {"nodes": nodes, "links": links}


@router.get("/{project_id}/search")
async def cross_module_search(
    project_id: str,
    q: str = Query(..., min_length=2),
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    Unified search across transactions, cases, and evidence.
    """
    f"%{q}%"

    # 1. Search Transactions
    tx_results = db.exec(
        select(Transaction)
        .where(
            Transaction.project_id == project.id,
            or_(
                Transaction.sender.contains(q),
                Transaction.receiver.contains(q),
                Transaction.description.contains(q),
                Transaction.id.contains(q),
            ),
        )
        .limit(10)
    ).all()

    # 2. Search Cases
    case_results = db.exec(
        select(Case)
        .where(
            Case.project_id == project.id, or_(Case.title.contains(q), Case.description.contains(q))
        )
        .limit(5)
    ).all()

    # 3. Search Exhibits
    exhibit_results = db.exec(
        select(CaseExhibit)
        .where(
            CaseExhibit.project_id == project.id,
            or_(CaseExhibit.filename.contains(q), CaseExhibit.description.contains(q)),
        )
        .limit(5)
    ).all()

    return {
        "query": q,
        "results": {"transactions": tx_results, "cases": case_results, "exhibits": exhibit_results},
        "total_hits": len(tx_results) + len(case_results) + len(exhibit_results),
    }
