"""
Flow Analysis Router
Exposes Sankey flow and trace analytics
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import Dict, Any
from app.core.db import get_session
from app.core.auth import get_current_user
from app.models import User
from app.modules.forensic.flow_tracer_service import FlowTracerService
from app.core.cache import cache_result

router = APIRouter()

@router.get("/trace/{project_id}")
@cache_result(ttl=300)
async def get_flow_trace(
    project_id: str,
    min_amount: float = 0,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get transactional flow data for Sankey visualization.
    Includes circular pattern detection.
    """
    service = FlowTracerService(db)
    return service.trace_payment_flow(project_id, min_amount)

@router.get("/path/{project_id}/{source_id}/{target_id}")
async def trace_path(
    project_id: str,
    source_id: str,
    target_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Find multi-hop transactional paths between two entities.
    """
    service = FlowTracerService(db)
    path_data = service.find_multi_hop_path(project_id, source_id, target_id)
    if not path_data["exists"]:
        raise HTTPException(status_code=404, detail="No transactional flow path found between these entities")
    return path_data
