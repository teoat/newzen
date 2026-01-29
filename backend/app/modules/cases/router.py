from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from app.core.db import get_session
from app.core.event_bus import publish_event, EventType
from app.models import (
    Case,
    CaseStatus,
    CasePriority,
    CaseExhibit,
    ExhibitStatus,
    Entity,
    Project,
)
from app.core.auth_middleware import verify_project_access
from datetime import datetime
import hashlib

from app.core.sync import manager

router = APIRouter(prefix="/cases", tags=["Cases"])


@router.get("/{project_id}", response_model=List[Case])
async def list_cases(
    project: Project = Depends(verify_project_access),
    status: Optional[CaseStatus] = None,
    priority: Optional[CasePriority] = None,
    db: Session = Depends(get_session),
):
    query = select(Case).where(Case.project_id == project.id)
    if status:
        query = query.where(Case.status == status)
    if priority:
        query = query.where(Case.priority == priority)
    return db.exec(query).all()


@router.post("/{project_id}", response_model=Case)
async def create_case(
    case: Case,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    case.project_id = project.id
    db.add(case)
    db.commit()
    db.refresh(case)
    # Real-time Broadcast
    await manager.broadcast(
        {
            "type": "CASE_SEALED",
            "case_id": case.id,
            "project_id": project.id,
            "hash": case.final_report_hash,
            "message": f"Case {case.title} has been SEALED and ANCHORED.",
        }
    )
    # Publish CASE_CLOSED event

    publish_event(
        EventType.CASE_CLOSED,
        {
            "case_id": case.id,
            "case_title": case.title,
            "sealed_at": case.sealed_at.isoformat() if case.sealed_at else None,
            "report_hash": case.final_report_hash,
        },
    )
    return {"status": "sealed", "report_hash": case.final_report_hash}


@router.post("/{project_id}/{case_id}/exhibits")
async def add_exhibit(
    project_id: str,
    case_id: str,
    exhibit: CaseExhibit,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    Adds a new evidence exhibit to the case with an immediate hash signature.
    """
    case = db.exec(select(Case).where(Case.id == case_id, Case.project_id == project.id)).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found in this project")
    exhibit.case_id = case_id
    # In a real app we'd fetch the source evidence to calculate hash,
    # here we assume frontend sends it or we mock it.
    if not exhibit.hash_signature:
        exhibit.hash_signature = hashlib.sha256(str(datetime.utcnow()).encode()).hexdigest()
    db.add(exhibit)
    db.commit()
    db.refresh(exhibit)
    # Publish EVIDENCE_ADDED event
    publish_event(
        EventType.EVIDENCE_ADDED,
        {
            "case_id": case_id,
            "exhibit_id": exhibit.id,
            "evidence_type": exhibit.evidence_type,
            "evidence_id": exhibit.evidence_id,
            "hash_signature": exhibit.hash_signature,
        },
    )
    return exhibit


@router.get("/{project_id}/{case_id}/exhibits", response_model=List[CaseExhibit])
async def list_exhibits(
    project_id: str,
    case_id: str,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    case = db.exec(select(Case).where(Case.id == case_id, Case.project_id == project.id)).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found in this project")
    return db.exec(select(CaseExhibit).where(CaseExhibit.case_id == case_id)).all()


@router.patch("/{project_id}/{case_id}/exhibits/{exhibit_id}")
async def update_exhibit(
    project_id: str,
    case_id: str,
    exhibit_id: str,
    updates: dict,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    Updates an exhibit's verdict and triggers Risk Propagation logic.
    """
    case = db.exec(select(Case).where(Case.id == case_id, Case.project_id == project.id)).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found in this project")
    exhibit = db.get(CaseExhibit, exhibit_id)
    if not exhibit or exhibit.case_id != case_id:
        raise HTTPException(status_code=404, detail="Exhibit not found")
    old_verdict = exhibit.verdict
    for key, value in updates.items():
        if hasattr(exhibit, key):
            setattr(exhibit, key, value)
    # RISK PROPAGATION ENGINE
    # If an entity exhibit is ADMITTED, propagate risk to the global Entity table
    if exhibit.verdict == ExhibitStatus.ADMITTED and old_verdict != ExhibitStatus.ADMITTED:
        if exhibit.evidence_type == "entity":
            entity = db.get(Entity, exhibit.evidence_id)
            if entity:
                # Escalation logic: Increment risk score based on adjudication
                inc = exhibit.metadata_json.get("risk_increment", 20.0)
                entity.risk_score = min(100.0, entity.risk_score + inc)
                db.add(entity)
    exhibit.adjudicated_at = datetime.utcnow()
    db.add(exhibit)
    db.commit()
    db.refresh(exhibit)
    # Publish EVIDENCE_ADDED event for exhibit updates
    if exhibit.verdict == ExhibitStatus.ADMITTED and old_verdict != ExhibitStatus.ADMITTED:
        publish_event(
            EventType.EVIDENCE_ADDED,
            {
                "case_id": case_id,
                "exhibit_id": exhibit.id,
                "verdict": (
                    exhibit.verdict.value
                    if hasattr(exhibit.verdict, "value")
                    else str(exhibit.verdict)
                ),
                "risk_propagated": exhibit.evidence_type == "entity",
                "action": "admitted",
            },
        )
    return exhibit


@router.delete("/{project_id}/{case_id}/exhibits/{exhibit_id}")
async def delete_exhibit(
    project_id: str,
    case_id: str,
    exhibit_id: str,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    case = db.exec(select(Case).where(Case.id == case_id, Case.project_id == project.id)).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found in this project")
    exhibit = db.get(CaseExhibit, exhibit_id)
    if not exhibit or exhibit.case_id != case_id:
        raise HTTPException(status_code=404, detail="Exhibit not found")
    db.delete(exhibit)
    db.commit()
    return {"status": "deleted"}
