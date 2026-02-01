from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import Any, List

from app.core.db import get_session
from app.services.intelligence.architect_service import ArchitectService
from app.core.security import get_current_user

router = APIRouter(tags=["The Architect - Digital Twin Reconstruction"])

@router.post("/reconstruct/{project_id}")
async def start_3d_reconstruction(
    project_id: str,
    photo_ids: List[str],
    db: Session = Depends(get_session),
    current_user: Any = Depends(get_current_user)
):
    """
    Trigger NeRF-based 3D site reconstruction.
    """
    try:
        service = ArchitectService(db)
        result = await service.reconstruct_site_3d(project_id, photo_ids)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/bim-compare/{project_id}")
async def compare_bim(
    project_id: str,
    db: Session = Depends(get_session),
    current_user: Any = Depends(get_current_user)
):
    """
    Detect structural deviations between BIM and reality.
    """
    service = ArchitectService(db)
    result = await service.compare_bim_reality(project_id)
    return result

@router.get("/satellite-history/{project_id}")
async def get_satellite_history(
    project_id: str,
    db: Session = Depends(get_session),
    current_user: Any = Depends(get_current_user)
):
    """
    Fetch historical satellite progress timeline.
    """
    service = ArchitectService(db)
    result = await service.get_satellite_chronology(project_id)
    return result

@router.get("/quantify/{project_id}")
async def quantify_site_materials(
    project_id: str,
    db: Session = Depends(get_session),
    current_user: Any = Depends(get_current_user)
):
    """
    Autonomously quantify materials in 3D reconstruction.
    """
    service = ArchitectService(db)
    result = await service.quantify_materials_3d(project_id)
    return result
