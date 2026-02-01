"""
Theory Board Service - Case Synthesis & Conflict Mapping.
Aggregates pinned evidence and identifies contradictions between proof types.
"""

from typing import Dict, Any
from sqlmodel import Session, select
from app.models import Transaction, Document
import logging

logger = logging.getLogger(__name__)

class TheoryBoardService:
    @staticmethod
    def get_board_state(db: Session, project_id: str) -> Dict[str, Any]:
        """
        Gathers all pinned items and generates the Conflict Matrix.
        """
        pinned_txs = db.exec(select(Transaction).where(Transaction.project_id == project_id, Transaction.is_pinned)).all()
        pinned_docs = db.exec(select(Document).where(Document.is_pinned)).all()
        
        # Build Conflict Matrix
        # Logic: Compare Math (Risk Score) vs Relational (Tracer) vs Visual (Photos)
        matrix = []
        for tx in pinned_txs:
            # Look for associated visual proof
            has_visual = any(d.transaction_id == tx.id for d in pinned_docs)
            
            matrix.append({
                "id": tx.id,
                "label": tx.description[:30],
                "math_proof": tx.risk_score,
                "relational_proof": 0.8 if tx.is_circular else 0.2,
                "visual_proof": 1.0 if has_visual else 0.0,
                "conflict_status": "CRITICAL_CONFLICT" if (tx.risk_score > 0.7 and not has_visual) else "SYNCHRONIZED"
            })
            
        return {
            "pinned_transactions": pinned_txs,
            "pinned_evidence": pinned_docs,
            "conflict_matrix": matrix,
            "synthesis_ready": len(matrix) > 0
        }
