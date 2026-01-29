from sqlmodel import Session
from app.models import AuditLog
from typing import Optional, Any
from datetime import datetime


class AuditLogger:
    @staticmethod
    def log_change(
        session: Session,
        entity_type: str,
        entity_id: str,
        action: str,
        field_name: Optional[str] = None,
        old_value: Any = None,
        new_value: Any = None,
        user_id: Optional[str] = None,
        reason: Optional[str] = None,
    ):
        """
        Creates an immutable audit log entry.
        """
        log_entry = AuditLog(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            field_name=field_name,
            old_value=str(old_value) if old_value is not None else None,
            new_value=str(new_value) if new_value is not None else None,
            changed_by_user_id=user_id,
            change_reason=reason,
            timestamp=datetime.utcnow(),
        )
        session.add(log_entry)
        # Note: Caller is responsible for committing the session
