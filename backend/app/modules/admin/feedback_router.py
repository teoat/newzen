from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.core.db import get_session
from app.models import UserFeedback, User
from app.core.security import get_current_user

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post("/")
async def submit_feedback(
    feedback: UserFeedback,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    feedback.user_id = current_user.id
    db.add(feedback)
    db.commit()
    return {"status": "thank_you"}
