"""
BOQ-to-Visual Truth Linkage.
Cross-references financial budget lines with site-photo visual indices.
"""

from typing import Dict, Any
from sqlmodel import Session
from app.models import BudgetLine
from app.core.rag import rag_service

class VisualTruthBridge:
    @staticmethod
    def validate_line_item(db: Session, budget_line_id: str) -> Dict[str, Any]:
        """
        Queries RAG V2 for visual proof of a specific BOQ line item.
        """
        line = db.get(BudgetLine, budget_line_id)
        if not line:
            return {"error": "Line item not found"}
        
        # Extract visual keywords (e.g. 'Semen' from 'Semen Gresik 50kg')
        keywords = line.item_name.split()[0]
        
        # Query RAG V2 (Gemini Flash Vision results)
        visual_evidence = rag_service.query_context(keywords, limit=5)
        
        # Calculate Visual Integrity Score
        proof_count = len(visual_evidence)
        integrity_score = min(1.0, proof_count / 3.0) # Need at least 3 photos for 100%
        
        return {
            "item_name": line.item_name,
            "financial_claim": line.total_spend_actual,
            "visual_proof_found": proof_count,
            "visual_integrity_score": integrity_score,
            "evidence_links": [doc.id for doc in visual_evidence],
            "status": "VERIFIED" if integrity_score > 0.6 else "UNSUBSTANTIATED"
        }
