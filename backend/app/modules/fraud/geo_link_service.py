import hashlib
import math
from typing import List, Dict, Any, Tuple
from sqlmodel import Session, select
from app.models import Transaction


class GeoLinkService:
    def __init__(self, db: Session):
        self.db = db
        # Fixed reference point for "Project Zero" (e.g., Jakarta Pusat)
        # In a real app, this would come from Project.latitude/longitude
        self.project_hq = (-6.1751, 106.8650)

    def _get_deterministic_coords(self, seed: str) -> Tuple[float, float]:
        """
        Generates deterministic coordinates based on a string seed.
        Simulates geocoding for demo purposes by mapping entities to
        plausible locations in Indonesia/SE Asia.
        """
        hash_val = int(hashlib.md5(seed.encode()).hexdigest(), 16)
        # Modulo to pick a "zone"
        zone = hash_val % 5
        # Add some random-looking jitter based on the hash
        lat_jitter = (hash_val % 1000) / 10000.0
        lng_jitter = ((hash_val >> 4) % 1000) / 10000.0
        if zone == 0:  # Jakarta / West Java (High density)
            base_lat, base_lng = -6.2088, 106.8456
        elif zone == 1:  # Surabaya / East Java
            base_lat, base_lng = -7.2575, 112.7521
        elif zone == 2:  # Medan / Sumatra
            base_lat, base_lng = 3.5952, 98.6722
        elif zone == 3:  # Singapore (Offshore/High Risk)
            base_lat, base_lng = 1.3521, 103.8198
        else:  # Bali / Remote
            base_lat, base_lng = -8.4095, 115.1889
        return (base_lat + lat_jitter, base_lng + lng_jitter)

    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates distance in miles between two points."""
        R = 3958.8  # Earth radius in miles
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2) * math.sin(dlat / 2) + math.cos(math.radians(lat1)) * math.cos(
            math.radians(lat2)
        ) * math.sin(dlon / 2) * math.sin(dlon / 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def analyze_case_geo_links(self, case_id: str, max_distance_miles: float) -> Dict[str, Any]:
        """
        Analyzes transactions linked to a case to find geographic anomalies.
        """
        # Fetch high-value transactions or flagged ones
        statement = select(Transaction).where(Transaction.actual_amount > 50000000).limit(100)
        transactions = self.db.exec(statement).all()
        anomalies = []
        for tx in transactions:
            # Infer location from Receiver entity
            receiver_name = tx.receiver or "Unknown"
            lat, lng = self._get_deterministic_coords(receiver_name)
            dist = self._haversine_distance(self.project_hq[0], self.project_hq[1], lat, lng)
            is_offshore = dist > 500  # e.g. Singapore/remote from Jakarta
            if is_offshore or dist > max_distance_miles:
                anomalies.append(
                    {
                        "transaction_id": tx.id,
                        "entity": receiver_name,
                        "amount": tx.actual_amount,
                        "location": {"lat": lat, "lng": lng},
                        "distance_miles": round(dist, 2),
                        "flag": "OFFSHORE_FLOW" if is_offshore else "DISTANCE_ANOMALY",
                    }
                )
        return {
            "case_id": case_id,
            "status": "analyzed",
            "matches": anomalies,
            "max_distance": max_distance_miles,
            "anomaly_count": len(anomalies),
        }

    def get_map_data(self, case_id: str) -> Dict[str, Any]:
        """
        Returns GeoJSON compatible features for the frontend map.
        Groups transactions into 'Hotspots'.
        """
        # Fetch relevant transactions (simulating case-linked ones)
        # In a real scenario: select(Transaction).where(Transaction.case_id == case_id)
        statement = select(Transaction).limit(200)
        transactions = self.db.exec(statement).all()
        hotspots: Dict[str, Dict[str, Any]] = {}  # coordinates_key -> {value, count, name}
        for tx in transactions:
            receiver = tx.receiver or "Unknown"
            lat, lng = self._get_deterministic_coords(receiver)
            # Group by rounded coordinates (clustering)
            key = f"{round(lat, 3)},{round(lng, 3)}"
            if key not in hotspots:
                hotspots[key] = {
                    "lat": lat,
                    "lng": lng,
                    "total_value": 0.0,
                    "count": 0,
                    "names": set(),
                }
            hotspots[key]["total_value"] += float(tx.actual_amount)
            hotspots[key]["count"] += 1
            hotspots[key]["names"].add(receiver)
        features = []
        for key, data in hotspots.items():
            primary_name = list(data["names"])[0]
            if len(data["names"]) > 1:
                primary_name += f" (+{len(data['names'])-1} others)"
            dist = self._haversine_distance(
                float(self.project_hq[0]), float(self.project_hq[1]), float(data["lat"]), float(data["lng"])
            )
            severity = min(1.0, float(data["total_value"]) / 1_000_000_000)  # Normalize severity
            if dist > 500:
                severity = min(1.0, severity + 0.3)  # Boost severity for offshore
            features.append(
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [data["lng"], data["lat"]],
                    },
                    "properties": {
                        "id": f"hotspot-{key}",
                        "name": primary_name,
                        "value": data["total_value"],
                        "severity": severity,
                        "transaction_count": data["count"],
                        "root_cause": ("Offshore Flow" if dist > 500 else "Vendor Cluster"),
                    },
                }
            )
        return {"type": "FeatureCollection", "features": features}

    def get_offshore_risk_analysis(self, case_id: str) -> Dict[str, Any]:
        """
        Specific analysis for cross-border/offshore leakage risks (e.g., Singapore).
        """
        data = self.get_map_data(case_id)
        offshore_features = [
            f
            for f in data["features"]
            if self._haversine_distance(
                self.project_hq[0],
                self.project_hq[1],
                f["geometry"]["coordinates"][1],
                f["geometry"]["coordinates"][0],
            )
            > 300  # Threshold for "Offshore" in this context
        ]
        total_risk_val = sum(f["properties"]["value"] for f in offshore_features)
        return {
            "risk_score": min(0.99, len(offshore_features) * 0.15),
            "total_offshore_value": total_risk_val,
            "hotspots": sorted(
                offshore_features, key=lambda x: x["properties"]["value"], reverse=True
            ),
            "narrative": f"Detected {len(offshore_features)} distinct offshore endpoints with total flow of IDR {total_risk_val:,.2f}",
        }

    def get_distance_alerts(self, max_distance_miles: float, limit: int) -> List[Dict[str, Any]]:
        """Lite implementation of distance alerts."""
        return []
