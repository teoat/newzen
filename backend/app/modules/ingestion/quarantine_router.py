from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from app.core.db import get_session
from app.models import QuarantineRow

router = APIRouter(prefix="/ingestion/quarantine", tags=["ingestion"])


class QuarantineStats(BaseModel):
    total: int
    new: int
    repaired: int
    needs_attention: int


class ManualFixRequest(BaseModel):
    corrected_content: str
    notes: Optional[str] = None


@router.get("/stats", response_model=QuarantineStats)
def get_stats(
    project_id: Optional[str] = None, db: Session = Depends(get_session)
):
    query = select(QuarantineRow)
    if project_id:
        query = query.where(QuarantineRow.project_id == project_id)

    rows = db.exec(query).all()

    return {
        "total": len(rows),
        "new": len([r for r in rows if r.status == "new"]),
        "repaired": len([r for r in rows if r.status == "repaired"]),
        "needs_attention": len(
            [r for r in rows if r.status == "needs_specialist"]
        ),
    }


@router.get("/", response_model=List[QuarantineRow])
def list_quarantine(
    status: Optional[str] = None,
    project_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_session),
):
    query = select(QuarantineRow)
    if status:
        query = query.where(QuarantineRow.status == status)
    if project_id:
        query = query.where(QuarantineRow.project_id == project_id)

    query = query.order_by(QuarantineRow.created_at.desc()).limit(limit)
    return db.exec(query).all()


@router.get("/{row_id}", response_model=QuarantineRow)
def get_quarantine_row(row_id: str, db: Session = Depends(get_session)):
    row = db.get(QuarantineRow, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Quarantine row not found")
    return row


@router.post("/{row_id}/resolve")
def resolve_row(
    row_id: str, fix: ManualFixRequest, db: Session = Depends(get_session)
):
    """
    Apply a manual fix from the UI (Doctor's Orders).
    """
    row = db.get(QuarantineRow, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Quarantine row not found")

    # Update Data
    row.raw_content = fix.corrected_content
    row.status = "fixed_manually"

    # Trigger re-injection via batch tasks
    from app.tasks.batch_tasks import submit_batch_processing_job
    import json

    try:
        # Re-parse the fixed content
        is_json = isinstance(row.raw_content, str) and row.raw_content.startswith("{")
        items = [json.loads(row.raw_content)] if is_json else [row.raw_content]

        submit_batch_processing_job(
            items=items, project_id=row.project_id, data_type="re-ingestion"
        )
    except Exception as e:
        row.notes = f"Re-injection failed: {str(e)}"
        row.status = "error"

    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{row_id}")
def dismiss_row(row_id: str, db: Session = Depends(get_session)):
    """
    DNR (Do Not Resuscitate) - Ignore this error.
    """
    row = db.get(QuarantineRow, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Quarantine row not found")

    row.status = "ignored"
    db.add(row)
    db.commit()
    return {"status": "success", "message": "Row ignored"}
