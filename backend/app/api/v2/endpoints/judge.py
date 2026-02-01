from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from typing import Any

from app.core.db import get_session
from app.services.intelligence.judge_service import JudgeService
from app.core.security import get_current_user
from app.core.cache import cache_result
from app.models import Case
from sqlmodel import select


router = APIRouter(tags=["The Judge - Autonomous Adjudication"])


@router.post("/verdict/{case_id}")
async def generate_case_verdict(
    case_id: str,
    db: Session = Depends(get_session),
    current_user: Any = Depends(get_current_user)
):
    """
    Autonomously generate a prosecution-ready verdict package for a case.
    """
    try:
        service = JudgeService(db)
        verdict = await service.generate_verdict_package(case_id)
        return verdict
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/document/{case_id}")
async def generate_legal_document(
    case_id: str,
    doc_type: str = Query(..., description="subpoena, freezing_order, audit_finding"),
    db: Session = Depends(get_session),
    current_user: Any = Depends(get_current_user)
):
    """
    Draft formal legal documents based on case evidence.
    """
    try:
        service = JudgeService(db)
        doc = await service.draft_legal_document(case_id, doc_type)
        return doc
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/prosecution-probability/{case_id}")
@cache_result(ttl=3600)
async def get_prosecution_probability(
    case_id: str,
    db: Session = Depends(get_session),
    current_user: Any = Depends(get_current_user)
):
    """
    Quick check of prosecution probability for internal review.
    """
    try:
        service = JudgeService(db)
        case_obj = db.exec(select(Case).where(Case.id == case_id)).first()
        if not case_obj:
            raise HTTPException(status_code=404, detail="Case not found")

        evidence_list = await service._gather_and_hash_evidence(case_id)
        confidence = await service._calculate_confidence_score(
            case_obj, evidence_list
        )
        return confidence
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
