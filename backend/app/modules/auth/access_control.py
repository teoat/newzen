"""
User-Project Access Control Models and Middleware
This module provides role-based authorization for project access.
Ensures users can only access projects they have permission to view.
"""

from typing import Optional
from datetime import datetime
from uuid import uuid4
from sqlmodel import SQLModel, Field
from enum import Enum


class ProjectRole(str, Enum):
    """User roles within a project context."""

    VIEWER = "viewer"  # Read-only access
    ANALYST = "analyst"  # Can create/edit analysis, run tools
    ADMIN = "admin"  # Full control, can add/remove users


class UserProjectAccess(SQLModel, table=True):
    """
    Maps users to projects with role-based permissions.
    Enables multi-project workspaces with granular access control.
    """

    __tablename__ = "user_project_access"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    project_id: str = Field(foreign_key="project.id", index=True)
    # Role assignment
    role: ProjectRole = Field(default=ProjectRole.VIEWER)
    # Timestamps
    granted_at: datetime = Field(default_factory=datetime.utcnow)
    granted_by: Optional[str] = Field(
        default=None, foreign_key="user.id"
    )  # Admin who granted access
    # Revocation tracking
    is_active: bool = Field(default=True)
    revoked_at: Optional[datetime] = None
    revoked_by: Optional[str] = Field(default=None, foreign_key="user.id")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user-uuid-123",
                "project_id": "project-uuid-456",
                "role": "analyst",
                "granted_at": "2026-01-29T08:00:00Z",
            }
        }
