from typing import Dict, Any
from sqlmodel import Session, select
from app.models import Transaction
from thefuzz import fuzz, process

# Local watchlist for demo/initial implementation
# In production, this would be synced with OFAC/UN/etc.
HIGH_RISK_WATCHLIST = [
    "Suspect Entity A",
    "Money Launderer X",
    "Shell Corp Limited",
    "Offshore Holding Group",
    "Front Company Inc",
    "Blocked Politician Y",
    "Shadow Vendor B",
]

class SanctionScreeningService:
    @staticmethod
    def screen_entity(entity_name: str) -> Dict[str, Any]:
        """
        Performs fuzzy matching against high-risk watchlist.
        """
        if not entity_name or entity_name == "Unknown":
            return {
                "entity": entity_name,
                "status": "SKIPPED",
                "risk_score": 0.0,
                "message": "Invalid entity name provided."
            }

        # Find best match in watchlist
        matches = process.extract(entity_name, HIGH_RISK_WATCHLIST, scorer=fuzz.token_sort_ratio, limit=1)
        best_match, score = matches[0] if matches else (None, 0)

        risk_score = 0.0
        status = "CLEARED"
        message = "No matches found in local watchlist."

        if score > 85:
            risk_score = 1.0
            status = "BLOCKED"
            message = f"CRITICAL: Exact or near-exact match with watchlisted entity: {best_match} ({score}%)"
        elif score > 60:
            risk_score = 0.6
            status = "SUSPICIOUS"
            message = f"WARNING: Potential fuzzy match with watchlisted entity: {best_match} ({score}%)"

        return {
            "entity": entity_name,
            "status": status,
            "risk_score": risk_score,
            "best_match": best_match if score > 60 else None,
            "match_confidence": score,
            "sources_scanned": ["INTERNAL_WATCHLIST_V1"],
            "message": message
        }

    @staticmethod
    def analyze_vendor_velocity(db: Session, entity_name: str) -> Dict[str, Any]:
        """
        Analyzes internal payment velocity for a specific vendor/entity.
        """
        # 1. Fetch all transactions for this entity name
        txs = db.exec(
            select(Transaction).where(Transaction.receiver == entity_name)
        ).all()
        
        total_received = sum(t.actual_amount for t in txs)
        tx_count = len(txs)
        
        # 2. Category Variance (Audit Flag)
        categories = list(set((t.category_code.value if hasattr(t.category_code, 'value') else str(t.category_code)) for t in txs))
        
        risk_score = 0.0
        status = "NORMAL"
        
        # Logic: A concrete vendor ordinarily shouldn't be billing for 'Software' or 'Legal'
        if len(categories) > 3:
            risk_score += 0.5
            status = "CROSS_CATEGORY_RISK"
            
        # Logic: High velocity (many small txs)
        if tx_count > 10 and (total_received / tx_count) < 5000: # Many small payments
             risk_score += 0.3
             status = "STRUCTURING_RISK"

        return {
            "entity": entity_name,
            "profile_type": "INTERNAL_AUDIT_HISTORY",
            "total_volume": total_received,
            "transaction_count": tx_count,
            "active_categories": categories,
            "risk_score": min(risk_score, 1.0),
            "status": status,
            "audit_note": f"Entity active across {len(categories)} budget lines. Avg Ticket: {total_received/(tx_count or 1):.2f}"
        }

