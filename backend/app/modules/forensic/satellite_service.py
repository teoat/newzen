import random
from typing import Dict, Any


class SatelliteVerificationService:
    @staticmethod
    def analyze_delta(project_id: str, lat: float, lon: float) -> Dict[str, Any]:
        """
        Simulates comparing recent satellite imagery with the baseline
        to verify reported construction progress.
        """
        # Mock Logic: Randomly determine progress verification
        verdict_score = random.uniform(0.4, 0.99)
        percent_change = random.uniform(15.0, 45.0)
        status = "VERIFIED"
        if verdict_score < 0.6:
            status = "DISCREPANCY"
        return {
            "project_id": project_id,
            "coordinates": {"lat": lat, "lon": lon},
            "satellite_provider": "SENTINEL-2 LEO",
            "last_flyover": "2025-10-14T09:30:00Z",
            "delta_detected_percent": round(percent_change, 2),
            "reported_progress_percent": 30.0,  # Mocked from project metadata
            "verification_status": status,
            "heatmap_url": "/assets/mock_satellite_heatmap.png",  # Placeholder
            "analysis_notes": (
                "Foundation footprint visible. Heavy machinery signatures detected."
                if status == "VERIFIED"
                else "No significant structural changes since last epoch."
            ),
        }
