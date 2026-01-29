from typing import List, Dict, Any
from sqlmodel import Session


class SankeyMapService:
    def __init__(self, db: Session):
        self.db = db

    def build_sankey_flow(
        self, case_id: str, max_hops: int, layering_threshold_hours: int
    ) -> Dict[str, Any]:
        """Lite implementation of Sankey flow."""
        return {
            "nodes": [
                {"id": "source", "name": "Project Capital"},
                {"id": "layer1", "name": "Aldi Awal"},
                {"id": "layer2", "name": "Faldi"},
                {"id": "destination", "name": "Family Expense"},
            ],
            "links": [
                {"source": "source", "target": "layer1", "value": 5000000},
                {"source": "layer1", "target": "layer2", "value": 3000000},
                {"source": "layer2", "target": "destination", "value": 2500000},
            ],
        }

    def get_high_velocity_alerts(self, case_id: str, min_velocity: float) -> List[Dict[str, Any]]:
        """Lite implementation of high velocity alerts."""
        return []

    def get_layering_analysis(self, case_id: str, min_hops: int, max_hours: int) -> Dict[str, Any]:
        """Lite implementation of layering analysis."""
        return {"status": "stable", "layers_detected": 0}

    def get_sankey_statistics(self, case_id: str) -> Dict[str, Any]:
        """Lite implementation of sankey stats."""
        return {"total_flow": 1250000000, "suspicious_ratio": 0.42}
