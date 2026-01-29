from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
import uuid
from app.core.db import get_session
from app.models import Asset, Entity, AuditLog, Project
from app.core.auth_middleware import verify_project_access
from pydantic import BaseModel

router = APIRouter(prefix="/forensic/{project_id}/assets", tags=["Asset Recovery"])


class AssetCreate(BaseModel):
    name: str
    type: str
    estimated_value: float
    owner_entity_name: str  # Resolve to ID or create
    location: Optional[str] = None
    metadata_json: Optional[dict] = {}


class AssetUpdate(BaseModel):
    is_frozen: Optional[bool] = None
    estimated_value: Optional[float] = None


class WarrantResponse(BaseModel):
    warrant_id: str
    asset_id: str
    status: str
    generated_at: datetime
    message: str


@router.get("/", response_model=List[Asset])
def get_assets(
    project_id: str,
    project: Project = Depends(verify_project_access),
    frozen_only: bool = False,
    min_value: Optional[float] = None,
    session: Session = Depends(get_session),
):
    query = select(Asset).where(Asset.project_id == project.id)
    if frozen_only:
        query = query.where(Asset.is_frozen is True)
    if min_value:
        query = query.where(Asset.estimated_value >= min_value)
    return session.exec(query).all()


@router.post("/", response_model=Asset)
def create_asset(
    project_id: str,
    asset_in: AssetCreate,
    project: Project = Depends(verify_project_access),
    session: Session = Depends(get_session),
):
    # Find or Create Entity (in project context)
    entity = session.exec(
        select(Entity)
        .where(Entity.name == asset_in.owner_entity_name)
        .where(Entity.project_id == project.id)
    ).first()

    if not entity:
        entity = Entity(name=asset_in.owner_entity_name, type="unknown", project_id=project.id)
        session.add(entity)
        session.commit()
        session.refresh(entity)

    asset = Asset(
        name=asset_in.name,
        type=asset_in.type,
        estimated_value=asset_in.estimated_value,
        owner_entity_id=entity.id,
        project_id=project.id,
        location=asset_in.location,
        metadata_json=asset_in.metadata_json or {},
    )
    session.add(asset)
    session.commit()
    session.refresh(asset)
    return asset


@router.patch("/{asset_id}/verify-link", response_model=Asset)
def verify_asset_link(
    project_id: str,
    asset_id: str,
    verified: bool,
    reason: str = Query(...),
    project: Project = Depends(verify_project_access),
    session: Session = Depends(get_session),
):
    asset = session.exec(
        select(Asset).where(Asset.id == asset_id).where(Asset.project_id == project.id)
    ).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if asset.is_frozen == verified:
        return asset

    asset.is_frozen = verified
    session.add(asset)

    # Audit Log
    log = AuditLog(
        project_id=project.id,
        entity_type="Asset",
        entity_id=asset.id,
        action="VERIFY_ASSET_LINK" if verified else "UNVERIFY_ASSET_LINK",
        field_name="verification_status",
        old_value=str(not verified),
        new_value=str(verified),
        changed_by_user_id="system",
        change_reason=reason,
    )
    session.add(log)
    session.commit()
    session.refresh(asset)
    return asset


@router.post("/{asset_id}/generate-report", response_model=WarrantResponse)
def generate_asset_report(
    project_id: str,
    asset_id: str,
    project: Project = Depends(verify_project_access),
    session: Session = Depends(get_session),
):
    asset = session.exec(
        select(Asset).where(Asset.id == asset_id).where(Asset.project_id == project.id)
    ).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if not asset.is_frozen:
        raise HTTPException(status_code=400, detail="Cannot generate report for unverified asset.")

    report_id = f"REP-{uuid.uuid4().hex[:8].upper()}"
    return WarrantResponse(
        warrant_id=report_id,
        asset_id=asset.id,
        status="GENERATED",
        generated_at=datetime.utcnow(),
        message=f"Forensic Asset Report {report_id} generated for {asset.name}. Ready for analyst review.",
    )
