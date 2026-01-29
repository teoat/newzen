from fastapi import APIRouter, Depends
from app.modules.legal.screening_service import SanctionScreeningService
from app.core.auth_middleware import verify_project_access
from app.models import Project

router = APIRouter(prefix="/forensic/{project_id}/legal", tags=["Legal & Compliance"])


@router.get("/screen/{entity_name}")
async def screen_entity(
    project_id: str, entity_name: str, project: Project = Depends(verify_project_access)
):
    """
    Performs real-time AML/Sanction screening for a vendor or individual.
    """
    return SanctionScreeningService.screen_entity(entity_name)
