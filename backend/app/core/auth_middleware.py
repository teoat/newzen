"""
Project Authorization Middleware
Provides dependency injection functions to verify user access to projects.
Use as FastAPI dependencies in route handlers.
"""

from fastapi import Depends, HTTPException, status
from sqlmodel import Session, select
from app.core.db import get_session
from app.models import Project, User, UserProjectAccess, ProjectRole
from typing import Optional, List


from app.core.security import get_current_user


async def verify_project_access(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
    required_role: Optional[ProjectRole] = None,
) -> Project:
    """
    Middleware to verify user has access to a project.
    Args:
        project_id: Project UUID to check access for
        current_user: Authenticated user from JWT/session
        db: Database session
        required_role: Minimum role required (None = any role)
    Returns:
        Project object if authorized
    Raises:
        HTTPException: 403 if unauthorized, 404 if project not found
    """
    # Check if project exists
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found",
        )
    # Check user access
    access = db.exec(
        select(UserProjectAccess)
        .where(UserProjectAccess.user_id == current_user.id)
        .where(UserProjectAccess.project_id == project_id)
    ).first()
    if not access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this project",
        )
    # Check role requirements
    if required_role:
        role_hierarchy = {
            ProjectRole.VIEWER: 1,
            ProjectRole.ANALYST: 2,
            ProjectRole.ADMIN: 3,
        }
        if role_hierarchy.get(access.role, 0) < role_hierarchy.get(required_role, 99):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {required_role} role or higher",
            )
    return project


async def verify_project_admin(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
) -> Project:
    """
    Shorthand for requiring ADMIN role.
    Use for sensitive operations like user management, project deletion.
    """
    return await verify_project_access(
        project_id, current_user, db, required_role=ProjectRole.ADMIN
    )


async def get_user_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
) -> List[Project]:
    """
    Get all projects the current user has access to.
    Used by project listing endpoint.
    """
    # Get all access records for user
    access_records = db.exec(
        select(UserProjectAccess).where(UserProjectAccess.user_id == current_user.id)
    ).all()
    # Fetch projects
    project_ids = [a.project_id for a in access_records]
    projects = db.exec(select(Project).where(Project.id.in_(project_ids))).all()
    return list(projects)
