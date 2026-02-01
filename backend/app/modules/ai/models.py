"""
AI Module Data Models
Pydantic models for Frenly AI context, alerts, and messages
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime, UTC


class ContextSnapshot(BaseModel):
    """
    Unified context passed from frontend to backend.
    Contains complete information about user's current state.
    """
    session_id: str
    user_id: Optional[str] = None
    project_id: str
    # Page context
    page_path: str = Field(
        ..., description="Current page route, e.g., /reconciliation"
    )
    page_title: str = Field(default="", description="Human-readable page title")
    # Data context - what the user is currently viewing/interacting with
    selected_transaction_ids: List[str] = Field(default_factory=list)
    active_case_id: Optional[str] = None
    active_vendor_id: Optional[str] = None
    applied_filters: Dict[str, Any] = Field(default_factory=dict)
    # UI state (optional, for advanced context)
    scroll_position: Optional[int] = None
    visible_data_range: Optional[Dict[str, Any]] = None
    # Recent user actions (last 5 clicks/filters applied)
    recent_actions: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Track user interactions for workflow understanding",
    )
    # Additional metadata
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "session_id": "sess_abc123",
                "user_id": "user_001",
                "project_id": "ZENITH-001",
                "page_path": "/reconciliation",
                "page_title": "Reconciliation Workspace",
                "selected_transaction_ids": ["TXN-4821", "TXN-4822"],
                "active_case_id": "CASE-101",
                "applied_filters": {"category": "Construction", "min_amount": 1000},
                "recent_actions": [
                    {
                        "type": "filter_applied",
                        "filter": "high_risk",
                        "timestamp": "2024-01-30T08:00:00Z",
                    },
                    {
                        "type": "transaction_selected",
                        "id": "TXN-4821",
                        "timestamp": "2024-01-30T08:01:00Z",
                    },
                ],
            }
        }
    )


class UnifiedAlert(BaseModel):
    """
    Standardized alert model for both database and event-driven alerts
    """
    id: str
    type: str = Field(
        ...,
        description="Alert category: VELOCITY_BURST, GPS_ANOMALY, HIGH_RISK, etc.",
    )
    severity: str = Field(..., description="CRITICAL, HIGH, MEDIUM, LOW")
    message: str

    # Related entities
    project_id: Optional[str] = None
    transaction_id: Optional[str] = None
    vendor_id: Optional[str] = None
    case_id: Optional[str] = None

    # Action suggestion
    action: Optional[Dict[str, str]] = Field(
        default=None,
        description="Suggested action with label and route"
    )

    # Metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)
    fingerprint: str = Field(..., description="Hash for deduplication")
    source: str = Field(
        ..., description="Generator: ProactiveMonitor, EventListener, Manual"
    )

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    expires_at: Optional[datetime] = None

    # User interaction
    dismissed_by: Optional[str] = None
    dismissed_at: Optional[datetime] = None


class ConversationMessageCreate(BaseModel):
    """Request model for storing conversation messages"""
    session_id: str
    role: str = Field(..., description="'user' or 'ai'")
    content: str

    # Context at time of message
    context: ContextSnapshot

    # Additional metadata
    intent: Optional[str] = None
    sql_executed: Optional[str] = None
    action_taken: Optional[str] = None


class ConversationMessageResponse(BaseModel):
    """Response model for retrieved messages"""
    id: str
    session_id: str
    role: str
    content: str
    intent: Optional[str]
    created_at: datetime

    # Context summary (not full snapshot for performance)
    page_path: str
    project_id: str


class AssistRequest(BaseModel):
    """Enhanced request model for /ai/assist endpoint"""
    query: str
    context: ContextSnapshot
    include_history: bool = Field(
        default=True, description="Include conversation memory"
    )
    history_limit: int = Field(
        default=5, description="Number of past messages to include"
    )
