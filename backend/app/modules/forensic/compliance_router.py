from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from app.core.db import get_session
from app.models import Transaction, Project, TransactionCategory
from app.core.auth_middleware import verify_project_access

router = APIRouter(prefix="/compliance", tags=["Compliance Engine"])


@router.get("/{project_id}/report")
async def get_compliance_report(
    project: Project = Depends(verify_project_access), db: Session = Depends(get_session)
):
    """
    Generates a compliance report by checking transactions against regulatory rules.
    """
    # Rule 1: High Cash Transactions (> 100M IDR)
    high_cash = db.exec(
        select(Transaction).where(
            Transaction.project_id == project.id,
            Transaction.actual_amount > 100_000_000,
            func.upper(Transaction.description).contains("CASH")
            | func.upper(Transaction.description).contains("TUNAI"),
        )
    ).all()

    # Rule 2: Evidence Gaps (Locked transactions)
    evidence_gaps = db.exec(
        select(Transaction).where(
            Transaction.project_id == project.id, Transaction.status == "locked"
        )
    ).all()

    # Rule 3: Personal Leakage (XP category)
    personal_leakage = db.exec(
        select(Transaction).where(
            Transaction.project_id == project.id,
            Transaction.category_code == TransactionCategory.XP,
        )
    ).all()

    # Rule 4: High Inflation (> 20% variance)
    high_inflation = db.exec(
        select(Transaction).where(
            Transaction.project_id == project.id,
            Transaction.delta_inflation > (Transaction.proposed_amount * 0.2),
        )
    ).all()

    return {
        "project_name": project.name,
        "compliance_score": calculate_compliance_score(
            len(high_cash), len(evidence_gaps), len(personal_leakage), len(high_inflation)
        ),
        "findings": [
            {
                "rule": "High Value Cash Control",
                "severity": "CRITICAL",
                "count": len(high_cash),
                "description": "Transactions over 100M IDR made in cash violate anti-structuring protocols.",
                "items": [t.id for t in high_cash[:5]],
            },
            {
                "rule": "Mandatory Evidence Documentation",
                "severity": "HIGH",
                "count": len(evidence_gaps),
                "description": "Transactions flagged as 'BUTUH BUKTI' missing valid attachments.",
                "items": [t.id for t in evidence_gaps[:5]],
            },
            {
                "rule": "Personal Expense Quarantine",
                "severity": "MEDIUM",
                "count": len(personal_leakage),
                "description": "Expenses categorized as personal/family use identified in project ledger.",
                "items": [t.id for t in personal_leakage[:5]],
            },
            {
                "rule": "Fiscal Variance Limit",
                "severity": "HIGH",
                "count": len(high_inflation),
                "description": "Transactions exceeding 20% markup over proposed contract value.",
                "items": [t.id for t in high_inflation[:5]],
            },
        ],
    }


def calculate_compliance_score(c1, c2, c3, c4):
    penalty = (c1 * 10) + (c2 * 5) + (c3 * 3) + (c4 * 7)
    return max(0, 100 - penalty)
