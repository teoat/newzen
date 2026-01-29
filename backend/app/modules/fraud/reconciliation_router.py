from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from datetime import datetime, timedelta
from app.core.db import get_session
from app.core.event_bus import publish_event, EventType
from app.models import (
    Transaction,
    ReconciliationMatch,
    BankTransaction,
    TransactionCategory,
    AuditLog,
    AMLStage,
    ReconciliationSettings,
)
from app.core.audit import AuditLogger
from app.core.reconciliation_intelligence import (
    VendorMatcher,
    ConfidenceCalculator,
    extract_all_references,
)
from app.modules.forensic.service import GeographicValidator
from thefuzz import fuzz
from app.core.auth_middleware import verify_project_access
from app.models import Project

from app.core.sync import manager
from app.core.global_memory import GlobalMemoryService

router = APIRouter(prefix="/reconciliation", tags=["Reconciliation"])


def detect_forensic_triggers(tx: Transaction, db: Session):
    """
    Analyzes transaction fields for forensic red flags.
    Returns a list of trigger descriptions.
    """
    triggers = []
    # 1. Inflation Detection (Penggelembungan)
    if tx.proposed_amount > tx.actual_amount:
        tx.delta_inflation = tx.proposed_amount - tx.actual_amount
        triggers.append(f"Penggelembungan: {tx.delta_inflation} IDR variance")
        tx.status = "flagged"
        tx.aml_stage = AMLStage.PLACEMENT  # Potential attempt to inflate expenses
    # 2. Evidence Gaps
    keywords_needs_proof = ["BUTUH BUKTI", "tidak ada kwitansi", "cek penggunaan"]
    if tx.audit_comment and any(kw in tx.audit_comment.upper() for kw in keywords_needs_proof):
        tx.needs_proof = True
        tx.status = "locked"
        triggers.append("Evidence Gap: Entry is locked until proof is provided.")
        tx.aml_stage = AMLStage.PLACEMENT  # Lack of proof can indicate placement
    # 3. Personal Leakage Quarantine (XP)
    personal_keywords = ["KELUARGA", "PRIBADI", "LORLUN", "SAUDARA", "REK SENDIRI"]
    desc_upper = (tx.description or "").upper()
    audit_upper = (tx.audit_comment or "").upper()
    if (
        tx.category_code == TransactionCategory.XP
        or any(kw in desc_upper for kw in personal_keywords)
        or any(kw in audit_upper for kw in personal_keywords)
    ):
        tx.potential_misappropriation = True
        tx.category_code = TransactionCategory.XP
        triggers.append("Personal Leakage: Quarantined from Project P&L.")
        tx.aml_stage = AMLStage.PLACEMENT  # Direct personal use is a form of placement
    # 4. "Ngarang" detection
    if tx.audit_comment and "NGARANG" in tx.audit_comment.upper():
        tx.status = "flagged"
        triggers.append("Forensic Red Flag: Entry marked as 'Ngarang' (Invented).")
        tx.aml_stage = AMLStage.LAYERING  # Invented entries are often used to obscure origin
    # 5. Fuzzy Duplicate Detection (100% Detection of Double-Entry)
    if tx.description:
        # Window: +/- 48 hours
        time_window = timedelta(hours=48)
        stm = select(Transaction).where(
            Transaction.id != tx.id,
            Transaction.timestamp >= tx.timestamp - time_window,
            Transaction.timestamp <= tx.timestamp + time_window,
        )
        nearby_txs = db.exec(stm).all()
        for other in nearby_txs:
            if not other.description:
                continue
            # Ratio check
            similarity = fuzz.ratio(tx.description.lower(), other.description.lower())
            # If high text similarity AND similar amount (within 5%)
            if similarity > 85:
                amount_diff = abs(tx.actual_amount - other.actual_amount)
                if amount_diff < (tx.actual_amount * 0.05):
                    tx.status = "flagged"
                    tx.is_circular = True  # Reusing existing flag for loop/dup
                    triggers.append(
                        f"Potential Duplicate: {similarity}% match with '{other.description}' ({other.actual_amount})"
                    )
                    tx.aml_stage = AMLStage.LAYERING  # Duplicates are a common layering technique
                    break
    # 6. Velocity and Channel Analysis (Phase 2 Enhancement)
    if tx.receiver and tx.receiver.upper() not in ["UNKNOWN", "CASH", "NA", ""]:
        # Velocity Window: +/- 24 hours (Total 48h window)
        v_window = timedelta(hours=24)
        v_stm = select(Transaction).where(
            Transaction.receiver == tx.receiver,
            Transaction.timestamp >= tx.timestamp - v_window,
            Transaction.timestamp <= tx.timestamp + v_window,
            Transaction.id != tx.id,
        )
        velocity_cluster = db.exec(v_stm).all()
        # Velocity Threshold: > 3 transactions to same receiver
        if len(velocity_cluster) >= 3:
            tx.status = "flagged"
            tx.aml_stage = AMLStage.LAYERING
            triggers.append(
                f"Velocity Risk: {len(velocity_cluster) + 1} transfers to '{tx.receiver}' in 48h period."
            )
    # 7. Channel & Structuring Risk
    desc_u = (tx.description or "").upper()
    # 7a. Cash Threshold
    if ("CASH" in desc_u or "TUNAI" in desc_u) and tx.actual_amount > 100_000_000:
        tx.status = "flagged"
        tx.aml_stage = AMLStage.PLACEMENT
        triggers.append(f"Channel Risk: Large CASH transaction ({tx.actual_amount:,.0f} IDR).")
    # 7b. Smurfing / Structuring (Values just below reporting limits)
    # Common typology: Breaking large sums into chunks < 100M
    if 90_000_000 <= tx.actual_amount < 100_000_000:
        triggers.append(
            "Structuring Risk: Amount is suspiciously close to 100M reporting threshold."
        )
    # 8. Geographic Proximity & Impossible Travel (Phase 3)
    try:
        geo_violations = GeographicValidator.validate_proximity(db, tx)
        for violation in geo_violations:
            tx.status = "flagged"
            triggers.append(violation)
            tx.aml_stage = (
                AMLStage.INTEGRATION
            )  # Geo mismatches often suggest integration anomalies
    except Exception as e:
        print(f"Geo validation failed: {e}")

    # 9. Global Recidivism Detection (V6 Organization Brain)
    if tx.receiver:
        history = GlobalMemoryService.find_recidivist_entities(db, tx.receiver)
        other_projects = [h["project_id"] for h in history if h["project_id"] != tx.project_id]
        if other_projects:
            tx.status = "flagged"
            triggers.append(f"Global Risk: Recidivist Entity. Previous high-risk flags in projects: {', '.join(other_projects[:2])}")
            tx.aml_stage = AMLStage.INTEGRATION

    # --- Automated AML Stage Classification (Roadmap Fix) ---
    # If not already assigned by a specific trigger, check for general flags
    if tx.aml_stage is None and tx.status == "flagged":
        if tx.actual_amount > 50_000_000:  # Threshold for integration check
            tx.aml_stage = AMLStage.INTEGRATION
    # Persist triggers so they appear in UI
    if triggers:
        combined_triggers = "; ".join(triggers)
        # Avoid duplicate appending if re-scanned
        if not tx.mens_rea_description or combined_triggers not in tx.mens_rea_description:
            tx.mens_rea_description = (
                f"{combined_triggers} | {tx.mens_rea_description}"
                if tx.mens_rea_description
                else combined_triggers
            )
    return triggers


@router.get("/{project_id}/internal", response_model=List[Transaction])
async def get_internal_transactions(
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    return db.exec(select(Transaction).where(Transaction.project_id == project.id)).all()


@router.get("/{project_id}/bank", response_model=List[BankTransaction])
async def get_bank_transactions(
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    return db.exec(select(BankTransaction).where(BankTransaction.project_id == project.id)).all()


@router.post("/{project_id}/scan")
async def scan_all_transactions(
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """Re-runs forensic detection on all internal transactions for a project."""
    txs = db.exec(select(Transaction).where(Transaction.project_id == project.id)).all()
    count = 0
    scanned = 0
    for tx in txs:
        scanned += 1
        triggers = detect_forensic_triggers(tx, db)
        if triggers:
            count += 1
            db.add(tx)
    db.commit()
    return {"status": "success", "scanned": scanned, "flagged_count": count}


@router.post("/{project_id}/batch/internal")
async def ingest_internal_ledger(
    entries: List[dict],
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """Bulk ingest ledger entries (Expenses Journal)."""
    processed = 0
    for entry in entries:
        try:
            # Robust Coordinate Parsing
            lat = entry.get("latitude")
            lng = entry.get("longitude")
            geo = entry.get("geolocation")
            if geo and isinstance(geo, str) and "," in geo:
                parts = geo.split(",")
                lat = parts[0].strip()
                lng = parts[1].strip()
            tx = Transaction(
                project_id=project.id,
                proposed_amount=float(entry.get("proposed_amount", 0)),
                actual_amount=float(entry.get("actual_amount", 0)),
                amount=float(entry.get("actual_amount", 0)),
                sender=entry.get("sender", "Unknown"),
                receiver=entry.get("receiver", "Unknown"),
                description=entry.get("description", ""),
                category_code=entry.get("category_code", TransactionCategory.P),
                account_entity=entry.get("account_entity"),
                audit_comment=entry.get("audit_comment"),
                latitude=float(lat) if lat is not None and str(lat).strip() else None,
                longitude=float(lng) if lng is not None and str(lng).strip() else None,
                timestamp=(
                    datetime.fromisoformat(entry["timestamp"])
                    if "timestamp" in entry
                    else datetime.utcnow()
                ),
            )
            # Run immediate forensic check
            detect_forensic_triggers(tx, db)
            db.add(tx)
            processed += 1
        except Exception as e:
            print(f"Error ingesting entry: {e}")
            continue
    db.commit()
    return {"status": "success", "count": processed}


@router.post("/{project_id}/batch/bank")
async def ingest_bank_statement(
    mutations: List[dict],
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """Bulk ingest bank statement mutations."""
    processed = 0
    for mut in mutations:
        try:
            bank_tx = BankTransaction(
                project_id=project.id,
                amount=mut.get("amount", 0),
                bank_name=mut.get("bank_name", "BCA"),
                description=mut.get("description", ""),
                timestamp=(
                    datetime.fromisoformat(mut["timestamp"])
                    if "timestamp" in mut
                    else datetime.utcnow()
                ),
            )
            db.add(bank_tx)
            processed += 1
        except Exception as e:
            print(f"Error ingesting mutation: {e}")
            continue
    db.commit()
    return {"status": "success", "count": processed}


def detect_channel(description: str) -> str:
    """Detects clearing channel from bank description."""
    d = description.upper()
    if any(x in d for x in ["RTGS", "SKN", "KLIRING"]):
        return "RTGS"
    if any(x in d for x in ["BI-FAST", "BI FAST", "BIF"]):
        return "BI_FAST"
    if any(x in d for x in ["ATM", "TARIK TUNAI", "CDM"]):
        return "ATM"
    if any(x in d for x in ["CEK", "GIRO", "BG"]):
        return "CHECK"
    if any(x in d for x in ["USD", "EUR", "SWIFT", "TT", "VALAS"]):
        return "INT"
    return "UNKNOWN"


def get_channel_window(channel: str, default_days: int) -> int:
    """Returns clearing window in days based on channel."""
    if channel in ["RTGS", "BI_FAST"]:
        return 1
    if channel == "ATM":
        return 2
    if channel == "CHECK":
        return 7
    if channel == "INT":
        return 14
    return default_days


@router.get("/{project_id}/suggested", response_model=List[ReconciliationMatch])
async def get_suggested_matches(
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    Advanced Reconciliation Logic:
    1. Direct matching by amount (multi-currency aware) and date (dynamic windows).
    2. Semantic matching for descriptions using Gemini.
    3. 'Minimal Arus Uang' logic: aggregates V/P/F vouchers to match U (Bank) entries.
    """
    from app.core.reconciliation_intelligence import (
        CurrencyService, SemanticMatcher, VendorMatcher, 
        ConfidenceCalculator, extract_all_references
    )

    matches = []
    # Fetch eligible internal transactions (pending OR flagged for forensic review)
    internal_txs = db.exec(
        select(Transaction)
        .where(Transaction.project_id == project.id)
        .where(Transaction.status.in_(["pending", "flagged"]))
    ).all()
    # Fetch bank records
    bank_txs = db.exec(
        select(BankTransaction).where(BankTransaction.project_id == project.id)
    ).all()
    # Fetch user-configured settings or use defaults
    settings = db.exec(
        select(ReconciliationSettings).where(ReconciliationSettings.project_id == project.id)
    ).first()
    if not settings:
        settings = ReconciliationSettings(project_id=project.id)
    
    default_clearing_days = settings.clearing_window_days
    tolerance = settings.amount_tolerance_percent / 100.0
    batch_days = settings.batch_window_days

    for b_tx in bank_txs:
        # Detect Channel & Dynamic Window
        channel = detect_channel(b_tx.description or "")
        dynamic_window = get_channel_window(channel, default_clearing_days)

        # 1. Direct Match Logic
        for i_tx in internal_txs:
            # Multi-currency amount conversion
            b_amount_converted = b_tx.amount
            if i_tx.currency != b_tx.currency:
                rate = CurrencyService.get_rate(b_tx.currency, i_tx.currency)
                b_amount_converted = b_tx.amount * rate
            
            amount_variance = abs(i_tx.actual_amount - b_amount_converted)
            is_amount_match = amount_variance < 0.01 or (
                i_tx.actual_amount > 0 and (amount_variance / i_tx.actual_amount) < tolerance
            )

            if not is_amount_match:
                continue

            # Standardize dates
            i_date = i_tx.transaction_date or i_tx.timestamp
            b_date = b_tx.booking_date or b_tx.timestamp
            time_diff = abs(i_date - b_date)
            
            if time_diff > timedelta(days=dynamic_window):
                continue

            # Calculate match factors
            bank_refs = extract_all_references(b_tx.description or "")
            internal_refs = extract_all_references(i_tx.description or "")
            
            invoice_match = (
                internal_refs["invoice_ref"]
                and bank_refs["invoice_ref"]
                and internal_refs["invoice_ref"] == bank_refs["invoice_ref"]
            )
            
            batch_match = (
                i_tx.batch_reference
                and b_tx.batch_reference
                and i_tx.batch_reference == b_tx.batch_reference
            )
            
            vendor_sim = 0.0
            if i_tx.receiver and b_tx.description:
                vendor_sim, _ = VendorMatcher.calculate_similarity(i_tx.receiver, b_tx.description)

            # Amount Similarity
            if i_tx.actual_amount > 0:
                amount_sim = 1.0 - min(1.0, amount_variance / i_tx.actual_amount)
            else:
                amount_sim = 1.0 if amount_variance < 0.01 else 0.0

            # Semantic Description Matching (Gemini-Powered)
            semantic_sim = 0.0
            if i_tx.description and b_tx.description:
                semantic_sim = SemanticMatcher.calculate_similarity(i_tx.description, b_tx.description) * 100

            # Multi-factor confidence calculation
            confidence, tier = ConfidenceCalculator.calculate(
                amount_similarity=amount_sim,
                temporal_proximity_days=time_diff.days,
                vendor_similarity=vendor_sim,
                semantic_similarity=semantic_sim,
                invoice_match=invoice_match,
                batch_match=batch_match,
                risk_score=i_tx.risk_score or 0.0,
                match_type="direct",
            )

            # Build comprehensive reasoning
            reasoning_parts = [
                f"Amt±{amount_variance:.0f}",
                f"{time_diff.days}d (Window:{dynamic_window}d)",
                f"Channel:{channel}",
            ]
            if invoice_match: reasoning_parts.append(f"INV:{internal_refs['invoice_ref']}")
            if batch_match: reasoning_parts.append(f"BATCH:{i_tx.batch_reference}")
            if vendor_sim > 80: reasoning_parts.append(f"Vendor:{vendor_sim:.0f}%")
            if semantic_sim > 80: reasoning_parts.append(f"Semantic:{semantic_sim:.0f}%")
            reasoning_parts.append(tier)

            # Auto-confirmation flags
            auto_confirm_reason = "INVESTIGATE"
            if tier == "TIER_1_PERFECT":
                auto_confirm_reason = "AUTO_OK"
            elif tier == "TIER_2_STRONG" and (i_tx.risk_score or 0) < 0.3:
                auto_confirm_reason = "AUTO_OK"
            elif tier == "TIER_3_PROBABLE":
                auto_confirm_reason = "REVIEW"

            reasoning_parts.append(auto_confirm_reason)

            matches.append(ReconciliationMatch(
                internal_tx_id=i_tx.id,
                bank_tx_id=b_tx.id,
                confidence_score=confidence,
                match_type="direct",
                ai_reasoning=" | ".join(reasoning_parts),
            ))

        # 2. 'Minimal Arus Uang' (Aggregate) Logic
        vpf_txs = sorted(
            [t for t in internal_txs if t.category_code in [TransactionCategory.V, TransactionCategory.P, TransactionCategory.F]],
            key=lambda x: x.actual_amount,
            reverse=True,
        )
        current_sum = 0
        potential_group = []
        for t in vpf_txs:
            t_date = t.transaction_date or t.timestamp
            if abs(t_date - (b_tx.booking_date or b_tx.timestamp)) > timedelta(days=batch_days):
                continue
            if current_sum + t.actual_amount <= b_tx.amount + 0.01:
                current_sum += t.actual_amount
                potential_group.append(t)
            if abs(current_sum - b_tx.amount) < 1.0:
                for pt in potential_group:
                    matches.append(ReconciliationMatch(
                        internal_tx_id=pt.id,
                        bank_tx_id=b_tx.id,
                        confidence_score=0.9,
                        match_type="aggregate",
                        ai_reasoning=f"Matched as part of aggregate flow sum ({len(potential_group)} items) to bank entry {b_tx.id}",
                    ))
                break
    return matches


@router.post("/{project_id}/semantic")
async def get_semantic_matches(
    project: Project = Depends(verify_project_access),
    threshold: float = 0.75,
    db: Session = Depends(get_session),
):
    """
    Find semantically similar transactions using NLP
    Uses sentence transformers to match conceptually similar descriptions
    even when exact text differs
    
    Args:
        project: Project from auth middleware
        threshold: Minimum similarity score (0-1, default 0.75)
        db: Database session
    
    Returns:
        List of semantic matches with similarity scores
    """
    try:
        from app.core.semantic_matcher import get_semantic_matcher
    except ImportError:
        raise HTTPException(
            status_code=501,
            detail="Semantic matching not available. Install sentence-transformers: pip install sentence-transformers"
        )
    
    # Fetch transactions
    internal_txs = db.exec(
        select(Transaction)
        .where(Transaction.project_id == project.id)
        .where(Transaction.status.in_(["pending", "flagged"]))
    ).all()
    
    bank_txs = db.exec(
        select(BankTransaction).where(BankTransaction.project_id == project.id)
    ).all()
    
    if not internal_txs or not bank_txs:
        return {"matches": [], "message": "No transactions to match"}
    
    # Initialize matcher
    matcher = get_semantic_matcher(threshold=threshold)
    
    # Extract descriptions
    internal_descriptions = [
        (tx.description or "") for tx in internal_txs
    ]
    bank_descriptions = [
        (btx.description or "") for btx in bank_txs
    ]
    
    # Find matches
    raw_matches = matcher.match_descriptions(
        internal_descriptions,
        bank_descriptions,
        threshold=threshold
    )
    
    # Build response
    matches = []
    for internal_idx, bank_idx, similarity in raw_matches:
        internal_tx = internal_txs[internal_idx]
        bank_tx = bank_txs[bank_idx]
        
        matches.append({
            "internal_tx_id": internal_tx.id,
            "bank_tx_id": bank_tx.id,
            "internal_description": internal_tx.description,
            "bank_description": bank_tx.description,
            "similarity": round(similarity, 3),
            "match_type": "semantic",
            "internal_amount": internal_tx.actual_amount,
            "bank_amount": bank_tx.amount,
            "confidence_tier": (
                "TIER_1_PERFECT" if similarity >= 0.95 else
                "TIER_2_STRONG" if similarity >= 0.85 else
                "TIER_3_PROBABLE" if similarity >= 0.75 else
                "TIER_4_WEAK"
            )
        })
    
    return {
        "matches": matches,
        "total": len(matches),
        "threshold": threshold,
        "internal_count": len(internal_txs),
        "bank_count": len(bank_txs),
        "cache_size": matcher.get_cache_size()
    }


@router.get("/audit/{entity_id}", response_model=List[AuditLog])
async def get_audit_trail(entity_id: str, db: Session = Depends(get_session)):
    """
    Fetches the immutable forensic audit trail for a specific entity.
    """
    return db.exec(
        select(AuditLog).where(AuditLog.entity_id == entity_id).order_by(AuditLog.timestamp.desc())
    ).all()


@router.post("/{project_id}/run")
async def run_auto_reconcile(
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    Performs forensic validation and attempts auto-reconciliation.
    Tracks changes via AuditLogger.
    """
    transactions = db.exec(
        select(Transaction)
        .where(Transaction.project_id == project.id)
        .where(Transaction.status == "pending")
    ).all()
    processed_count = 0
    flagged_count = 0
    for tx in transactions:
        old_status = tx.status
        old_code = tx.category_code
        old_aml_stage = tx.aml_stage  # Capture old AML stage for logging
        # Pass DB session for Fuzzy Duplicate checks
        triggers = detect_forensic_triggers(tx, db)
        # Audit Log Status Change
        if tx.status != old_status:
            AuditLogger.log_change(
                session=db,
                entity_type="Transaction",
                entity_id=tx.id,
                action=("FORENSIC_FLAG" if tx.status in ["flagged", "locked"] else "STATUS_CHANGE"),
                field_name="status",
                old_value=old_status,
                new_value=tx.status,
                reason="; ".join(triggers),
            )
        # Audit Log Category Re-assignment (Quarantine)
        if tx.category_code != old_code:
            AuditLogger.log_change(
                session=db,
                entity_type="Transaction",
                entity_id=tx.id,
                action="CATEGORY_CHANGE",
                field_name="category_code",
                old_value=old_code,
                new_value=tx.category_code,
                reason="Personal Leakage Quarantine",
            )
        # Audit Log AML Stage Assignment
        if tx.aml_stage != old_aml_stage:
            AuditLogger.log_change(
                session=db,
                entity_type="Transaction",
                entity_id=tx.id,
                action="AML_STAGE_ASSIGNMENT",
                field_name="aml_stage",
                old_value=old_aml_stage.value if old_aml_stage else None,
                new_value=tx.aml_stage.value if tx.aml_stage else None,
                reason="Automated AML stage classification based on forensic triggers",
            )
        if triggers:
            flagged_count += 1
        db.add(tx)
        processed_count += 1
    db.commit()
    # Real-time Broadcast
    await manager.broadcast(
        {
            "type": "RECONCILIATION_RUN_COMPLETED",
            "project_id": project.id,
            "processed": processed_count,
            "flagged": flagged_count,
            "message": f"Auto-reconciliation run complete for {project.id[:8]}.",
        }
    )
    # Publish RECONCILIATION_COMPLETED event
    publish_event(
        EventType.RECONCILIATION_COMPLETED,
        {
            "project_id": project.id,
            "processed_count": processed_count,
            "flagged_count": flagged_count,
            "flag_rate": (
                round(flagged_count / processed_count * 100, 2) if processed_count > 0 else 0
            ),
        },
    )
    # Publish VARIANCE_DETECTED if high flag rate
    if processed_count > 0 and (flagged_count / processed_count) > 0.2:
        publish_event(
            EventType.VARIANCE_DETECTED,
            {
                "project_id": project.id,
                "flagged_count": flagged_count,
                "processed_count": processed_count,
                "variance_rate": round(flagged_count / processed_count * 100, 2),
                "severity": ("high" if (flagged_count / processed_count) > 0.4 else "medium"),
            },
        )
    return {
        "status": "success",
        "processed": processed_count,
        "forensic_flags": flagged_count,
    }


@router.post("/{project_id}/confirm/{match_id}")
async def confirm_match(
    match_id: str,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    match = db.get(ReconciliationMatch, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    if match.confirmed:
        return {"status": "already_confirmed"}
    match.confirmed = True
    AuditLogger.log_change(
        session=db,
        entity_type="ReconciliationMatch",
        entity_id=match.id,
        action="CONFIRM_MATCH",
        new_value="True",
        reason=f"Matched with {match.confidence_score*100}% confidence",
    )
    # Update linked transaction status
    tx = db.get(Transaction, match.internal_tx_id)
    if tx:
        old_status = tx.status
        tx.status = "matched"
        db.add(tx)
        AuditLogger.log_change(
            session=db,
            entity_type="Transaction",
            entity_id=tx.id,
            action="STATUS_CHANGE",
            field_name="status",
            old_value=old_status,
            new_value="matched",
            reason=f"Confirmed match with Bank TX {match.bank_tx_id}",
        )
    db.add(match)
    db.commit()
    # Real-time Broadcast
    await manager.broadcast(
        {
            "type": "TRANSACTION_MATCHED",
            "match_id": match.id,
            "internal_tx_id": tx.id,
            "project_id": project.id,
            "message": f"Transaction {tx.id[:8]} confirmed as matched.",
        }
    )
    # Publish TRANSACTION_MATCHED event
    publish_event(
        EventType.TRANSACTION_MATCHED,
        {
            "match_id": match.id,
            "internal_tx_id": match.internal_tx_id,
            "bank_tx_id": match.bank_tx_id,
            "confidence_score": match.confidence_score,
            "match_type": match.match_type,
        },
    )
    return {"status": "confirmed"}


@router.post("/{project_id}/auto-confirm")
def auto_confirm_matches(
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    Auto-confirm all TIER 1 and eligible TIER 2 matches.
    Returns:
        - auto_confirmed: Number of matches confirmed
        - flagged_for_review: Number requiring human review
        - flagged_for_investigation: Number requiring forensic investigation
    """
    # Find all auto-confirmable matches
    auto_ok_matches = db.exec(
        select(ReconciliationMatch).where(ReconciliationMatch.ai_reasoning.contains("AUTO_OK"))
    ).all()
    # Find matches requiring review
    review_matches = db.exec(
        select(ReconciliationMatch).where(ReconciliationMatch.ai_reasoning.contains("REVIEW"))
    ).all()
    # Find matches requiring investigation
    investigate_matches = db.exec(
        select(ReconciliationMatch).where(ReconciliationMatch.ai_reasoning.contains("INVESTIGATE"))
    ).all()
    confirmed_count = 0
    for match in auto_ok_matches:
        # Update internal transaction status to "confirmed"
        internal_tx = db.get(Transaction, match.internal_tx_id)
        if internal_tx and internal_tx.status != "confirmed":
            old_status = internal_tx.status
            internal_tx.status = "confirmed"
            confirmed_count += 1
            # Audit trail
            AuditLogger.log_change(
                session=db,
                entity_type="ReconciliationMatch",
                entity_id=match.id,
                action="AUTO_CONFIRMED",
                field_name="status",
                old_value=old_status,
                new_value="confirmed",
                reason=f"Auto-confirmed: {match.ai_reasoning}",
            )
    db.commit()
    # Publish RECONCILIATION_COMPLETED event for auto-confirmation
    publish_event(
        EventType.RECONCILIATION_COMPLETED,
        {
            "auto_confirmed": confirmed_count,
            "flagged_for_review": len(review_matches),
            "flagged_for_investigation": len(investigate_matches),
            "total_matches": len(auto_ok_matches) + len(review_matches) + len(investigate_matches),
            "auto_confirm_rate": (
                round(
                    confirmed_count
                    / (len(auto_ok_matches) + len(review_matches) + len(investigate_matches))
                    * 100,
                    2,
                )
                if (len(auto_ok_matches) + len(review_matches) + len(investigate_matches)) > 0
                else 0
            ),
        },
    )
    # Publish VARIANCE_DETECTED if many matches need investigation
    if len(investigate_matches) > 5:
        publish_event(
            EventType.VARIANCE_DETECTED,
            {
                "investigation_required": len(investigate_matches),
                "severity": "high" if len(investigate_matches) > 20 else "medium",
                "message": f"{len(investigate_matches)} matches require forensic investigation",
            },
        )
    return {
        "status": "success",
        "auto_confirmed": confirmed_count,
        "flagged_for_review": len(review_matches),
        "flagged_for_investigation": len(investigate_matches),
        "message": f"{confirmed_count} matches auto-confirmed, {len(review_matches)} flagged for review, {len(investigate_matches)} require investigation",
        "details": {
            "tier_1_confirmed": sum(1 for m in auto_ok_matches if "TIER_1" in m.ai_reasoning),
            "tier_2_confirmed": sum(1 for m in auto_ok_matches if "TIER_2" in m.ai_reasoning),
            "tier_3_review": sum(1 for m in review_matches if "TIER_3" in m.ai_reasoning),
            "tier_4_investigate": sum(1 for m in investigate_matches if "TIER_4" in m.ai_reasoning),
        },
    }


@router.get("/{project_id}/stats")
def get_reconciliation_stats(
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """Get comprehensive reconciliation statistics including auto-confirmation breakdown."""
    # Since Match doesn't have project_id directly, we join via Transaction
    all_matches = db.exec(
        select(ReconciliationMatch).join(Transaction).where(Transaction.project_id == project.id)
    ).all()
    total = len(all_matches)
    if total == 0:
        return {
            "total_matches": 0,
            "message": "No matches found. Run reconciliation first.",
        }
    # Count by tier
    tier_1 = sum(1 for m in all_matches if "TIER_1" in (m.ai_reasoning or ""))
    tier_2 = sum(1 for m in all_matches if "TIER_2" in (m.ai_reasoning or ""))
    tier_3 = sum(1 for m in all_matches if "TIER_3" in (m.ai_reasoning or ""))
    tier_4 = sum(1 for m in all_matches if "TIER_4" in (m.ai_reasoning or ""))
    # Count by auto-confirmation status
    auto_ok = sum(1 for m in all_matches if "AUTO_OK" in (m.ai_reasoning or ""))
    needs_review = sum(1 for m in all_matches if "REVIEW" in (m.ai_reasoning or ""))
    needs_investigate = sum(1 for m in all_matches if "INVESTIGATE" in (m.ai_reasoning or ""))
    # Count invoice and vendor matches
    has_invoice = sum(1 for m in all_matches if "INV:" in (m.ai_reasoning or ""))
    has_vendor = sum(1 for m in all_matches if "Vendor:" in (m.ai_reasoning or ""))
    return {
        "total_matches": total,
        "tier_distribution": {
            "tier_1_perfect": tier_1,
            "tier_2_strong": tier_2,
            "tier_3_probable": tier_3,
            "tier_4_weak": tier_4,
            "tier_1_pct": round(tier_1 / total * 100, 1) if total > 0 else 0,
            "tier_2_pct": round(tier_2 / total * 100, 1) if total > 0 else 0,
            "tier_3_pct": round(tier_3 / total * 100, 1) if total > 0 else 0,
            "tier_4_pct": round(tier_4 / total * 100, 1) if total > 0 else 0,
        },
        "auto_confirmation": {
            "auto_confirmable": auto_ok,
            "needs_review": needs_review,
            "needs_investigation": needs_investigate,
            "auto_confirm_rate": round(auto_ok / total * 100, 1) if total > 0 else 0,
        },
        "intelligence": {
            "invoice_matches": has_invoice,
            "vendor_matches": has_vendor,
            "invoice_match_rate": (round(has_invoice / total * 100, 1) if total > 0 else 0),
            "vendor_match_rate": round(has_vendor / total * 100, 1) if total > 0 else 0,
        },
        "avg_confidence": (
            round(sum(m.confidence_score for m in all_matches) / total, 3) if total > 0 else 0
        ),
    }
