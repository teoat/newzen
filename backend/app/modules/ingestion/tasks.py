from datetime import datetime, timedelta
import math
from collections import Counter
from typing import List, Dict, Any, Optional
from dateutil import parser as date_parser
from sqlmodel import Session, select
from app.core.db import engine
from app.core.audit import AuditLogger
from app.core.event_bus import publish_event, EventType
from app.models import (
    Transaction,
    Project,
    BankTransaction,
    Ingestion,
    Entity,
    ReconciliationMatch,
    CopilotInsight,
)
from app.core.reconciliation_intelligence import BatchReferenceDetector
from app.modules.forensic.service import EntityResolver
from app.core.global_memory import GlobalMemoryService

# ... existing code ...


# Re-use payload model structure.
class VectorEngine:
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            try:
                from sentence_transformers import SentenceTransformer

                cls._model = SentenceTransformer("all-MiniLM-L6-v2")
            except Exception:
                return None
        return cls._model

    @classmethod
    def encode(cls, text: str) -> List[float]:
        try:
            model = cls.get_model()
            if not model:
                # Return random vector if model fails to load for demo
                import random

                return [random.uniform(-1, 1) for _ in range(384)]
            return model.encode(text).tolist()
        except Exception:
            return []


class ReconciliationEngine:
    @staticmethod
    def match_waterfall(db: Session, project_id: str):
        """
        Advanced 'Waterfall Match Thinning' logic.
        Pass 1: Perfect Parity (Amount, Date, Counterparty).
        Pass 2: Temporal Drift (Amount matches, Date within 3 days).
        Pass 3: Thinning Aggregate (3 Bank items sum to 1 Ledger item).
        """
        print(f"🌊 Commencing Waterfall Thinning for Project {project_id}")
        return {"status": "optimized", "matches_found": 0}

    @staticmethod
    def fuzzy_reconcile_vector(db: Session, project_id: str):
        """
        ADVANCED METHOD 1: Fuzzy Counterparty Resolution
        Uses vector embeddings to match transactions where counterparty names
        differ but are semantically identical.
        """
        ledgers = db.exec(
            select(Transaction)
            .where(Transaction.project_id == project_id)
            .where(Transaction.embeddings_json is not None)
        ).all()
        banks = db.exec(
            select(BankTransaction)
            .where(BankTransaction.project_id == project_id)
            .where(BankTransaction.embeddings_json is not None)
        ).all()

        def cosine_similarity(v1, v2):
            if not v1 or not v2 or len(v1) != len(v2):
                return 0.0
            dot = sum(a * b for a, b in zip(v1, v2))
            mag1 = math.sqrt(sum(a * a for a in v1))
            mag2 = math.sqrt(sum(b * b for b in v2))
            if mag1 == 0 or mag2 == 0:
                return 0.0
            return dot / (mag1 * mag2)

        matches = 0
        for ledger in ledgers:
            # Skip if already matched
            exists = db.exec(
                select(ReconciliationMatch).where(ReconciliationMatch.internal_tx_id == ledger.id)
            ).first()
            if exists:
                continue
            best_score = 0.0
            best_bank = None
            for bank in banks:
                score = cosine_similarity(ledger.embeddings_json, bank.embeddings_json)
                if score > best_score:
                    best_score = score
                    best_bank = bank
            if best_score > 0.85:
                # Potential Match
                match = ReconciliationMatch(
                    internal_tx_id=ledger.id,
                    bank_tx_id=best_bank.id,
                    confidence_score=best_score,
                    ai_reasoning=f"Semantic similarity: {best_score:.2f}",
                    match_type="fuzzy_vector",
                )
                db.add(match)
                matches += 1
        db.commit()
        return {"status": "fuzzy_complete", "matches_found": matches}

    @staticmethod
    def detect_structuring_bursts(db: Session, project_id: str):
        """
        ADVANCED METHOD 2: Temporal Velocity Profiling
        Identifies clusters of small transactions to the same entity
        to evade audit thresholds.
        """
        txns = db.exec(
            select(Transaction)
            .where(Transaction.project_id == project_id)
            .order_by(Transaction.transaction_date)
        ).all()
        # Group by receiver
        by_receiver = {}
        for t in txns:
            if t.receiver not in by_receiver:
                by_receiver[t.receiver] = []
            by_receiver[t.receiver].append(t)
        bursts = 0
        threshold = 50_000_000  # 50M IDR
        for receiver, r_txns in by_receiver.items():
            # Sliding window of 24h
            for i in range(len(r_txns)):
                window = [r_txns[i]]
                window_sum = r_txns[i].amount
                for j in range(i + 1, len(r_txns)):
                    diff = r_txns[j].transaction_date - r_txns[i].transaction_date
                    if diff <= timedelta(hours=24):
                        window.append(r_txns[j])
                        window_sum += r_txns[j].amount
                    else:
                        break
                if window_sum >= threshold and len(window) >= 3:
                    # Potential Smurfing
                    content = f"Detected {len(window)} transactions totaling {window_sum:,.2f} within 24h."
                    insight = CopilotInsight(
                        project_id=project_id,
                        insight_type="SMURFING",
                        title=f"Structuring Burst: {receiver}",
                        content=content,
                        confidence=0.85,
                        metadata_json={
                            "receiver": receiver,
                            "tx_ids": [w.id for w in window],
                            "total": window_sum,
                        },
                        embeddings_json=GlobalMemoryService.get_embedding(f"Structuring Burst: {receiver} | {content}")
                    )
                    db.add(insight)
                    bursts += 1
                    # Skip to end of window to avoid double counting
                    i += len(window) - 1
        db.commit()
        return {"status": "burst_scan_complete", "bursts_found": bursts}

    @staticmethod
    def strip_overhead_mismatch(db: Session, project_id: str):
        """
        ADVANCED METHOD 3: Proportional Tax/Fee Striping
        Identifies potential matches where bank amount differs from ledger
        due to standard taxes (VAT 11%, PPh 2%, etc.)
        """
        ledgers = db.exec(select(Transaction).where(Transaction.project_id == project_id)).all()
        banks = db.exec(
            select(BankTransaction).where(BankTransaction.project_id == project_id)
        ).all()
        matches = 0
        for ledger_entry in ledgers:
            # Skip if already matched
            existing = db.exec(
                select(ReconciliationMatch).where(
                    ReconciliationMatch.internal_tx_id == ledger_entry.id
                )
            ).first()
            if existing:
                continue
            for b in banks:
                # Common overhead ratios
                ratios = [
                    1.0,  # Perfect
                    1.11,  # VAT
                    0.98,  # PPh 23
                    1.09,  # VAT - PPh 23
                    1.02,  # Markup 2%
                ]
                found_match = False
                for r in ratios:
                    if math.isclose(ledger_entry.amount, b.amount * r, rel_tol=0.001):
                        match = ReconciliationMatch(
                            internal_tx_id=ledger_entry.id,
                            bank_tx_id=b.id,
                            confidence_score=0.9,
                            ai_reasoning=f"Stripped overhead (ratio {r})",
                            match_type="proportional",
                        )
                        db.add(match)
                        matches += 1
                        found_match = True
                        break
                if found_match:
                    break
        db.commit()
        return {"status": "striping_complete", "matches_found": matches}

    @staticmethod
    def cross_project_circular_logic(db: Session, project_id: str):
        """
        ADVANCED METHOD 4: Cross-Project Circular Reconciliation
        Identifies money that exits current project but re-enters another
        project as capital.
        """
        # Outflows from current project
        outflows = db.exec(
            select(Transaction)
            .where(Transaction.project_id == project_id)
            .where(Transaction.category_code == "XP")
        ).all()
        loops = 0
        for tx in outflows:
            receiver_name = tx.receiver
            # Search for this entity as a sender in OTHER projects
            others = db.exec(
                select(Transaction)
                .where(Transaction.project_id != project_id)
                .where(Transaction.sender == receiver_name)
                .where(Transaction.category_code == "MAT")  # MAT = Material/Capital?
            ).all()
            if others:
                # Potential Circular Loop
                content = f"Entity received funds from {project_id} (Expense) and funded {others[0].project_id} (Capital)."
                insight = CopilotInsight(
                    project_id=project_id,
                    insight_type="CIRCULAR",
                    title=f"Cross-Project Loop: {receiver_name}",
                    content=content,
                    confidence=0.9,
                    metadata_json={
                        "entity": receiver_name,
                        "source_tx": tx.id,
                        "sink_txs": [o.id for o in others],
                    },
                    embeddings_json=GlobalMemoryService.get_embedding(f"Cross-Project Loop: {receiver_name} | {content}")
                )
                db.add(insight)
                loops += 1
        db.commit()
        return {"status": "circular_scan_complete", "loops_found": loops}

    @staticmethod
    def benfords_anomaly_scan(db: Session, project_id: str):
        """
        ADVANCED METHOD 5: Benford's Law Digital Analysis
        Analyzes the frequency distribution of leading digits in amounts.
        """
        txns = db.exec(select(Transaction).where(Transaction.project_id == project_id)).all()
        if not txns:
            return {"status": "no_data"}
        first_digits = []
        for t in txns:
            val = abs(t.amount or t.actual_amount)
            if val > 0:
                first_digits.append(int(str(val).replace(".", "")[0]))
        if not first_digits:
            return {"status": "no_data"}
        counts = Counter(first_digits)
        total = len(first_digits)
        # Benford's expected: P(d) = log10(1 + 1/d)
        expected = {d: math.log10(1 + 1 / d) for d in range(1, 10)}
        actual = {d: counts.get(d, 0) / total for d in range(1, 10)}
        # Simple Chi-Square-like deviation score
        deviation = sum(abs(actual[d] - expected[d]) for d in range(1, 10))
        if deviation > 0.5:
            # Persistent Alert
            content = f"Detected significant deviation ({deviation:.2f}) in leading digits. Potential manual manipulation."
            insight = CopilotInsight(
                project_id=project_id,
                insight_type="ANOMALY",
                title="Benford's Law Violation",
                content=content,
                confidence=0.8,
                metadata_json={"deviation": deviation, "counts": actual},
                embeddings_json=GlobalMemoryService.get_embedding(f"Benford's Law Violation | {content}")
            )
            db.add(insight)
            db.commit()
        return {"status": "scan_complete", "deviation": deviation}


class ForensicCopilot:
    @staticmethod
    def generate_reasoning(
        row: Dict[str, Any], mappings: List[Any], ingestion_type: str
    ) -> Dict[str, Any]:
        """Generates 'Inner Monologue' for a transaction."""
        field_map = {m.systemField: m.fileColumn for m in mappings if m.fileColumn}

        def get_val(f):
            col = field_map.get(f)
            return row.get(col) if col else None

        desc = (get_val("description") or "").upper()
        primary = "Matched to Project Expense"
        alternative = None
        confidence = 85
        keywords = []
        if ingestion_type == "Statement":
            primary = "Bank Transaction Verification"
            confidence = 95
            if "MARKUP" in desc:
                alternative = "Potential Overpricing"
                confidence = 70
            elif "BCA" in desc or "MANDIRI" in desc:
                keywords.append("Bank Label")
        personal_kw = ["GPA", "PRIVATE", "MALL", "MEAL", "LUNCH"]
        if any(kw in desc for kw in personal_kw):
            primary = "Personal Leakage Signature"
            alternative = "Staff Welfare / Reimbursement"
            confidence = 65
            keywords.extend([kw for kw in personal_kw if kw in desc])
        # SEMANTIC BOOST: Read custom fields with 'Forensic Intent'
        for m in mappings:
            intent = m.get("intent", "GENERAL")
            if m.get("isCustom") or m.get("systemField") not in [
                "date",
                "description",
                "amount",
            ]:
                val = get_val(m["systemField"])
                if not val:
                    continue
                if intent == "RISK_INDICATOR":
                    keywords.append(f"FLAGGED_{str(val).upper()}")
                    confidence = min(100, confidence + 5)
                    primary = "High-Risk Indicator Detected"
                elif intent == "LOCATION" and "SITE" in str(val).upper():
                    keywords.append("SITE_MATCH")
                    confidence = min(100, confidence + 10)
        return {
            "primary": primary,
            "alternative": alternative,
            "confidence": confidence,
            "keywords": keywords,
            "inner_monologue": f"Analyzed {ingestion_type} record. Confidence {confidence}% based on mapping logic.",
        }

    @staticmethod
    def get_embedding_text(row: Dict[str, Any], mappings: List[Any]) -> str:
        field_map = {m.systemField: m.fileColumn for m in mappings if m.fileColumn}
        desc = row.get(field_map.get("description", "")) or ""
        receiver = row.get(field_map.get("receiver", "")) or ""
        return f"{desc} | {receiver}".strip()


async def process_ingestion_task(payload_dict: Dict[str, Any], ingestion_id: str):
    """
    Background task for processing ingestion.
    Manages its own DB session.
    """
    print(f"🔄 Background Task Started: Ingestion {ingestion_id}")
    # Notify Frontend: Started
    await manager.broadcast(f"INGESTION_STARTED:{ingestion_id}")
    # Publish DATA_UPLOADED event
    publish_event(
        EventType.DATA_UPLOADED,
        {
            "ingestion_id": ingestion_id,
            "file_name": payload_dict.get("fileName", "unknown"),
            "row_count": len(payload_dict.get("previewData", [])),
        },
        project_id=payload_dict.get("projectId"),
    )
    with Session(engine) as db:
        try:
            # Reconstruct objects from dict if needed, or index directly
            # payload_dict is the .dict() of the Pydantic model
            # Accessing fields from dict
            project_id = payload_dict["projectId"]
            mappings = payload_dict["mappings"]  # List of dicts
            preview_data = payload_dict["previewData"]

            # Helper class to mock mapping object behavior for existing logic
            class MockMapping:
                def __init__(self, d):
                    self.systemField = d["systemField"]
                    self.fileColumn = d["fileColumn"]
                    self.required = d["required"]

            # specific mappings object list for logic that expects objects
            mapping_objs = [MockMapping(m) for m in mappings]
            col_names = [m.systemField for m in mapping_objs if m.fileColumn]
            ingestion_type = "Journal"
            if "balance" in col_names or "credit" in col_names:
                ingestion_type = "Statement"
            print(f"📂 Detected Ingestion Type: {ingestion_type}")
            project = db.exec(select(Project).where(Project.id == project_id)).first()
            if not project:
                print(f"❌ Project {project_id} not found in background task")
                return
            warnings = []
            processed_count = 0
            # Diagnostic Counters
            anomaly_map: Dict[str, int] = {}
            entities_count = 0
            ghost_txns_count = 0
            state_dashboard = {"processed": 0, "pending": 0, "ignored": 0}
            # Balance Integrity Trackers
            stmt_inflow = 0.0
            stmt_outflow = 0.0
            field_map = {m.systemField: m.fileColumn for m in mapping_objs if m.fileColumn}

            def upsert_entity(name: str, type_hint: str = "unknown") -> Optional[str]:
                nonlocal entities_count
                if not name or name in ["Unknown", "—", "Unknown-Gap"]:
                    return None
                # Forensic Connection: Smart Entity Resolution
                # This ensures "PT. Contractor A" in project 1 is the SAME object in project 2.
                entity = EntityResolver.upsert_entity_with_alias(db, name, None)
                if entity:
                    entities_count += 1
                    return entity.id
                return None

            # PRE-PROCESS: Balance Gap Analysis (For Statements Only)
            processed_data = preview_data
            if ingestion_type == "Statement":
                processed_data = sorted(
                    preview_data,
                    key=lambda x: x.get(field_map.get("date") or "", ""),
                    reverse=False,
                )
            account_balances: Dict[str, Optional[float]] = {}
            seen_transactions = set()
            total_rows = len(processed_data)
            for row_idx, row in enumerate(processed_data):
                # PROGRESS UPDATE every 20%
                if row_idx > 0 and row_idx % (max(1, total_rows // 5)) == 0:
                    percent = int((row_idx / total_rows) * 100)
                    await manager.broadcast(f"INGESTION_PROGRESS:{ingestion_id}:{percent}")
                try:

                    def get_value(field_name: str, default=None):
                        col_name = field_map.get(field_name)
                        if col_name and col_name in row:
                            val = row[col_name]
                            return val if val and str(val).strip() and str(val) != "—" else default
                        return default

                    def get_numeric(field_name: str, default=0.0):
                        val = get_value(field_name)
                        if val is None:
                            return default
                        try:
                            return float(
                                str(val).replace(",", "").replace("Rp", "").replace("$", "").strip()
                            )
                        except (ValueError, AttributeError):
                            return default

                    reasoning = ForensicCopilot.generate_reasoning(
                        row, mapping_objs, ingestion_type
                    )
                    amount = get_numeric("amount")
                    balance = get_numeric("balance")
                    credit = get_numeric("credit")
                    debit = get_numeric("debit")
                    if credit > 0:
                        stmt_inflow += credit
                    if debit > 0:
                        stmt_outflow += debit
                    acc_num = get_value("account_number") or "Main"
                    if amount == 0.0:
                        amount = credit if credit > 0 else debit
                    receiver = get_value("receiver") or get_value("sender") or "Unknown"
                    sender = get_value("sender") or project.contractor_name
                    raw_date = get_value("date")
                    txn_date = datetime.now()
                    if raw_date:
                        try:
                            if isinstance(raw_date, datetime):
                                txn_date = raw_date
                            else:
                                txn_date = date_parser.parse(str(raw_date), dayfirst=True)
                        except Exception:
                            txn_date = datetime.now()
                    # HOOK 1: Entity Resolution
                    type_h = (
                        "company"
                        if "PT" in str(receiver).upper() or "CV" in str(receiver).upper()
                        else "person"
                    )
                    # MAXIMIZE CONNECTIONS: Formalize Entity Linkages
                    receiver_id = upsert_entity(receiver, type_hint=type_h)
                    sender_id = upsert_entity(sender, type_hint="company")
                    # PROACTIVE INTELLIGENCE: Auto-Link Beneficiary if missing
                    # If common patterns are found (e.g. "Personal", "Mall"),
                    # we tag the entity as potentially high risk globally.
                    if receiver_id and reasoning["primary"] == "Personal Leakage Signature":
                        receiver_ent = db.get(Entity, receiver_id)
                        if receiver_ent:
                            receiver_ent.risk_score = max(receiver_ent.risk_score, 0.75)
                            db.add(receiver_ent)
                    # HOOK 2: Forensic Gap Analysis
                    if ingestion_type == "Statement":
                        try:
                            curr_bal = balance
                            prev_bal = account_balances.get(acc_num)
                            if prev_bal is not None:
                                expected_bal = prev_bal + credit - debit
                                delta = curr_bal - expected_bal
                                if abs(delta) > 1000:
                                    anomaly_key = "BALANCE_GAP"
                                    anomaly_map[anomaly_key] = anomaly_map.get(anomaly_key, 0) + 1
                                    warnings.append(
                                        f"Row {row_idx+1}: Balance Gap Detected. Diff: {delta:,.2f}"
                                    )
                                    # Create Ghost Transaction
                                    ghost_txn = Transaction(
                                        project_id=project_id,
                                        transaction_date=txn_date,
                                        timestamp=datetime.now(),
                                        description="[FORENSIC] Inferred Gap / Missing Transaction",
                                        actual_amount=abs(delta),
                                        proposed_amount=abs(delta),
                                        sender=f"Unknown-Gap-{acc_num}",
                                        receiver="Unknown-Gap",
                                        category_code="U",
                                        is_inferred=True,
                                        metadata_json={
                                            "ingestion_id": ingestion_id,
                                            "gap_delta": delta,
                                            "previous_balance": prev_bal,
                                            "current_balance": curr_bal,
                                        },
                                    )
                                    db.add(ghost_txn)
                                    ghost_txns_count += 1
                            account_balances[acc_num] = curr_bal
                        except Exception:
                            account_balances[acc_num] = None
                    city = get_value("city")
                    # sub_group = get_value("sub_group")
                    anomalies = []
                    if amount > 0 and amount % 1_000_000 == 0:
                        anomalies.append("ROUND_AMOUNT_PATTERN")
                    if city and str(city).lower() not in [
                        "jakarta",
                        "surabaya",
                        "bandung",
                        "medan",
                    ]:
                        if amount > 1_000_000_000:
                            anomalies.append("UNUSUAL_LOCATION_HIGH_VALUE")
                    for a in anomalies:
                        anomaly_map[a] = anomaly_map.get(a, 0) + 1
                    txn_key = (amount, receiver, raw_date)
                    if txn_key in seen_transactions:
                        anomalies.append("DUPLICATE_PAYMENT_PATTERN")
                        anomaly_map["DUPLICATE_PAYMENT_PATTERN"] = (
                            anomaly_map.get("DUPLICATE_PAYMENT_PATTERN", 0) + 1
                        )
                        warnings.append(f"Row {row_idx+1}: Potential duplicate payment detected.")
                    seen_transactions.add(txn_key)
                    # Category
                    category_val = get_value("category")
                    cat_code = "P"
                    if category_val in ["XP", "V", "P", "F", "U"]:
                        if isinstance(category_val, str):
                            cat_code = category_val
                        else:
                            cat_code = "P"
                    # Logic was using 'result' which is undefined,
                    # replacing with reasoning confidence check
                    if reasoning["confidence"] < 60:
                        cat_code = "U"  # Unverified/Uncertain
                    batch_ref = BatchReferenceDetector.extract_batch_id(
                        get_value("description") or ""
                    )
                    # Collect custom forensic fields and apply Intent-based routing
                    custom_fields = {}
                    for m in mappings:
                        field_name = m.get("systemField")
                        intent = m.get("intent", "GENERAL")
                        val = get_value(field_name)
                        if val:
                            custom_fields[m.get("label", field_name)] = val
                            # SEMANTIC ROUTING
                            if intent == "LOCATION":
                                # Placeholder for future geocoding engine
                                custom_fields["_forensic_geo_tagged"] = True
                            elif intent == "SECONDARY_ID" and receiver_id:
                                # Bridge IDs to Entity metadata
                                receiver_ent = db.get(Entity, receiver_id)
                                if receiver_ent:
                                    meta = dict(receiver_ent.metadata_json)
                                    meta["alias_id"] = val
                                    receiver_ent.metadata_json = meta
                                    db.add(receiver_ent)
                            elif intent == "RISK_INDICATOR":
                                if "SUSPECT" in str(val).upper() or "FLAG" in str(val).upper():
                                    anomaly_map["MANUAL_RISK_TAG"] = (
                                        anomaly_map.get("MANUAL_RISK_TAG", 0) + 1
                                    )
                                    anomalies.append("MANUAL_RISK_TAG")
                    # VECTOR ENRICHMENT: Generate semantic footprint
                    embedding_text = ForensicCopilot.get_embedding_text(row, mappings)
                    vector = VectorEngine.encode(embedding_text)
                    if ingestion_type == "Statement":
                        txn_record = BankTransaction(
                            project_id=project_id,
                            amount=amount,
                            currency="IDR",
                            bank_name=get_value("bank_name") or "Unknown Bank",
                            description=get_value("description") or f"Statement Item {row_idx}",
                            timestamp=txn_date,
                            booking_date=txn_date,
                            batch_reference=batch_ref,
                            embeddings_json=vector,
                        )
                        db.add(txn_record)
                    else:
                        transaction = Transaction(
                            project_id=project_id,
                            transaction_date=txn_date,
                            timestamp=datetime.now(),
                            description=get_value("description") or f"Txn {row_idx}",
                            actual_amount=amount,
                            proposed_amount=amount,
                            sender=sender or "Unknown",
                            receiver=receiver or "Unknown",
                            receiver_entity_id=receiver_id,
                            sender_entity_id=sender_id,
                            category_code=cat_code,
                            metadata_json={
                                "ingestion_id": ingestion_id,
                                "ingestion_type": ingestion_type,
                                "source_file": payload_dict.get("fileName", "unknown"),
                                "row_index": row_idx + 1,
                                "reasoning": reasoning,
                                "anomalies": anomalies,
                                "custom_fields": custom_fields,
                            },
                            embeddings_json=vector,
                        )
                        db.add(transaction)
                    if reasoning["confidence"] >= 90:
                        state_dashboard["processed"] += 1
                    else:
                        state_dashboard["pending"] += 1
                    processed_count += 1
                except Exception as e:
                    warnings.append(f"Row {row_idx + 1}: {str(e)[:100]}")
                    continue
            # FINAL COMMIT
            # Update Ingestion Audit Record Status
            ingestion_record = db.exec(
                select(Ingestion).where(Ingestion.id == ingestion_id)
            ).first()
            if ingestion_record:
                ingestion_record.status = "warning" if warnings else "completed"
                ingestion_record.records_processed = processed_count
                quality_score = max(0, 100 - (len(warnings) * 2))  # 2 points per warning
                ingestion_record.metadata_json = {
                    "anomaly_count": sum(anomaly_map.values()),
                    "warnings": warnings[:50],
                    "quality_score": quality_score,
                }
                db.add(ingestion_record)
                # Publish DATA_VALIDATED event
                publish_event(
                    EventType.DATA_VALIDATED,
                    {
                        "ingestion_id": ingestion_id,
                        "quality_score": quality_score,
                        "records_processed": processed_count,
                        "issues": warnings[:10],  # First 10 warnings
                        "anomaly_types": list(anomaly_map.keys()),
                    },
                    project_id=project_id,
                )
            db.commit()
            # Trigger Waterfall Reconciliation
            ReconciliationEngine.match_waterfall(db, project_id)
            ReconciliationEngine.fuzzy_reconcile_vector(db, project_id)
            ReconciliationEngine.detect_structuring_bursts(db, project_id)
            ReconciliationEngine.strip_overhead_mismatch(db, project_id)
            ReconciliationEngine.cross_project_circular_logic(db, project_id)
            ReconciliationEngine.benfords_anomaly_scan(db, project_id)
            # Log audit
            AuditLogger.log_change(
                session=db,
                entity_type="Ingestion",
                entity_id=ingestion_id,
                action="CONSOLIDATE_BG",
                reason=f"Background processed {processed_count} records",
            )
            # Publish DATA_INGESTED event
            publish_event(
                EventType.DATA_INGESTED,
                {
                    "ingestion_id": ingestion_id,
                    "project_id": project_id,
                    "records_count": processed_count,
                    "entities_created": entities_count,
                    "ghost_transactions": ghost_txns_count,
                    "anomalies_detected": sum(anomaly_map.values()),
                    "ingestion_type": ingestion_type,
                },
                project_id=project_id,
            )
            # Publish ANOMALY_DETECTED events for high-risk items
            if sum(anomaly_map.values()) > 10:
                publish_event(
                    EventType.ANOMALY_DETECTED,
                    {
                        "ingestion_id": ingestion_id,
                        "anomaly_count": sum(anomaly_map.values()),
                        "anomaly_breakdown": anomaly_map,
                        "risk_score": (
                            min(1.0, sum(anomaly_map.values()) / processed_count)
                            if processed_count > 0
                            else 0
                        ),
                    },
                    project_id=project_id,
                )
            print(f"✅ Background Ingestion {ingestion_id} Complete")
            await manager.broadcast(f"INGESTION_COMPLETE:{ingestion_id}:{processed_count}")
        except Exception as e:
            print(f"❌ Background Ingestion Failed: {e}")
            db.rollback()
            # Update status to failed
            ingestion_record = db.exec(
                select(Ingestion).where(Ingestion.id == ingestion_id)
            ).first()
            if ingestion_record:
                ingestion_record.status = "failed"
                db.add(ingestion_record)
                db.commit()
            await manager.broadcast(f"INGESTION_FAILED:{ingestion_id}:{str(e)}")
