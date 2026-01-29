from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from app.core.db import get_session
from app.models import Notification, User, NotificationType
from app.core.security import get_current_user
from app.core.sync import manager

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=List[Notification])
async def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
    project_id: Optional[str] = None,
    limit: int = 20,
):
    """List notifications for the current user."""
    statement = select(Notification).where(Notification.user_id == current_user.id)
    if project_id:
        statement = statement.where(Notification.project_id == project_id)

    statement = statement.order_by(Notification.created_at.desc()).limit(limit)
    return db.exec(statement).all()


@router.patch("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """Mark a notification as read."""
    notification = db.get(Notification, notification_id)
    if not notification or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.add(notification)
    db.commit()
    return {"status": "success"}


@router.post("/broadcast")
async def create_broadcast_notification(
    title: str,
    message: str,
    type: NotificationType = NotificationType.INFO,
    project_id: Optional[str] = None,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),  # Should be admin only
):
    """
    Broadcast a notification to all users (or all users in a project).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    # Logic to find users and create notifications...
    # For now, let's just broadcast via WebSocket
    await manager.broadcast(
        {
            "type": "SYSTEM_NOTIFICATION",
            "title": title,
            "message": message,
            "notification_type": type,
            "project_id": project_id,
        }
    )
    return {"status": "broadcast_sent"}
