import logging
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import Session, select
from app.core.db import get_session
from app.modules.fraud.sankey_service import SankeyMapService
from app.core.auth_middleware import verify_project_access
from app.models import Project, Case

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/forensic/{project_id}/sankey-map", tags=["Sankey"])


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


@router.get("/flow/{case_id}")
async def get_sankey_flow(
    project_id: str,
    case_id: str,
    max_hops: int = Query(5, ge=2, le=10),
    layering_threshold_hours: int = Query(24, ge=1, le=168),
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """Get Sankey diagram flow from source through layers to destination"""
    await validate_case_in_project(case_id, project.id, db)
    service = SankeyMapService(db)
    sankey = service.build_sankey_flow(case_id, max_hops, layering_threshold_hours)
    return sankey


@router.get("/high-velocity/{case_id}")
async def get_high_velocity_alerts(
    project_id: str,
    case_id: str,
    min_velocity: float = Query(5000.0, ge=0.0),
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """Get alerts for high-velocity transactions (rapid fund movement)"""
    await validate_case_in_project(case_id, project.id, db)
    service = SankeyMapService(db)
    alerts = service.get_high_velocity_alerts(case_id, min_velocity)
    return alerts


@router.get("/layering/{case_id}")
async def get_layering_analysis(
    project_id: str,
    case_id: str,
    min_hops: int = Query(3, ge=2, le=10),
    max_hours: int = Query(24, ge=1, le=168),
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """Get detailed layering analysis (money moving through multiple layers)"""
    await validate_case_in_project(case_id, project.id, db)
    service = SankeyMapService(db)
    analysis = service.get_layering_analysis(case_id, min_hops, max_hours)
    return analysis


@router.get("/statistics/{case_id}")
async def get_sankey_statistics(
    project_id: str,
    case_id: str,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """Get comprehensive statistics for Sankey flow analysis"""
    await validate_case_in_project(case_id, project.id, db)
    service = SankeyMapService(db)
    stats = service.get_sankey_statistics(case_id)
    return stats
