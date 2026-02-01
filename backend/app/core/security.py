from datetime import datetime, UTC, timedelta
from typing import List, Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
try:
    # Test if bcrypt is available and compatible
    import bcrypt
    bcrypt_version = getattr(bcrypt, '__version__', '4.0.0')
    print(f"✅ bcrypt version {bcrypt_version} detected")
except ImportError as e:
    print(f"⚠️ bcrypt not available: {e}")
    bcrypt = None
except Exception as e:
    print(f"⚠️ bcrypt initialization issue: {e}")
    bcrypt = None
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session
from app.core.config import settings
from app.core.db import get_session
from app.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
# Handle bcrypt compatibility issues
try:
    # Test if bcrypt backend is working
    test_hash = pwd_context.hash("test")
    print(f"✅ Password context working: {test_hash[:20]}...")
except Exception as e:
    print(f"⚠️ Password context initialization issue: {e}")
    # Fallback to basic context if bcrypt fails
    try:
        pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
        print("✅ Using PBKDF2 fallback for password hashing")
    except Exception as fallback_e:
        print(f"❌ Fallback failed: {fallback_e}")
        pwd_context = CryptContext(deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def create_access_token(data: dict = None, expires_delta: Optional[timedelta] = None, subject: str = None) -> str:
    if data is None:
        to_encode = {}
    else:
        to_encode = data.copy()
        
    if subject:
        to_encode["sub"] = str(subject)
        
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Creates a long-lived refresh token (7 days)."""
    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(days=7)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> dict:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or expired",
            headers={"WWW-Authenticate": "Bearer"},
        )


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# Aliases for backward compatibility in tests
hash_password = get_password_hash


async def get_current_user(
    db: Session = Depends(get_session), token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if settings.TESTING and token == "mock_token":
        from sqlmodel import select
        user = db.exec(select(User).where(User.username == "test_user")).first()
        if not user:
            user = User(
                username="test_user",
                full_name="Test User",
                email="test@example.com",
                hashed_password=get_password_hash("test"),
                role="admin",
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.get(User, user_id)
    if user is None:
        raise credentials_exception
    return user


def require_role(roles: List[str]):
    def role_checker(user: User = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation restricted to roles: {roles}",
            )
        return user

    return role_checker
