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
        current_amount = tx.verified_amount
        
        # PLACEMENT: Injection of cash into project (High-value unverified sources)
        if current_amount > 100000000 and tx.verification_status == "UNVERIFIED":
            aml_stage = "PLACEMENT"
        
        # LAYERING: Complex webs or concealment
        is_family = any(
            alias.lower() in receiver.lower() for alias in ForensicFraudEngine.FAMILY_ALIASES
        )
        if tx.is_redacted or is_family or tx.is_circular:
            aml_stage = "LAYERING"
            
        # INTEGRATION: Funds returned to legal lifestyle
        if is_personal and current_amount > 5000000 and tx.status in ["verified", "checked"]:
            aml_stage = "INTEGRATION"
            
        tx.aml_stage = aml_stage
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
        """
        Identifies circular washing patterns and Structuring.
        Structuring: Multiple small returns that sum to a large withdrawal.
        """
        circular_matches = []
        sorted_txs = sorted(transactions, key=lambda x: x.timestamp)
        
        # 1. Exact & Fuzzy 1-to-1 Matching
        for i, itx in enumerate(sorted_txs):
            itx_amt = itx.verified_amount
            if itx_amt > 1000000: # Threshold 1jt
                for j in range(i + 1, len(sorted_txs)):
                    jtx = sorted_txs[j]
                    jtx_amt = jtx.verified_amount
                    time_diff = (jtx.timestamp - itx.timestamp).total_seconds()
                    
                    if time_diff > 604800: # 7 days window
                        break
                        
                    # Fuzzy match (within 1%)
                    if abs(itx_amt - jtx_amt) / max(1, itx_amt) < 0.01:
                        circular_matches.append({
                            "type": "1-to-1 Circular",
                            "outflow_id": itx.id,
                            "inflow_id": jtx.id,
                            "amount": itx_amt,
                            "pattern": f"Out to {itx.receiver} -> Return from {jtx.sender} within {round(time_diff/3600, 1)}h"
                        })

        # 2. Structuring Detection (N-to-1)
        # Look for withdrawals followed by multiple small deposits from same group
        for i, itx in enumerate(sorted_txs):
            itx_amt = itx.verified_amount
            if itx_amt > 10000000: # Significant withdrawal
                potential_returns = []
                current_sum = 0
                for j in range(i + 1, len(sorted_txs)):
                    jtx = sorted_txs[j]
                    jtx_amt = jtx.verified_amount
                    time_diff = (jtx.timestamp - itx.timestamp).total_seconds()
                    
                    if time_diff > 864000: # 10 days window
                        break
                    
                    # If it's a small return (less than 20% of original)
                    if jtx_amt < (itx_amt * 0.3):
                        current_sum += jtx_amt
                        potential_returns.append(jtx.id)
                        
                        # If sum reaches ~parity
                        if abs(current_sum - itx_amt) / itx_amt < 0.05:
                            circular_matches.append({
                                "type": "Structuring (Wash Cluster)",
                                "outflow_id": itx.id,
                                "return_ids": list(potential_returns),
                                "total_amount": current_sum,
                                "pattern": f"Large withdrawal of {itx_amt:,.0f} returned via {len(potential_returns)} smaller transactions"
                            })
                            break
                            
        return circular_matches


fraud_engine = ForensicFraudEngine()
