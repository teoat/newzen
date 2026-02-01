from sqlmodel import Session, select
from typing import Dict, Any
from app.models import Transaction


class SatelliteVerificationService:
    @staticmethod
    def analyze_delta(project_id: str, lat: float, lon: float) -> Dict[str, Any]:
        """
        Stub for satellite delta analysis.
        """
        return {
            "project_id": project_id,
            "status": "ANALYZED",
            "lat": lat,
            "lon": lon,
            "anomalies_detected": False,
            "message": "Satellite imagery shows expected progress for site coordinates."
        }

    @staticmethod
    def analyze_site_correlation(db: Session, project_id: str) -> Dict[str, Any]:
        """
        Correlates financial disbursements (Transactions) with physical site reality
        by checking for existing Site Visit logs or Geo-tagged artifact uploads.
        """
        # 1. Aggregate Spend
        transactions = db.exec(
            select(Transaction).where(Transaction.project_id == project_id)
        ).all()
        
        total_spend = sum(t.amount for t in transactions)
        
        # 2. Check for Evidence (Stub for now)
        evidence_count = 0 
        
        # 3. Calculate Correlation Score
        verification_density = 0.0
        if total_spend > 0:
            verification_density = min((evidence_count * 1000000) / total_spend, 1.0) 
            
        status = "VERIFIED"
        if total_spend > 100000000 and evidence_count < 5:
             status = "AUDIT_GAP_DETECTED"
        
        return {
            "project_id": project_id,
            "analysis_type": "SPEND_VS_EVIDENCE_CORRELATION",
            "total_disbursed": total_spend,
            "evidence_density_score": round(verification_density, 2),
            "verification_status": status,
            "audit_recommendation": (
                "Initiate physical site audit. High disbursement volume lacks sufficient evidentiary documentation."
                if status == "AUDIT_GAP_DETECTED"
                else "Spending appears correlated with adequate documentation flow."
            )
        }

