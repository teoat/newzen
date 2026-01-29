from typing import Dict, List, Any
from app.models import Transaction, TransactionCategory
from app.core.event_bus import publish_event, EventType


class ForensicFraudEngine:
    PERSONAL_KEYWORDS = [
        "Tokopedia",
        "Shopee",
        "OVO",
        "Gopay",
        "Spotify",
        "Zara",
        "Poshboy",
        "Guardian",
        "Beer",
        "Bir",
        "Makan",
        "Resto",
        "Kopitiam",
        "PLN",
        "BPJS",
        "Telkomsel",
    ]
    FAMILY_ALIASES = ["Faldi", "Sandi", "Ema", "Mama", "Clivord"]
    PROJECT_EXPENSES = ["Semen", "Batu", "Solar", "Alat", "Bahan"]

    @staticmethod
    def evaluate_transaction(tx: Transaction) -> Dict[str, Any]:
        """Specialized Forensic Engine for the Aldi Fraud Case."""
        risk_score = 0.05
        alerts = []
        mens_rea = []
        desc = tx.description or ""
        receiver = tx.receiver or ""
        # 1. Tipex Detection (Concealment)
        if any(kw in desc.lower() for kw in ["tipex", "ti-pex", "redacted"]):
            tx.is_redacted = True
            risk_score += 0.4
            alerts.append("Concealment via Redaction (Tipex)")
            mens_rea.append("Intentional concealment of beneficial owner")
        # 2. Personal Misappropriation Detection
        is_personal = False
        keywords = ForensicFraudEngine.PERSONAL_KEYWORDS
        if any(kw.lower() in desc.lower() for kw in keywords):
            is_personal = True
            risk_score += 0.3
            alerts.append("Personal consumption detected in description")
            mens_rea.append("Use of project funds for personal lifestyle")
        # 3. Family Funneling
        family_aliases = ForensicFraudEngine.FAMILY_ALIASES
        if any(alias.lower() in receiver.lower() for alias in family_aliases):
            is_personal = True
            risk_score += 0.5
            alerts.append(f"Unjustified beneficiary: Family member ({receiver})")
            mens_rea.append("Systematic funneling of funds to family aliases")
        tx.potential_misappropriation = is_personal
        # AML Stage Classification (Strategic Enhancement)
        aml_stage = None
        current_amount = tx.actual_amount or tx.amount
        if current_amount > 100000000:
            aml_stage = "PLACEMENT"
        is_family = any(
            alias.lower() in receiver.lower() for alias in ForensicFraudEngine.FAMILY_ALIASES
        )
        if tx.is_redacted or is_family:
            aml_stage = "LAYERING"
        if is_personal and current_amount > 5000000:
            aml_stage = "INTEGRATION"
        # 4. Intent Detection (Classification Fraud)
        if tx.category_code in [TransactionCategory.F, TransactionCategory.P] and is_personal:
            risk_score += 0.2
            alerts.append("High Intent: Personal expense disguised as business operation")
            mens_rea.append("Deliberate misclassification of personal expenses")
        # 5. Asset Monitoring
        if any(kw.lower() in desc.lower() for kw in ["excavator", "hilux", "truck"]):
            alerts.append("Asset tracking required (Ghost Asset risk)")
        tx.mens_rea_description = "; ".join(mens_rea)
        risk_score = min(risk_score, 1.0)
        # Publish CORRELATION_FOUND if high risk and alerts are present
        if risk_score >= 0.5 and alerts:
            publish_event(
                EventType.CORRELATION_FOUND,
                data={
                    "correlation_type": "FraudDetection",
                    "transaction_id": tx.id,
                    "risk_score": risk_score,
                    "alerts": alerts,
                    "mens_rea": tx.mens_rea_description,
                    "aml_stage": aml_stage,
                },
                project_id=tx.project_id,
            )
        return {
            "risk_score": risk_score,
            "alerts": alerts,
            "status": "flagged" if risk_score >= 0.5 else "pending",
            "is_redacted": tx.is_redacted,
            "potential_misappropriation": tx.potential_misappropriation,
            "mens_rea": tx.mens_rea_description,
            "aml_stage": aml_stage,
        }

    @staticmethod
    def detect_circular_flows(transactions: List[Transaction]) -> List[Dict[str, Any]]:
        """Identifies circular washing patterns."""
        circular_matches = []
        sorted_txs = sorted(transactions, key=lambda x: x.timestamp)
        for i, itx in enumerate(sorted_txs):
            itx_amt = itx.actual_amount or itx.amount
            if itx_amt > 10000000:
                for j in range(i + 1, len(sorted_txs)):
                    jtx = sorted_txs[j]
                    jtx_amt = jtx.actual_amount or jtx.amount
                    time_diff = (jtx.timestamp - itx.timestamp).total_seconds()
                    if time_diff > 172800:
                        break
                    if itx_amt == jtx_amt:
                        if (
                            "tipex" in (jtx.description or "").lower()
                            or "pinjam" in (jtx.description or "").lower()
                        ):
                            circular_matches.append(
                                {
                                    "outflow_id": itx.id,
                                    "inflow_id": jtx.id,
                                    "amount": itx_amt,
                                    "pattern": f"Out to {itx.receiver} -> Return via {jtx.description}",
                                }
                            )
        return circular_matches


fraud_engine = ForensicFraudEngine()
