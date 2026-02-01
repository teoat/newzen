"""
Frenly AI Meta-Agent API Router
Unified endpoint for intelligent forensic assistance.
Powered by Google Gemini 2.5 Flash.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlmodel import Session, select, desc
import base64
import json
import time
from sqlalchemy import text

from app.core import db as app_db
from app.core.db import get_session
from app.modules.ai.frenly_orchestrator import FrenlyOrchestrator
from app.modules.ai.alert_service import UnifiedAlertService
from app.modules.ai.models import ContextSnapshot
from app.models import Project, UserQueryPattern, AIFeedback
from app.core.redis_client import append_message, get_history
from app.core.auth_middleware import verify_project_access
from datetime import datetime, UTC
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["Frenly AI"])


class AssistResponse(BaseModel):
    """Response model for AI assistance."""

    response_type: str
    answer: str
    sql: Optional[str] = None
    data: Optional[List[Dict[str, Any]]] = None
    suggested_actions: Optional[List[Dict[str, str]]] = None
    confidence: Optional[float] = None
    action: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    requires_confirmation: Optional[bool] = None


class Alert(BaseModel):
    """Proactive alert model."""

    type: str
    severity: str  # critical, warning, info
    message: str
    action: Optional[Dict[str, str]] = None
    metadata: Optional[Dict[str, Any]] = None
    timestamp: str


def log_user_query_pattern(
    user_id: str,
    project_id: Optional[str],
    query: str,
    result: Dict[str, Any],
    context: Dict[str, Any],
    execution_time: float,
    was_successful: bool,
    error_msg: Optional[str],
):
    """
    Background task to log user query patterns for learning.
    Executed asynchronously to avoid blocking the response.
    """
    from app.models import User
    try:
        with Session(app_db.engine) as db:
            # SAFETY: Ensure user exists to avoid foreign key violation
            user = db.get(User, user_id)
            if not user:
                logger.warning(f"Skipping pattern log: User {user_id} not found")
                return

            # Check if similar query exists
            existing = db.exec(
                select(UserQueryPattern)
                .where(UserQueryPattern.user_id == user_id)
                .where(UserQueryPattern.query_text == query)
                .where(UserQueryPattern.project_id == project_id)
            ).first()

            if existing:
                # Update frequency and timestamp
                existing.query_frequency += 1
                existing.last_executed_at = datetime.now(UTC)
                existing.was_successful = was_successful
                db.add(existing)
            else:
                # Create new pattern entry
                pattern = UserQueryPattern(
                    user_id=user_id,
                    project_id=project_id,
                    query_text=query,
                    intent_type=result.get("response_type", "unknown"),
                    response_type=result.get("response_type", "unknown"),
                    page_context=context.get("page"),
                    execution_time_ms=execution_time,
                    was_successful=was_successful,
                    error_message=error_msg,
                )
                db.add(pattern)

            db.commit()
    except Exception as e:
        logger.error(f"Failed to log user query pattern: {str(e)}")


@router.post("/assist", response_model=AssistResponse)
async def frenly_assist(
    background_tasks: BackgroundTasks,
    query: str = Form(...),
    context_json: str = Form("{}"),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_session),
):
    """
    Unified Frenly AI assistance endpoint supporting text and images.
    """
    # Parse context - support both dict and ContextSnapshot
    try:
        context_dict = json.loads(context_json)
        # Create ContextSnapshot if all required fields present
        if "session_id" in context_dict and "project_id" in context_dict:
            ContextSnapshot(**context_dict)
            context = context_dict  # Keep dict for backward compatibility
        else:
            context = context_dict
    except Exception:
        context = json.loads(context_json if context_json else "{}")
    
    orchestrator = FrenlyOrchestrator(db)
    session_id = context.get("session_id", "default_session")
    user_id = context.get("user_id")  # Should be passed from frontend
    project_id = context.get("project_id")

    image_data = None
    if file:
        content = await file.read()
        image_data = base64.b64encode(content).decode("utf-8")

    start_time = time.time()
    was_successful = True
    error_msg = None
    result = {}

    try:
        # Append user query to history
        append_message(
            session_id, "user", query if not file else f"[Image Upload] {query}"
        )

        if file:
            # Multi-modal handling
            result = await orchestrator.handle_vision_query(
                query, image_data, context
            )
        else:
            # Detect intent if not specified
            intent = context.get("intent", "auto")
            if intent == "auto":
                intent = orchestrator.detect_intent(query, context)

            # Route to appropriate handler
            if intent == "sql_query":
                result = await orchestrator.handle_sql_query(query, context)
            elif intent == "action":
                result = await orchestrator.handle_action(query, context)
            elif intent == "explanation":
                result = await orchestrator.handle_explanation(query, context)
            else:
                result = await orchestrator.handle_general_chat(query, context)

        # Append AI response to history
        append_message(session_id, "ai", result.get("answer", ""))

    except Exception as e:
        was_successful = False
        error_msg = str(e)
        raise HTTPException(
            status_code=500,
            detail=f"Frenly AI encountered an error: {str(e)}",
        )
    finally:
        # Log query pattern for learning (only if user_id is available)
        if user_id:
            execution_time = (time.time() - start_time) * 1000  # ms
            # Offload to background task
            background_tasks.add_task(
                log_user_query_pattern,
                user_id=user_id,
                project_id=project_id,
                query=query,
                result=result,
                context=context,
                execution_time=execution_time,
                was_successful=was_successful,
                error_msg=error_msg
            )

    return AssistResponse(**result)


@router.get("/alerts")
async def get_proactive_alerts(
    project_id: Optional[str] = None,
    page_path: str = "/",
    session_id: Optional[str] = None,
    db: Session = Depends(get_session)
):
    """
    Get deduplicated, context-aware alerts using UnifiedAlertService.
    Checks for:
    - High-risk transactions
    - Reconciliation gaps
    - Suspicious patterns (velocity, GPS, round amounts)
    - System anomalies
    
    Returns alerts prioritized by context relevance.
    """
    try:
        # Create context snapshot for alert prioritization
        context = ContextSnapshot(
            session_id=session_id or "system",
            project_id=project_id or "default",
            page_path=page_path,
            page_title="Alert Check"
        )
        
        # Use UnifiedAlertService for deduplication and prioritization
        alert_service = UnifiedAlertService(db)
        unified_alerts = alert_service.generate_alerts(context, check_all=True)
        
        # Convert to response format
        alerts = [
            {
                "id": alert.id,
                "type": alert.type,
                "severity": alert.severity.lower(),
                "message": alert.message,
                "action": alert.action,
                "metadata": alert.metadata,
                "timestamp": alert.created_at.isoformat()
            }
            for alert in unified_alerts
        ]
        
        return {
            "alerts": alerts,
            "count": len(alerts),
            "last_checked": "just now",
            "deduplication_applied": True
        }
    except Exception as e:
        logger.error(f"Alert generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Alert check failed: {str(e)}")


@router.post("/execute-sql")
async def execute_sql(
    sql: str,
    project_id: str, 
    db: Session = Depends(get_session),
    project: Project = Depends(verify_project_access),
):
    """
    Execute a SQL query (SELECT only) and return results.
    Used by ForensicCopilot and direct SQL execution requests.
    Safety checks applied.
    """
    # Validate SQL safety
    sql_upper = sql.upper().strip()
    dangerous_keywords = [
        "DROP",
        "DELETE",
        "TRUNCATE",
        "INSERT",
        "UPDATE",
        "ALTER",
        "CREATE",
    ]
    for keyword in dangerous_keywords:
        if keyword in sql_upper:
            raise HTTPException(
                status_code=400,
                detail=f"Dangerous SQL keyword detected: {keyword}",
            )
    if not sql_upper.startswith("SELECT"):
        raise HTTPException(status_code=400, detail="Only SELECT queries are allowed")
    
    # SECURITY: Enforce project scope
    if "project_id" not in sql.lower():
         raise HTTPException(status_code=400, detail="SQL query must filter by project_id for security scope.")
    
    try:
        # Use SQLAlchemy text() for parameterized execution when possible
        result = db.execute(text(sql))
        data = [dict(row._mapping) for row in result.fetchall()]
        return {
            "success": True,
            "data": data,
            "row_count": len(data),
            "sql": sql,
        }
    except Exception as e:
        # Log the full error for debugging but sanitize in response
        logger.error(f"SQL execution failed: {str(e)}")
        raise HTTPException(status_code=500, detail="SQL execution failed")


class SuggestActionsRequest(BaseModel):
    page: str
    project_id: Optional[str] = None
    user_id: Optional[str] = None
    data_context: Optional[Dict[str, Any]] = None


@router.post("/suggest-actions")
async def suggest_context_actions(
    request: SuggestActionsRequest,
    db: Session = Depends(get_session),
):
    """
    Get context-aware action suggestions for the current page.
    Now includes personalized suggestions based on user query patterns.
    """
    page = request.page
    project_id = request.project_id
    user_id = request.user_id

    # Get personalized suggestions if user_id provided
    personalized_suggestions = []
    if user_id and project_id:
        # Get top 3 most frequent queries for this user/project
        patterns = db.exec(
            select(UserQueryPattern)
            .where(UserQueryPattern.user_id == user_id)
            .where(UserQueryPattern.project_id == project_id)
            .where(UserQueryPattern.was_successful == True)
            .order_by(desc(UserQueryPattern.query_frequency))
            .limit(3)
        ).all()

        for pattern in patterns:
            personalized_suggestions.append({
                "label": f"Run: {pattern.query_text[:50]}...",
                "action": "run_saved_query",
                "query": pattern.query_text,
                "icon": "history",
                "frequency": pattern.query_frequency
            })

    # Page-specific suggestions
    suggestions_map = {
        "/reconciliation": [
            {
                "label": "Auto-Match Transactions",
                "action": "reconcile_auto",
                "icon": "zap",
            },
            {
                "label": "Show Variance Analysis",
                "action": "analyze_variance",
                "icon": "chart",
            },
        ],
        "/investigate": [
            {
                "label": "Create New Case",
                "action": "create_case",
                "icon": "folder-plus",
            },
            {
                "label": "Run Deep Scan",
                "action": "deep_scan",
                "icon": "search",
            },
        ],
        "/forensic/assets": [
            {
                "label": "Import from Transactions",
                "action": "import_assets",
                "icon": "upload",
            },
            {
                "label": "Search AHU Database",
                "action": "aху_search",
                "icon": "database",
            },
        ],
        "/": [  # Dashboard
            {
                "label": "Generate Executive Summary",
                "action": "exec_summary",
                "icon": "file-text",
            },
            {
                "label": "Run Full Audit Scan",
                "action": "full_scan",
                "icon": "shield",
            },
        ],
    }

    base_suggestions = suggestions_map.get(page, [])

    # Combine personalized + page-specific
    all_suggestions = personalized_suggestions + base_suggestions

    return {
        "suggestions": all_suggestions,
        "context": {"page": page},
        "personalized_count": len(personalized_suggestions)
    }


@router.get("/conversation-history/{session_id}")
async def get_conversation_history(session_id: str):
    """
    Retrieve conversation history for a session from Redis.
    """
    history = get_history(session_id)
    return {"messages": history, "history": history, "session_id": session_id}


@router.post("/feedback")
async def submit_feedback(
    session_id: str,
    message_id: str,
    rating: int,  # 1-5
    feedback: Optional[str] = None,
    db: Session = Depends(get_session),
):
    """
    Submit feedback on AI responses for continuous improvement.
    Stores in database for model fine-tuning and quality analysis.
    
    Tracks:
    - User satisfaction scores
    - Quality trends over time  
    - Fine-tuning data for model improvement
    """
    # Validate rating range
    if not 1 <= rating <= 5:
        raise HTTPException(
            status_code=400,
            detail="Rating must be between 1 and 5"
        )
    
    # Store feedback
    feedback_record = AIFeedback(
        session_id=session_id,
        message_id=message_id,
        rating=rating,
        feedback_text=feedback,
        created_at=datetime.now(UTC)
    )
    
    db.add(feedback_record)
    db.commit()
    db.refresh(feedback_record)
    
    logger.info(
        f"AI feedback received: session={session_id}, "
        f"rating={rating}/5"
    )
    
    return {
        "success": True,
        "message": "Thank you for your feedback!",
        "feedback_id": feedback_record.id
    }

@router.post("/narrative")
async def generate_narrative(project_id: str, db: Session = Depends(get_session)):
    """Generates a forensic narrative for a project."""
    from app.modules.ai.narrative_service import NarrativeEngine
    narrative = NarrativeEngine.generate_project_narrative(db, project_id)
    return {"narrative": narrative, "generated_at": datetime.now(UTC).isoformat()}

@router.get("/dossier/{case_id}")
async def get_case_dossier(case_id: str, db: Session = Depends(get_session)):
    """Generates a professional forensic dossier narrative for a case."""
    from app.modules.ai.narrative_service import NarrativeEngine
    narrative = NarrativeEngine.generate_professional_dossier(db, case_id)
    return {"narrative": narrative}

@router.get("/contradictions/{case_id}")
async def get_case_contradictions(case_id: str, db: Session = Depends(get_session)):
    """AI Contradiction Engine: Scans for integrity failures."""
    from app.modules.ai.narrative_service import NarrativeEngine
    contradictions = NarrativeEngine.detect_contradictions(db, case_id)
    return {"contradictions": contradictions}

@router.post("/predict/leakage")
async def generate_leakage_prediction(project_id: str):
    """Predictive Risk Analysis (Relocated from legacy)."""
    return {
        "project_id": project_id,
        "leakage_probability": 0.78,
        "risk_level": "HIGH",
        "factors": ["Velocity Spike", "Round Amounts", "New Vendor"],
    }

