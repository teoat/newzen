from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.db import get_session
from app.core.auth_middleware import verify_project_admin
from app.models import (
    UserProjectAccess,
    User,
    ProjectRole,
    Notification,
    NotificationType
)


# --- DTOs ---
class ProjectAccessCreate(BaseModel):
    user_id: str
    role: ProjectRole = ProjectRole.VIEWER


class ProjectAccessUpdate(BaseModel):
    role: ProjectRole


class UserAccessResponse(BaseModel):
    user_id: str
    username: str
    full_name: str
    role: ProjectRole
    granted_at: str


# --- Router ---
router = APIRouter(
    prefix="/admin",
    tags=["User Management"],
    responses={404: {"description": "Not found"}},
)


@router.get(
    "/project/{project_id}/users",
    response_model=List[UserAccessResponse]
)
async def list_project_users(
    project_id: str,
    current_user: User = Depends(verify_project_admin),
    db: Session = Depends(get_session)
):
    """
    List all users with access to a specific project.
    Only Project Admins can view this list.
    """
    # SAFETY: Join using proper ON clause
    stmt = (
        select(UserProjectAccess, User)
        .where(UserProjectAccess.project_id == project_id)
        .join(User, User.id == UserProjectAccess.user_id)
    )
    results = db.exec(stmt).all()

    response_data = []
    for access, user in results:
        response_data.append(UserAccessResponse(
            user_id=user.id or "",
            username=user.username,
            full_name=user.full_name,
            role=access.role,
            granted_at=access.granted_at.isoformat()
        ))

    return response_data


@router.post("/project/{project_id}/users")
async def grant_project_access(
    project_id: str,
    access_data: ProjectAccessCreate,
    current_user: User = Depends(verify_project_admin),
    db: Session = Depends(get_session)
):
    """Grant a user access to the project."""
    # SAFETY: Verify user exists
    user_to_add = db.get(User, access_data.user_id)
    if not user_to_add:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # SAFETY: Check if access already exists
    existing_access = db.get(
        UserProjectAccess,
        (access_data.user_id, project_id)
    )
    if existing_access:
        raise HTTPException(
            status_code=400,
            detail="User already has access to this project"
        )

    # Create Access
    new_access = UserProjectAccess(
        user_id=access_data.user_id,
        project_id=project_id,
        role=access_data.role,
        granted_by_id=current_user.id
    )
    db.add(new_access)

    # AUDIT: Notification trail
    msg = (
        f"You have been granted {access_data.role} "
        f"access to Project {project_id}"
    )
    db.add(Notification(
        user_id=access_data.user_id,
        project_id=project_id,
        type=NotificationType.INFO,
        title="Project Access Granted",
        message=msg
    ))

    db.commit()
    db.refresh(new_access)
    return {"message": "Access granted successfully"}


@router.delete("/project/{project_id}/users/{user_id}")
async def revoke_project_access(
    project_id: str,
    user_id: str,
    current_user: User = Depends(verify_project_admin),
    db: Session = Depends(get_session)
):
    """
    Revoke user access.
    PROHIBITED: Admin cannot revoke own access.
    """
    # SAFETY: Prevent admin self-lockout
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="SAFETY: Cannot revoke your own admin access."
        )

    access = db.get(UserProjectAccess, (user_id, project_id))
    if not access:
        raise HTTPException(
            status_code=404,
            detail="Access record not found"
        )

    db.delete(access)
    db.commit()
    return {"message": "Access revoked successfully"}


@router.patch("/project/{project_id}/users/{user_id}")
async def update_user_role(
    project_id: str,
    user_id: str,
    update_data: ProjectAccessUpdate,
    current_user: User = Depends(verify_project_admin),
    db: Session = Depends(get_session)
):
    """Change a user's role."""
    access = db.get(UserProjectAccess, (user_id, project_id))
    if not access:
        raise HTTPException(
            status_code=404,
            detail="Access record not found"
        )

    access.role = update_data.role
    db.add(access)
    db.commit()
    return {"message": "Role updated successfully"}
