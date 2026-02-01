import hashlib
import json
from sqlmodel import Session, select, desc
from app.models import AuditLog
from typing import Optional, Any
from datetime import datetime, UTC


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
        Creates an immutable audit log entry with cryptographic chaining.
        """
        # 1. Fetch previous log entry for this entity (or global chain)
        # For Zenith V3, we chain per-entity to allow parallel processing
        stmt = select(AuditLog).where(AuditLog.entity_id == entity_id).order_by(desc(AuditLog.timestamp)).limit(1)
        prev_entry = session.exec(stmt).first()
        
        previous_hash = prev_entry.hash_signature if prev_entry else "GENESIS"
        
        log_entry = AuditLog(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            field_name=field_name,
            old_value=str(old_value) if old_value is not None else None,
            new_value=str(new_value) if new_value is not None else None,
            changed_by_user_id=user_id,
            change_reason=reason,
            timestamp=datetime.now(UTC),
            previous_hash=previous_hash
        )
        
        # 2. Calculate Signature (Hash of current content + previous hash)
        payload = f"{entity_type}:{entity_id}:{action}:{field_name}:{old_value}:{new_value}:{user_id}:{previous_hash}"
        log_entry.hash_signature = hashlib.sha256(payload.encode()).hexdigest()
        
        session.add(log_entry)
        # Note: Caller is responsible for committing the session
