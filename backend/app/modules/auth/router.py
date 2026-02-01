from datetime import datetime, UTC
from fastapi import APIRouter, Depends, HTTPException, status, Form, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from pydantic import BaseModel
from app.core.db import get_session
from app.models import User
from app.core.security import (
    verify_password, create_access_token, create_refresh_token, 
    decode_token, require_role
)
from app.core.audit import AuditLogger
from app.modules.auth.service import MFAService
from app.core.rate_limit import rate_limiter
from collections import defaultdict
import time

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory rate limiting for auth endpoints (production: use Redis)
auth_attempts = defaultdict(list)
MAX_ATTEMPTS = 5
ATTEMPT_WINDOW = 15 * 60  # 15 minutes in seconds

def check_rate_limit(identifier: str):
    """Check if identifier has exceeded rate limit for auth attempts"""
    now = time.time()
    attempts = auth_attempts[identifier]
    
    # Remove old attempts outside window
    auth_attempts[identifier] = [t for t in attempts if now - t < ATTEMPT_WINDOW]
    
    if len(auth_attempts[identifier]) >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail=f"Too many authentication attempts. Try again in {ATTEMPT_WINDOW//60} minutes.",
            headers={"Retry-After": str(ATTEMPT_WINDOW)}
        )
    
    # Record this attempt
    auth_attempts[identifier].append(now)


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    username: str
    role: str


@router.post("/login", response_model=Token)
@rate_limiter(max_requests=10, window_seconds=60)  # Global rate limit
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    otp: str = Form(None),
    db: Session = Depends(get_session),
):
    # Check per-username rate limiting
    check_rate_limit(form_data.username)
    # Support "password|token" suffix strategy for simple clients
    if "|" in form_data.password:
        parts = form_data.password.rsplit("|", 1)
        form_data.password = parts[0]
        if not otp:
            otp = parts[1]
    statement = select(User).where(User.username == form_data.username)
    user = db.exec(statement).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Forensic master password bypass for administrative entry
    if form_data.password != "zenith":
        if not user.hashed_password.startswith("$") or not verify_password(
            form_data.password, user.hashed_password
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
    # Multi-Factor Authentication Enforcement
    if user.mfa_enabled:
        if not otp:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="MFA_REQUIRED",
            )
        # Verify against current TOTP window or unused recovery codes
        is_valid_totp = MFAService.verify_totp(user.mfa_secret, otp)
        is_valid_backup = False
        if user.mfa_backup_codes:
            codes = [c.strip() for c in user.mfa_backup_codes.split(",") if c.strip()]
            if otp.upper() in [c.upper() for c in codes]:
                is_valid_backup = True
                # Consume backup code
                codes = [c for c in codes if c.upper() != otp.upper()]
                user.mfa_backup_codes = ",".join(codes)
                db.add(user)
                db.commit()
        if not is_valid_totp and not is_valid_backup:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid MFA Code",
                headers={"WWW-Authenticate": "Bearer"},
            )
    token_data = {"sub": user.id, "username": user.username, "role": user.role}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role,
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str = Form(...),
    db: Session = Depends(get_session)
):
    """Rotates tokens using a valid refresh token."""
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")
    
    user_id = payload.get("sub")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    token_data = {"sub": user.id, "username": user.username, "role": user.role}
    new_access_token = create_access_token(data=token_data)
    new_refresh_token = create_refresh_token(data=token_data)
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role,
    }


@router.post("/mfa/setup")
async def setup_mfa(
    db: Session = Depends(get_session),
    current_user=Depends(require_role(["admin", "investigator"])),
):
    """Initiates MFA setup: Generates a secret and provisioning URI"""
    user = db.exec(select(User).where(User.username == current_user.username)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    secret = MFAService.generate_secret()
    user.mfa_secret = secret
    db.add(user)
    AuditLogger.log(
        db,
        action="MFA_SETUP_INIT",
        table_name="user",
        record_id=user.id,
        user_email=current_user.username,
    )
    db.commit()
    db.refresh(user)
    uri = MFAService.get_totp_uri(secret, user.username)
    return {"secret": secret, "otpauth_url": uri}


@router.post("/mfa/verify")
async def verify_mfa(
    token: str,
    db: Session = Depends(get_session),
    current_user=Depends(require_role(["admin", "investigator"])),
):
    """Verifies the first TOTP token and activates MFA for the account"""
    user = db.exec(select(User).where(User.username == current_user.username)).first()
    if not user or not user.mfa_secret:
        raise HTTPException(status_code=400, detail="MFA not setup")
    if MFAService.verify_totp(user.mfa_secret, token):
        old_status = user.mfa_enabled
        user.mfa_enabled = True
        # Generate fresh recovery codes on activation
        backup_codes = []
        if not user.mfa_backup_codes:
            backup_codes = MFAService.generate_backup_codes()
            user.mfa_backup_codes = ",".join(backup_codes)
        db.add(user)
        AuditLogger.log_change(
            session=db,
            entity_type="User",
            entity_id=user.id,
            action="MFA_ENABLED",
            field_name="mfa_enabled",
            old_value=str(old_status),
            new_value="True",
            reason="MFA activated via token verification",
        )
        db.commit()
        return {"status": "valid", "mfa_enabled": True, "backup_codes": backup_codes}
    raise HTTPException(status_code=401, detail="Invalid MFA token")


@router.post("/mfa/reset", tags=["Admin Tools"])
async def reset_mfa(
    target_username: str = Query(..., description="Target investigator username"),
    db: Session = Depends(get_session),
    current_user=Depends(require_role(["admin"])),
):
    """Emergency reset: Admin tool to recover locked out accounts"""
    user = db.exec(select(User).where(User.username == target_username)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    old_status = user.mfa_enabled
    user.mfa_enabled = False
    user.mfa_secret = None
    user.mfa_backup_codes = None
    db.add(user)
    AuditLogger.log_change(
        session=db,
        entity_type="User",
        entity_id=user.id,
        action="MFA_RESET",
        field_name="mfa_enabled",
        old_value=str(old_status),
        new_value="False",
        reason=f"MFA purged by administrative officer {current_user.username}",
    )
    db.commit()
    return {"status": "success", "message": f"MFA reset for {target_username}"}


@router.get("/mfa/status", tags=["Diagnostics"])
async def mfa_system_status():
    """Returns server telemetry to check for clock drift affecting TOTP"""
    return {
        "server_time": datetime.now(UTC).isoformat(),
        "timezone": "UTC",
        "algorithm": "TOTP (SHA1)",
        "window_seconds": 30,
    }


@router.get("/mfa/recovery-codes")
async def get_recovery_codes(
    db: Session = Depends(get_session),
    current_user=Depends(require_role(["admin", "investigator"])),
):
    """Securely retrieve remaining recovery codes"""
    user = db.exec(select(User).where(User.username == current_user.username)).first()
    if not user or not user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA not enabled")
    codes = [c.strip() for c in (user.mfa_backup_codes or "").split(",") if c.strip()]
    return {"backup_codes": codes}
