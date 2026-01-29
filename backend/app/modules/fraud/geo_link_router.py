import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.modules.fraud.geo_link_service import GeoLinkService
from app.core.db import get_session
from app.core.auth_middleware import verify_project_access
from app.models import Project, Case

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/forensic/{project_id}/geo-link", tags=["Geo-Link"])


async def validate_case_in_project(case_id: str, project_id: str, db: Session):
    """Helper to ensure case belongs to project."""
    case = db.exec(
        select(Case).where(Case.id == case_id).where(Case.project_id == project_id)
    ).first()
    if not case:
        raise HTTPException(
            status_code=404, detail="Case not found or does not belong to this project"
        )
    return case


@router.get("/analyze/{case_id}")
async def analyze_geo_links(
    project_id: str,
    case_id: str,
    max_distance_miles: float = Query(500.0, ge=0.0),
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """Analyze geographic links for a case"""
    await validate_case_in_project(case_id, project.id, db)
    service = GeoLinkService(db)
    analysis = service.analyze_case_geo_links(case_id, max_distance_miles)
    if "error" in analysis:
        raise HTTPException(status_code=404, detail=analysis["error"])
    return analysis


@router.get("/map-data/{case_id}")
async def get_map_data(
    project_id: str,
    case_id: str,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """Get map-ready data for visualization"""
    await validate_case_in_project(case_id, project.id, db)
    service = GeoLinkService(db)
    map_data = service.get_map_data(case_id)
    if "error" in map_data:
        raise HTTPException(status_code=404, detail=map_data["error"])
    return map_data


@router.get("/offshore-risk/{case_id}")
async def get_offshore_risk_analysis(
    project_id: str,
    case_id: str,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """Analyze offshore recipient risk with pulsing heatmap nodes"""
    await validate_case_in_project(case_id, project.id, db)
    service = GeoLinkService(db)
    risk_analysis = service.get_offshore_risk_analysis(case_id)
    if "error" in risk_analysis:
        raise HTTPException(status_code=404, detail=risk_analysis["error"])
    return risk_analysis


@router.get("/distance-alerts")
async def get_distance_alerts(
    project_id: str,
    max_distance_miles: float = Query(500.0, ge=0.0),
    limit: int = Query(50, ge=1, le=1000),
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """Get all transactions exceeding distance threshold"""
    service = GeoLinkService(db)
    # The service might need project_id filtering
    alerts = service.get_distance_alerts(max_distance_miles, limit, project_id=project.id)
    return {
        "max_distance_threshold": max_distance_miles,
        "alert_count": len(alerts),
        "alerts": alerts,
    }
