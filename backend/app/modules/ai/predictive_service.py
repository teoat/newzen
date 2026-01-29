import random
from typing import Dict, Any
from sqlmodel import Session, select
from app.models import Project, Transaction


class PredictiveAI:
    @staticmethod
    def predict_project_risk(db: Session, project_id: str) -> Dict[str, Any]:
        """
        Simulates a Neural Network predicting leakage and stalling risk.
        In a real scenario, this would load a PyTorch/TensorFlow model and
        run inference on the project's historical and current behavior.
        """
        project = db.get(Project, project_id)
        if not project:
            return {"status": "error", "message": "Project not found"}
        # Gather historical context (simulated)
        transactions = db.exec(
            select(Transaction).where(Transaction.project_id == project_id)
        ).all()
        # 1. Feature Engineering (Mock)
        # We calculate "Micro-stalling" patterns (frequency of $0 or small amount clusters)
        # and "Vendor Density" (number of diverse vendors vs concentrated ones)
        # 2. Model Inference (Simulated)
        # Randomly generate some plausible-looking results for the demo
        leakage_probability = random.uniform(0.12, 0.85) if len(transactions) > 0 else 0.05
        stall_risk = random.uniform(0.05, 0.65)
        # Find suspicious patterns
        risk_indicators = [
            "Anomalous weekend transaction clusters detected (Forensic Sig: WKEND_GAP)",
            "Concentrated disbursement to high-risk sub-district vendors",
            "Discrepancy in reported progress vs fund dispersion (Sigma 2.4 variance)",
        ]
        if leakage_probability > 0.6:
            risk_level = "CRITICAL"
        elif leakage_probability > 0.3:
            risk_level = "ELEVATED"
        else:
            risk_level = "NOMINAL"
        return {
            "project_id": project_id,
            "leakage_probability": round(leakage_probability * 100, 1),
            "stalling_risk": round(stall_risk * 100, 1),
            "risk_level": risk_level,
            "confidence_score": 92.4,  # Hardcoded architectural meta-score
            "risk_indicators": random.sample(risk_indicators, 2),
            "recommendation": (
                "Escalate to Field Audit" if risk_level == "CRITICAL" else "Monitor next 30 days"
            ),
        }
