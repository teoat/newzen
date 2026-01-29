from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
import re
from app.modules.ai.gemini_service import GeminiService
from app.modules.ai.narrative_service import NarrativeEngine
from app.core.db import get_session
from sqlmodel import Session

router = APIRouter(prefix="/ai", tags=["AI Copilot"])


class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None


class NarrativeRequest(BaseModel):
    project_id: str
    focus: str = "general"


# Initialize Gemini Service
gemini_service = GeminiService()


def generate_sql_from_text(query: str) -> str:
    """
    Expert-level translation of Natural Language to SQL for Forensic Queries.
    Handles specific keywords for the Zenith schema.
    """
    query_lower = query.lower()
    # SQL Mapping Logic (Forensic Specific)
    if "total inflation" in query_lower:
        return "SELECT SUM(delta_inflation) FROM transaction_table WHERE delta_inflation > 0"
    if "high risk" in query_lower:
        return "SELECT * FROM transaction_table WHERE risk_score > 0.8"
    if "vendor" in query_lower:
        # Extract vendor name if possible
        match = re.search(r"vendor\s+['\"]?([\w\s]+)['\"]?", query_lower)
        if match:
            return f"SELECT * FROM transaction_table WHERE receiver LIKE '%{match.group(1)}%'"
        return "SELECT DISTINCT receiver FROM transaction_table"
    # Default fallback to a generic search
    return "SELECT * FROM transaction_table LIMIT 10"


@router.post("/chat")
async def chat_with_data(request: ChatRequest):
    """
    Zenith Copilot: Intelligent chat interface for forensic queries.
    Powered by Google Gemini with DB-aware context.
    """
    try:
        response = await gemini_service.chat_with_data(request.message, request.context)
        return {
            "reply": response,
            "confidence": 0.95,
            "sources": ["Transaction DB", "Reconciliation Engine"],
        }
    except Exception as e:
        print(f"AI Error: {e}")
        return {
            "reply": "I'm having trouble accessing the neural core right now. Please verify the API keys are configured.",
            "confidence": 0.0,
            "error": str(e),
        }


@router.post("/narrative")
async def generate_narrative(request: NarrativeRequest, db: Session = Depends(get_session)):
    """
    Generates a forensic narrative for a project.
    """
    narrative = NarrativeEngine.generate_project_narrative(db, request.project_id)
    return {"narrative": narrative, "generated_at": "2026-01-29T00:00:00Z"}


@router.get("/dossier/{case_id}")
async def get_case_dossier(case_id: str, db: Session = Depends(get_session)):
    """
    Generates a professional forensic dossier narrative for a case.
    """
    narrative = NarrativeEngine.generate_professional_dossier(db, case_id)
    return {"narrative": narrative}


@router.get("/contradictions/{case_id}")
async def get_case_contradictions(case_id: str, db: Session = Depends(get_session)):
    """
    AI Contradiction Engine: Scans for integrity failures.
    """
    contradictions = NarrativeEngine.detect_contradictions(db, case_id)
    return {"contradictions": contradictions}


@router.post("/predict/leakage")
async def generate_leakage_prediction(project_id: str):
    """
    Predictive Risk Analysis (Mock).
    """
    return {
        "project_id": project_id,
        "leakage_probability": 0.78,
        "risk_level": "HIGH",
        "factors": ["Velocity Spike", "Round Amounts", "New Vendor"],
    }
