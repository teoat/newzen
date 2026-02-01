from typing import Dict, List, Any
from sqlmodel import Session, select
from app.models import Transaction, Document, Project
from app.modules.forensic.service import GeographicValidator
import logging

logger = logging.getLogger(__name__)

class SiteTruthService:
    def __init__(self, db: Session):
        self.db = db

    def verify_project_geospatial_integrity(self, project_id: str) -> Dict[str, Any]:
        """
        Cross-references transaction locations with evidence (photos) GPS metadata.
        Identifies "Impossible Travel" where transactions are logged far from where
        investigators actually found evidence.
        """
        project = self.db.get(Project, project_id)
        if not project:
            return {"error": "Project not found"}

        # 1. Get transactions with GPS
        transactions = self.db.exec(
            select(Transaction)
            .where(Transaction.project_id == project_id)
            .where(Transaction.latitude.is_not(None))
            .where(Transaction.longitude.is_not(None))
        ).all()

        # 2. Get evidence (photos) with GPS
        evidence = self.db.exec(
            select(Document)
            .where(Document.transaction_id.is_in([t.id for t in transactions]))
        ).all()

        anomalies = []
        verified_count = 0

        for doc in evidence:
            if not doc.metadata_json or "lat" not in doc.metadata_json:
                continue
            
            tx = next((t for t in transactions if t.id == doc.transaction_id), None)
            if not tx:
                continue

            # Compare TX GPS with Photo GPS
            distance = GeographicValidator.calculate_distance_km(
                tx.latitude, tx.longitude,
                doc.metadata_json["lat"], doc.metadata_json["lng"]
            )

            if distance > 5.0: # 5km threshold for site vs document mismatch
                anomalies.append({
                    "type": "EVIDENCE_MISMATCH",
                    "transaction_id": tx.id,
                    "document_id": doc.id,
                    "distance_km": round(distance, 2),
                    "description": f"Transaction recorded at ({tx.latitude}, {tx.longitude}) but evidence photo taken {distance:.1f}km away."
                })
            else:
                verified_count += 1

        return {
            "project_id": project_id,
            "transactions_scanned": len(transactions),
            "evidence_links_verified": verified_count,
            "geospatial_anomalies": anomalies,
            "integrity_score": round((verified_count / max(1, len(evidence))) * 100, 1)
        }
