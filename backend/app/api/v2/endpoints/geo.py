"""
Geocoding and Maps Router
Exposes geographical intelligence for forensic maps
"""

from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import Dict, Any, List
from app.core.db import get_session
from app.core.auth import get_current_user
from app.models import User
from app.services.geocoding_service import GeocodingService
from app.core.cache import cache_result

router = APIRouter()

@router.get("/entities/{project_id}")
@cache_result(ttl=86400) # Cache for 24h as geocoding is expensive
async def get_geocoded_entities(
    project_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get all entities for a project with their latitude/longitude.
    """
    service = GeocodingService(db)
    return await service.geocode_entities(project_id)

@router.get("/heatmap/{project_id}")
async def get_activity_heatmap(
    project_id: str,
    mode: str = "volume", # volume, risk, or frequency
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Get heatmap data points for the project.
    """
    service = GeocodingService(db)
    result = await service.geocode_entities(project_id)
    markers = result.get("markers", [])
    
    heatmap = []
    for entity in markers:
        if entity.get("lat") and entity.get("lng"):
            weight = 0
            if mode == "volume":
                weight = entity.get("total_transacted", 0)
            elif mode == "risk":
                weight = entity.get("risk_score", 0)
            else: # frequency
                weight = entity.get("transaction_count", 1)
                
            heatmap.append({
                "lat": entity["lat"],
                "lng": entity["lng"],
                "weight": weight,
                "label": entity["name"]
            })
            
    return heatmap
