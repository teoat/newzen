import random
from typing import Dict, Any


class SanctionScreeningService:
    @staticmethod
    def screen_entity(entity_name: str) -> Dict[str, Any]:
        """
        Simulates screening an entity against global AML watchlists.
        (OFAC, UN, Interpol, EU Sanctions).
        """
        # Mock Logic
        risk_score = 0.0
        matches = []
        # Simulated "Hits" for demo purposes
        if "CV" in entity_name.upper() or "KARYA" in entity_name.upper():
            # Make it clean
            pass
        elif "GLOBAL" in entity_name.upper() or "CORP" in entity_name.upper():
            # Make it suspicious
            risk_score = 0.85
            matches.append(
                {
                    "list": "OFAC SDN",
                    "entry": f"{entity_name.upper()} HOLDINGS LTD",
                    "program": "SDGT",
                    "similarity": 0.92,
                }
            )
        # Random fail-safe for variety
        if random.random() < 0.1:
            risk_score = 0.65
            matches.append(
                {
                    "list": "INTERPOL RED NOTICE",
                    "entry": "UNKNOWN AFFILIATE",
                    "program": "MONEY LAUNDERING",
                    "similarity": 0.78,
                }
            )
        status = "CLEAR"
        if risk_score > 0.8:
            status = "BLOCKED"
        elif risk_score > 0.1:
            status = "REVIEW_REQUIRED"
        return {
            "entity": entity_name,
            "screened_at": "2025-10-15T10:00:00Z",
            "risk_score": round(risk_score * 100, 1),
            "status": status,
            "sources_checked": ["OFAC", "UN_CONSOLIDATED", "INTERPOL", "EU_FSF"],
            "matches": matches,
        }
