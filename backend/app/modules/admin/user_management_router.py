from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Dict, Any
from app.core.db import get_session
from app.models import User, UserProjectAccess, ProjectRole, AuditLog
from pydantic import BaseModel


from app.core.auth_middleware import verify_project_admin
from app.core.security import get_current_user

router = APIRouter(prefix="/admin", tags=["User Management"])

class GrantAccessRequest(BaseModel):
    user_id: str
    project_id: str
    role: ProjectRole = ProjectRole.VIEWER


@router.get("/project/{project_id}/users", response_model=List[Dict[str, Any]])
async def list_project_users(
    project_id: str,
    db: Session = Depends(get_session),
    _admin: Any = Depends(verify_project_admin)
):
    """List users who have access to a specific project."""
    statement = (
        select(User, UserProjectAccess.role)
        .join(UserProjectAccess)
        .where(UserProjectAccess.project_id == project_id)
    )
    results = db.exec(statement).all()
    return [{"user": r[0], "role": r[1]} for r in results]


@router.post("/project/access")
async def grant_project_access(
    request: GrantAccessRequest,
    db: Session = Depends(get_session),
    current_admin: User = Depends(verify_project_admin)
):
    """Grant a user access to a project."""
    # Check if access already exists
    existing = db.exec(
        select(UserProjectAccess).where(
            UserProjectAccess.user_id == request.user_id,
            UserProjectAccess.project_id == request.project_id,
        )
    ).first()

    action = "UPDATE_ACCESS" if existing else "GRANT_ACCESS"
    old_role = existing.role if existing else None

    if existing:
        existing.role = request.role
        db.add(existing)
    else:
        new_access = UserProjectAccess(
            user_id=request.user_id, project_id=request.project_id, role=request.role
        )
        db.add(new_access)

    # Create Audit Log
    audit = AuditLog(
        entity_type="ProjectAccess",
        entity_id=f"{request.project_id}:{request.user_id}",
        action=action,
        field_name="role",
        old_value=str(old_role) if old_role else None,
        new_value=str(request.role),
        changed_by_user_id=current_admin.id,
        change_reason="Admin update via User Management UI"
    )
    db.add(audit)

    db.commit()
    return {"status": "success", "message": f"Access granted to project {request.project_id}"}


@router.delete("/project/{project_id}/user/{user_id}")
async def revoke_project_access(
    project_id: str,
    user_id: str,
    db: Session = Depends(get_session),
    current_admin: User = Depends(verify_project_admin)
):
    """Revoke a user's access to a project."""
    access = db.exec(
        select(UserProjectAccess).where(
            UserProjectAccess.user_id == user_id, UserProjectAccess.project_id == project_id
        )
    ).first()

    if not access:
        raise HTTPException(status_code=404, detail="Access record not found")

    # Create Audit Log
    audit = AuditLog(
        entity_type="ProjectAccess",
        entity_id=f"{project_id}:{user_id}",
        action="REVOKE_ACCESS",
        old_value=str(access.role),
        changed_by_user_id=current_admin.id,
        change_reason="Admin revocation via User Management UI"
    )
    db.add(audit)

    db.delete(access)
    db.commit()
    return {"status": "success", "message": "Access revoked"}

@router.get("/users", response_model=List[User])
async def list_all_users(
    db: Session = Depends(get_session),
    _user: Any = Depends(get_current_user)
):
    """List all users in the system (requires global login)."""
    return db.exec(select(User)).all()
