"""
Network Graph API - Real graph visualization endpoints.

v3.0 Upgrade: Replaces HOLOGRAPHIC mock data with real NetworkX-based analysis.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.core.db import get_session
from app.core.security import get_current_user
from app.models import User
from app.services.network_service import NetworkService

router = APIRouter(tags=["Graph V2"])


@router.get("/network/{project_id}")
async def get_network_graph(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    """
    Get real network graph for a project.
    
    v3.0: Replaces HOLOGRAPHIC_SOURCE.nexus data.
    
    Returns:
        {
            "nodes": [{"id": str, "label": str, "group": str, ...}],
            "links": [{"source": str, "target": str, "value": float, ...}],
            "stats": {"total_nodes": int, "total_edges": int, ...}
        }
    """
    service = NetworkService(db)
    try:
        result = await service.build_network(project_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to build network: {str(e)}")


@router.get("/shortest-path/{project_id}")
async def find_shortest_path(
    project_id: str,
    source: str = Query(..., description="Source entity name"),
    target: str = Query(..., description="Target entity name"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    """
    Find shortest path between two entities.
    
    v3.0 Feature: Real graph traversal for fund flow tracing.
    """
    service = NetworkService(db)
    try:
        result = await service.find_shortest_path(project_id, source, target)
        
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Path finding failed: {str(e)}")


@router.get("/communities/{project_id}")
async def detect_communities(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    """
    Detect communities/clusters in the transaction network.
    
    v3.0 Feature: Identifies coordinated fraud schemes.
    """
    service = NetworkService(db)
    try:
        result = await service.detect_communities(project_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Community detection failed: {str(e)}")


@router.get("/cycles/{project_id}")
async def detect_circular_patterns(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    """
    Detect circular payment patterns (fund injection schemes).
    
    v3.0 Feature: Real cycle detection replaces static mock data.
    """
    service = NetworkService(db)
    try:
        result = await service.detect_cycles(project_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cycle detection failed: {str(e)}")


@router.get("/neighbors/{project_id}/{entity_id}")
async def get_entity_neighbors(
    project_id: str,
    entity_id: str,
    depth: int = Query(1, ge=1, le=3, description="Network depth to explore"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    """
    Get all neighbors of an entity up to specified depth.
    
    v3.0 Feature: Multi-hop network exploration.
    """
    service = NetworkService(db)
    try:
        result = await service.get_entity_neighbors(project_id, entity_id, depth)
        
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Neighbor query failed: {str(e)}")


# Legacy endpoints (keeping for backwards compatibility)
@router.get("/neighborhood/{entity_id}")
async def get_neighborhood(
    entity_id: str,
    depth: int = 3,
    db: Session = Depends(get_session)
):
    """
    DEPRECATED: Use /neighbors/{project_id}/{entity_id} instead.
    """
    return {
        "warning": "This endpoint is deprecated",
        "use_instead": f"/api/v2/graph/neighbors/{{project_id}}/{entity_id}?depth={depth}"
    }


@router.post("/cliques")
async def detect_cliques():
    """
    DEPRECATED: Use /communities/{project_id} instead.
    """
    return {
        "warning": "This endpoint is deprecated",
        "use_instead": "/api/v2/graph/communities/{project_id}"
    }
