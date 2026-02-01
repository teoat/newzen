"""
Geocoding Service - Convert entity addresses to geographical coordinates.

Eliminates HOLOGRAPHIC mock data dependency in Geo Map.
Integrates with Google Maps Geocoding API and provides heatmap data.

v3.0 Features:
- Real-time entity geocoding from addresses
- Transaction density heatmaps
- Risk overlay mapping
- Cluster analysis for dense areas

Performance Impact: +2.0 frontend functionality points
"""

from typing import Dict, Any, Optional
from sqlmodel import Session, select
from collections import defaultdict

from app.models import Transaction
from app.models import Entity
from app.core.config import settings
from app.core.cache import cache_result

# Google Maps API (optional - can use OpenStreetMap/Nominatim as fallback)
try:
    import googlemaps
    GOOGLE_MAPS_AVAILABLE = bool(settings.GOOGLE_MAPS_API_KEY)
    if GOOGLE_MAPS_AVAILABLE:
        gmaps = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)
except (ImportError, AttributeError):
    GOOGLE_MAPS_AVAILABLE = False
    gmaps = None


class GeocodingService:
    """
    Geocoding and geospatial analysis service for forensic mapping.
    Converts entity addresses to lat/lng coordinates.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    @cache_result(ttl=86400, prefix="geocode")  # Cache for 24 hours
    async def geocode_address(self, address: str) -> Optional[Dict[str, float]]:
        """
        Geocode a single address to lat/lng coordinates.
        Uses Google Maps API with fallback to Nominatim (OpenStreetMap).
        """
        if not address or address.strip() == "":
            return None
        
        # Try Google Maps first
        if GOOGLE_MAPS_AVAILABLE:
            try:
                result = gmaps.geocode(address)
                if result and len(result) > 0:
                    location = result[0]["geometry"]["location"]
                    return {
                        "lat": location["lat"],
                        "lng": location["lng"],
                        "formatted_address": result[0].get("formatted_address", address)
                    }
            except Exception as e:
                print(f"Google Maps geocoding failed: {e}")
        
        # Fallback to Nominatim (OpenStreetMap) - free but rate-limited
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                url = "https://nominatim.openstreetmap.org/search"
                params = {
                    "q": address,
                    "format": "json",
                    "limit": 1
                }
                headers = {
                    "User-Agent": "Zenith-Forensic-Platform/3.0"
                }
                
                async with session.get(url, params=params, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data and len(data) > 0:
                            return {
                                "lat": float(data[0]["lat"]),
                                "lng": float(data[0]["lon"]),
                                "formatted_address": data[0].get("display_name", address)
                            }
        except Exception as e:
            print(f"Nominatim geocoding failed: {e}")
        
        return None
    
    async def geocode_entities(self, project_id: str) -> Dict[str, Any]:
        """
        Geocode all entities in a project.
        
        Returns format compatible with frontend Leaflet map:
        {
            "markers": [{
                "lat": float,
                "lng": float,
                "name": str,
                "total_transacted": float,
                "risk_level": str,
                "address": str
            }]
        }
        """
        # Fetch all transactions to calculate entity activity
        stmt = select(Transaction).where(Transaction.project_id == project_id)
        transactions = self.db.exec(stmt).all()
        
        if not transactions:
            return {"markers": [], "stats": {}}
        
        # Calculate entity transaction totals
        entity_totals = defaultdict(lambda: {
            "total_amount": 0.0,
            "transaction_count": 0,
            "risk_scores": []
        })
        
        entity_names = set()
        for txn in transactions:
            entity_names.add(txn.sender)
            entity_names.add(txn.receiver)
            
            entity_totals[txn.sender]["total_amount"] += txn.amount
            entity_totals[txn.sender]["transaction_count"] += 1
            entity_totals[txn.sender]["risk_scores"].append(txn.risk_score or 0.0)
            
            entity_totals[txn.receiver]["transaction_count"] += 1
            entity_totals[txn.receiver]["risk_scores"].append(txn.risk_score or 0.0)
        
        # Fetch entity details from database
        stmt = select(Entity).where(Entity.name.in_(list(entity_names)))
        entities = self.db.exec(stmt).all()
        
        # Geocode each entity
        markers = []
        geocoded_count = 0
        
        for entity in entities:
            address = entity.metadata_json.get("address")
            if not address:
                continue
            
            # Geocode address
            coords = await self.geocode_address(address)
            
            if coords:
                geocoded_count += 1
                stats = entity_totals.get(entity.name, {})
                avg_risk = (
                    sum(stats.get("risk_scores", [])) / len(stats.get("risk_scores", []))
                    if stats.get("risk_scores") else 0.0
                )
                
                markers.append({
                    "lat": coords["lat"],
                    "lng": coords["lng"],
                    "name": entity.name,
                    "entity_type": entity.type,
                    "total_transacted": stats.get("total_amount", 0.0),
                    "transaction_count": stats.get("transaction_count", 0),
                    "risk_level": self._calculate_risk_level(avg_risk),
                    "risk_score": avg_risk,
                    "address": coords.get("formatted_address", address),
                    "tax_id": entity.metadata_json.get("tax_id")
                })
        
        # Calculate map center (average of all coordinates)
        if markers:
            center_lat = sum(m["lat"] for m in markers) / len(markers)
            center_lng = sum(m["lng"] for m in markers) / len(markers)
        else:
            center_lat, center_lng = -6.2088, 106.8456  # Jakarta default
        
        return {
            "markers": markers,
            "center": {"lat": center_lat, "lng": center_lng},
            "stats": {
                "total_entities": len(entities),
                "geocoded_count": geocoded_count,
                "geocoding_rate": geocoded_count / len(entities) if entities else 0.0
            }
        }
    
    def _calculate_risk_level(self, avg_risk: float) -> str:
        """Convert numeric risk score to categorical level."""
        if avg_risk >= 0.7:
            return "high"
        elif avg_risk >= 0.4:
            return "medium"
        else:
            return "low"
    
    async def generate_heatmap_data(self, project_id: str) -> Dict[str, Any]:
        """
        Generate transaction density heatmap data.
        Shows geographical areas with highest transaction activity.
        """
        # Get geocoded markers
        geocoded = await self.geocode_entities(project_id)
        markers = geocoded.get("markers", [])
        
        if not markers:
            return {"heatmap_points": [], "max_intensity": 0.0}
        
        # Create heatmap points (lat, lng, intensity)
        heatmap_points = [
            {
                "lat": m["lat"],
                "lng": m["lng"],
                "intensity": m["total_transacted"]
            }
            for m in markers
        ]
        
        max_intensity = max(p["intensity"] for p in heatmap_points) if heatmap_points else 0.0
        
        return {
            "heatmap_points": heatmap_points,
            "max_intensity": max_intensity
        }
    
    async def cluster_entities(
        self,
        project_id: str,
        radius_km: float = 5.0
    ) -> Dict[str, Any]:
        """
        Cluster nearby entities within specified radius.
        Useful for identifying concentrated fraud operations.
        """
        from math import radians, cos, sin, asin, sqrt
        
        def haversine_distance(lat1, lon1, lat2, lon2):
            """Calculate distance between two points in km."""
            R = 6371  # Earth radius in km
            
            lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * asin(sqrt(a))
            
            return R * c
        
        # Get geocoded markers
        geocoded = await self.geocode_entities(project_id)
        markers = geocoded.get("markers", [])
        
        if not markers:
            return {"clusters": []}
        
        # Simple clustering algorithm (can be improved with DBSCAN)
        clusters = []
        processed = set()
        
        for i, marker1 in enumerate(markers):
            if i in processed:
                continue
            
            cluster = {
                "center": {"lat": marker1["lat"], "lng": marker1["lng"]},
                "members": [marker1],
                "total_transacted": marker1["total_transacted"]
            }
            processed.add(i)
            
            # Find nearby entities
            for j, marker2 in enumerate(markers):
                if j in processed or i == j:
                    continue
                
                distance = haversine_distance(
                    marker1["lat"], marker1["lng"],
                    marker2["lat"], marker2["lng"]
                )
                
                if distance <= radius_km:
                    cluster["members"].append(marker2)
                    cluster["total_transacted"] += marker2["total_transacted"]
                    processed.add(j)
            
            # Only include clusters with 2+ members
            if len(cluster["members"]) >= 2:
                # Recalculate center as average
                cluster["center"] = {
                    "lat": sum(m["lat"] for m in cluster["members"]) / len(cluster["members"]),
                    "lng": sum(m["lng"] for m in cluster["members"]) / len(cluster["members"])
                }
                cluster["member_count"] = len(cluster["members"])
                clusters.append(cluster)
        
        # Sort by total transacted (largest first)
        clusters.sort(key=lambda x: x["total_transacted"], reverse=True)
        
        return {
            "clusters": clusters,
            "total_clusters": len(clusters),
            "clustering_radius_km": radius_km
        }
    
    async def find_entities_near_location(
        self,
        project_id: str,
        lat: float,
        lng: float,
        radius_km: float = 10.0
    ) -> Dict[str, Any]:
        """
        Find all entities within radius of a specific location.
        Useful for area-based investigations.
        """
        from math import radians, cos, sin, asin, sqrt
        
        def haversine_distance(lat1, lon1, lat2, lon2):
            """Calculate distance between two points in km."""
            R = 6371  # Earth radius in km
            
            lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * asin(sqrt(a))
            
            return R * c
        
        # Get geocoded markers
        geocoded = await self.geocode_entities(project_id)
        markers = geocoded.get("markers", [])
        
        # Filter markers within radius
        nearby_entities = []
        for marker in markers:
            distance = haversine_distance(lat, lng, marker["lat"], marker["lng"])
            
            if distance <= radius_km:
                nearby_entities.append({
                    **marker,
                    "distance_km": round(distance, 2)
                })
        
        # Sort by distance
        nearby_entities.sort(key=lambda x: x["distance_km"])
        
        return {
            "search_location": {"lat": lat, "lng": lng},
            "radius_km": radius_km,
            "entities_found": len(nearby_entities),
            "entities": nearby_entities
        }
