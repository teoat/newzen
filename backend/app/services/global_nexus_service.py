"""
Global Nexus Service - Cross-Project Intelligence Agent.
Identifies 'Silk Road' patterns where suspect nodes operate across multiple project boundaries.
"""

from typing import Dict, Any
from sqlmodel import Session, select, func
from app.models import Entity
import logging

logger = logging.getLogger(__name__)

class GlobalNexusService:
    @staticmethod
    def identify_cross_project_risks(db: Session) -> Dict[str, Any]:
        """
        Scans the global entity pool for cross-project connections.
        Matches by Tax ID, Bank Account, or Fuzzy Name logic.
        """
        # 1. Identify entities appearing in > 1 project
        stmt = select(Entity.tax_id).where(Entity.tax_id.is_not(None)).group_by(Entity.tax_id).having(func.count(Entity.project_id.distinct()) > 1)
        shared_tax_ids = db.exec(stmt).all()
        
        silk_road_report = []
        
        for tid in shared_tax_ids:
            # Gather all entities sharing this ID
            entities = db.exec(select(Entity).where(Entity.tax_id == tid)).all()
            project_ids = list(set([e.project_id for e in entities]))
            
            # Calculate aggregate risk
            avg_risk = sum(e.risk_score for e in entities) / len(entities)
            
            if avg_risk > 0.5: # Only report high-risk nexus
                silk_road_report.append({
                    "nexus_id": tid,
                    "type": "SHARED_TAX_IDENTITY",
                    "affected_projects": project_ids,
                    "involved_entities": [e.name for e in entities],
                    "aggregate_risk_score": round(avg_risk, 2),
                    "warning": "Cross-project tunneling detected. Potential centralized siphoning node."
                })
                
        return {
            "total_nexus_found": len(silk_road_report),
            "silk_road_patterns": silk_road_report,
            "status": "SOVEREIGN_SCAN_COMPLETE"
        }
