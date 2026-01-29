from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
import math
from app.core.db import get_session

from app.models import Transaction, Entity, CopilotInsight, Project
from app.core.auth_middleware import verify_project_access
from app.modules.ingestion.tasks import VectorEngine, ReconciliationEngine

router = APIRouter(prefix="/forensic/mcp", tags=["Forensic MCP"])


class EntitySearchQuery(BaseModel):
    query: str
    min_confidence: float = 0.7
    limit: int = 5


class ReconciliationRequest(BaseModel):
    # project_id coming from path now
    method: str = "waterfall"  # waterfall, fuzzy, burst, circular, benford, striping


@router.get("/{project_id}/rationale/{transaction_id}")
async def get_forensic_rationale(
    project_id: str,
    transaction_id: str,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    MCP Tool: get_forensic_rationale
    Exposes the inner monologue/reasoning and semantic context for a specific transaction.
    """
    txn = db.get(Transaction, transaction_id)
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    # Fetch related insights
    insights = db.exec(
        select(CopilotInsight).where(CopilotInsight.metadata_json["source_tx"] == transaction_id)
    ).all()
    return {
        "transaction_id": txn.id,
        "description": txn.description,
        "category_code": txn.category_code,
        "amount": txn.amount or txn.actual_amount,
        "reasoning": (txn.metadata_json.get("reasoning", {}) if txn.metadata_json else {}),
        "anomalies": (txn.metadata_json.get("anomalies", []) if txn.metadata_json else []),
        "related_insights": [i.content for i in insights],
    }


@router.post("/{project_id}/search-entities")
async def find_semantic_entities(
    project_id: str,
    payload: EntitySearchQuery,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    MCP Tool: find_semantic_entities
    Vector search for entities across the entire database.
    """
    query_vector = VectorEngine.encode(payload.query)
    if not query_vector:
        return {"results": []}
    # Fetch all entities with embeddings (Naive search for now, PgVector in prod)
    # In a real heavy production, this would be `ORDER BY embedding <-> query_vector`
    entities = db.exec(select(Entity).where(Entity.embeddings_json is not None)).all()
    results = []
    for ent in entities:
        if not ent.embeddings_json:
            continue
        v_ent = ent.embeddings_json
        # Cosine Similarity
        dot = sum(a * b for a, b in zip(query_vector, v_ent))
        mag1 = math.sqrt(sum(a * a for a in query_vector))
        mag2 = math.sqrt(sum(b * b for b in v_ent))
        if mag1 == 0 or mag2 == 0:
            score = 0.0
        else:
            score = dot / (mag1 * mag2)
        if score >= payload.min_confidence:
            results.append(
                {
                    "entity_id": ent.id,
                    "name": ent.name,
                    "type": ent.type,
                    "risk_score": ent.risk_score,
                    "similarity": score,
                }
            )
    # Sort by similarity descending
    results.sort(key=lambda x: x["similarity"], reverse=True)
    return {"results": results[: payload.limit]}


@router.post("/{project_id}/optimize-reconciliation")
async def optimize_reconciliation(
    project_id: str,
    payload: ReconciliationRequest,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    MCP Tool: optimize_reconciliation
    Trigger specific reconciliation strategies (Waterfall, Fuzzy, Burst, etc.).
    """
    pid = project.id
    method = payload.method.lower()
    if method == "waterfall":
        return ReconciliationEngine.match_waterfall(db, pid)
    elif method == "fuzzy":
        return ReconciliationEngine.fuzzy_reconcile_vector(db, pid)
    elif method == "burst":
        return ReconciliationEngine.detect_structuring_bursts(db, pid)
    elif method == "circular":
        return ReconciliationEngine.cross_project_circular_logic(db, pid)
    elif method == "benford":
        return ReconciliationEngine.benfords_anomaly_scan(db, pid)
    elif method == "striping":
        return ReconciliationEngine.strip_overhead_mismatch(db, pid)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown method details: {method}")
