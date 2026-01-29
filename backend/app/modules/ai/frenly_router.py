"""
Frenly AI Meta-Agent API Router
Unified endpoint for intelligent forensic assistance.
Powered by Google Gemini 2.5 Flash.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlmodel import Session
import base64
from app.core.db import get_session
from app.modules.ai.frenly_orchestrator import FrenlyOrchestrator, ProactiveMonitor
from app.core.redis_client import redis_client
from datetime import datetime

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


@router.post("/assist", response_model=AssistResponse)
async def frenly_assist(
    query: str = Form(...),
    context_json: str = Form("{}"),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_session),
):
    """
    Unified Frenly AI assistance endpoint supporting text and images.
    """
    import json
    import time
    from app.models import UserQueryPattern
    from sqlmodel import select

    context = json.loads(context_json)
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
        redis_client.append_message(
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
        redis_client.append_message(session_id, "ai", result.get("answer", ""))

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
                existing.last_executed_at = datetime.utcnow()
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

    return AssistResponse(**result)


@router.get("/alerts")
async def get_proactive_alerts(
    project_id: Optional[str] = None, db: Session = Depends(get_session)
):
    """
    Get proactive alerts from background monitoring.
    Checks for:
    - High-risk transactions
    - Reconciliation gaps
    - Suspicious patterns
    - System anomalies
    """
    monitor = ProactiveMonitor(db)
    try:
        alerts = await monitor.run_checks(project_id)
        return {
            "alerts": alerts,
            "count": len(alerts),
            "last_checked": "just now",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Alert check failed: {str(e)}")


@router.post("/execute-sql")
async def execute_sql(
    sql: str,
    project_id: Optional[str] = None,
    db: Session = Depends(get_session),
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
    try:
        result = db.execute(sql)
        data = [dict(row._mapping) for row in result.fetchall()]
        return {
            "success": True,
            "data": data,
            "row_count": len(data),
            "sql": sql,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SQL execution failed: {str(e)}")


@router.post("/suggest-actions")
async def suggest_context_actions(
    page: str,
    project_id: Optional[str] = None,
    user_id: Optional[str] = None,
    data_context: Optional[Dict] = None,
    db: Session = Depends(get_session),
):
    """
    Get context-aware action suggestions for the current page.
    Now includes personalized suggestions based on user query patterns.
    """
    from app.models import UserQueryPattern
    from sqlmodel import select, desc

    FrenlyOrchestrator(db)

    # Get personalized suggestions if user_id provided
    personalized_suggestions = []
    if user_id and project_id:
        # Get top 3 most frequent queries for this user/project
        patterns = db.exec(
            select(UserQueryPattern)
            .where(UserQueryPattern.user_id == user_id)
            .where(UserQueryPattern.project_id == project_id)
            .where(UserQueryPattern.was_successful is True)
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
    history = redis_client.get_history(session_id)
    return {"messages": history, "session_id": session_id}


@router.post("/feedback")
async def submit_feedback(
    session_id: str,
    message_id: str,
    rating: int,  # 1-5
    feedback: Optional[str] = None,
):
    """
    Submit feedback on AI responses for continuous improvement.
    Stores in database for model fine-tuning and quality analysis.
    """
    # TODO: Store in database
    return {
        "success": True,
        "message": "Thank you for your feedback!",
    }
