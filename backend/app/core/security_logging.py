"""
Structured logging for security events
Provides comprehensive audit trail with proper log levels and formatting
"""

import json
import logging
import time
import uuid
from datetime import datetime, UTC
from typing import Any, Dict, Optional
from enum import Enum
from functools import wraps
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


class LogLevel(Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class SecurityEventType(Enum):
    # Authentication Events
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAILED = "LOGIN_FAILED"
    LOGOUT = "LOGOUT"
    TOKEN_ISSUED = "TOKEN_ISSUED"
    TOKEN_REFRESHED = "TOKEN_REFRESHED"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    
    # Authorization Events
    ACCESS_GRANTED = "ACCESS_GRANTED"
    ACCESS_DENIED = "ACCESS_DENIED"
    ROLE_ASSIGNED = "ROLE_ASSIGNED"
    PERMISSION_CHECK = "PERMISSION_CHECK"
    
    # Data Access Events
    DATA_READ = "DATA_READ"
    DATA_CREATED = "DATA_CREATED"
    DATA_UPDATED = "DATA_UPDATED"
    DATA_DELETED = "DATA_DELETED"
    DATA_EXPORTED = "DATA_EXPORTED"
    
    # Security Events
    SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    SQL_INJECTION_ATTEMPT = "SQL_INJECTION_ATTEMPT"
    XSS_ATTEMPT = "XSS_ATTEMPT"
    CSRF_ATTEMPT = "CSRF_ATTEMPT"
    BRUTE_FORCE_ATTEMPT = "BRUTE_FORCE_ATTEMPT"
    
    # System Events
    SYSTEM_ERROR = "SYSTEM_ERROR"
    CONFIGURATION_CHANGE = "CONFIGURATION_CHANGE"
    SECURITY_POLICY_VIOLATION = "SECURITY_POLICY_VIOLATION"


class StructuredLogger:
    """
    Structured logger for security events with JSON formatting
    """
    
    def __init__(self, name: str = "security"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        
        # Configure JSON formatter
        formatter = logging.Formatter(
            '%(message)s'  # We'll format as JSON ourselves
        )
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)
        
        # File handler for security logs
        try:
            file_handler = logging.FileHandler("logs/security.log")
            file_handler.setFormatter(formatter)
            self.logger.addHandler(file_handler)
        except Exception:
            # Fallback if log directory doesn't exist
            pass
    
    def _create_log_entry(
        self,
        level: LogLevel,
        event_type: SecurityEventType,
        message: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        request_id: Optional[str] = None,
        resource: Optional[str] = None,
        action: Optional[str] = None,
        outcome: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Create structured log entry"""
        if timestamp is None:
            timestamp = datetime.now(UTC)
        
        entry = {
            "timestamp": timestamp.isoformat() + "Z",
            "level": level.value,
            "event_type": event_type.value,
            "message": message,
            "log_id": str(uuid.uuid4()),
        }
        
        # Add optional fields
        if user_id:
            entry["user_id"] = user_id
        if session_id:
            entry["session_id"] = session_id
        if ip_address:
            entry["ip_address"] = ip_address
        if user_agent:
            entry["user_agent"] = user_agent
        if request_id:
            entry["request_id"] = request_id
        if resource:
            entry["resource"] = resource
        if action:
            entry["action"] = action
        if outcome:
            entry["outcome"] = outcome
        if details:
            entry["details"] = details
        
        return entry
    
    def log(
        self,
        level: LogLevel,
        event_type: SecurityEventType,
        message: str,
        **kwargs
    ):
        """Log security event"""
        entry = self._create_log_entry(
            level=level,
            event_type=event_type,
            message=message,
            **kwargs
        )
        
        # Log as JSON string
        json_message = json.dumps(entry, default=str)
        
        if level == LogLevel.DEBUG:
            self.logger.debug(json_message)
        elif level == LogLevel.INFO:
            self.logger.info(json_message)
        elif level == LogLevel.WARNING:
            self.logger.warning(json_message)
        elif level == LogLevel.ERROR:
            self.logger.error(json_message)
        elif level == LogLevel.CRITICAL:
            self.logger.critical(json_message)
    
    def login_success(
        self,
        user_id: str,
        ip_address: str,
        user_agent: str,
        session_id: Optional[str] = None
    ):
        """Log successful login"""
        self.log(
            level=LogLevel.INFO,
            event_type=SecurityEventType.LOGIN_SUCCESS,
            message="User successfully authenticated",
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            session_id=session_id
        )
    
    def login_failed(
        self,
        username: str,
        ip_address: str,
        user_agent: str,
        reason: str,
        session_id: Optional[str] = None
    ):
        """Log failed login attempt"""
        self.log(
            level=LogLevel.WARNING,
            event_type=SecurityEventType.LOGIN_FAILED,
            message=f"Login attempt failed for user: {username}",
            user_id=username,  # Use username since we don't have user_id
            ip_address=ip_address,
            user_agent=user_agent,
            session_id=session_id,
            details={"reason": reason, "username": username}
        )
    
    def access_denied(
        self,
        user_id: str,
        resource: str,
        action: str,
        ip_address: str,
        reason: str
    ):
        """Log access denied event"""
        self.log(
            level=LogLevel.WARNING,
            event_type=SecurityEventType.ACCESS_DENIED,
            message=f"Access denied for user {user_id} to {resource}",
            user_id=user_id,
            resource=resource,
            action=action,
            ip_address=ip_address,
            outcome="denied",
            details={"reason": reason}
        )
    
    def suspicious_activity(
        self,
        description: str,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        """Log suspicious activity"""
        self.log(
            level=LogLevel.ERROR,
            event_type=SecurityEventType.SUSPICIOUS_ACTIVITY,
            message=description,
            user_id=user_id,
            ip_address=ip_address,
            details=details
        )
    
    def data_access(
        self,
        user_id: str,
        resource: str,
        action: str,
        ip_address: str,
        outcome: str = "success"
    ):
        """Log data access event"""
        self.log(
            level=LogLevel.INFO,
            event_type=SecurityEventType.DATA_READ,
            message=f"User {user_id} accessed {resource}",
            user_id=user_id,
            resource=resource,
            action=action,
            ip_address=ip_address,
            outcome=outcome
        )


# Global security logger instance
security_logger = StructuredLogger()


def log_security_event(event_type: SecurityEventType, level: LogLevel = LogLevel.INFO):
    """
    Decorator for logging security events automatically
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request_id = str(uuid.uuid4())
            
            # Extract request information if available
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if request:
                ip_address = request.headers.get("x-forwarded-for", request.client.host)
                user_agent = request.headers.get("user-agent", "")
                
                # Add request context to kwargs
                kwargs.update({
                    "request_id": request_id,
                    "ip_address": ip_address,
                    "user_agent": user_agent
                })
            
            try:
                result = await func(*args, **kwargs)
                
                # Log successful execution
                security_logger.log(
                    level=level,
                    event_type=event_type,
                    message=f"Successfully executed {func.__name__}",
                    action=func.__name__,
                    outcome="success",
                    **kwargs
                )
                
                return result
                
            except Exception as e:
                # Log error
                security_logger.log(
                    level=LogLevel.ERROR,
                    event_type=SecurityEventType.SYSTEM_ERROR,
                    message=f"Error in {func.__name__}: {str(e)}",
                    action=func.__name__,
                    outcome="error",
                    details={"error": str(e), "traceback": str(e.__traceback__)},
                    **kwargs
                )
                raise
                
        return wrapper
    return decorator


class SecurityLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all HTTP requests for security monitoring
    """
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        request_id = str(uuid.uuid4())
        
        # Extract request information
        ip_address = request.headers.get("x-forwarded-for", request.client.host)
        user_agent = request.headers.get("user-agent", "")
        auth_header = request.headers.get("authorization", "")
        
        # Log request start
        security_logger.log(
            level=LogLevel.INFO,
            event_type=SecurityEventType.DATA_READ,
            message=f"{request.method} {request.url.path}",
            request_id=request_id,
            ip_address=ip_address,
            user_agent=user_agent,
            resource=request.url.path,
            action=request.method,
            details={
                "method": request.method,
                "path": request.url.path,
                "query_params": str(request.query_params),
                "has_auth": bool(auth_header)
            }
        )
        
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log response
            security_logger.log(
                level=LogLevel.INFO,
                event_type=SecurityEventType.DATA_READ,
                message=f"{request.method} {request.url.path} - {response.status_code}",
                request_id=request_id,
                ip_address=ip_address,
                resource=request.url.path,
                action=f"{request.method}_response",
                outcome="success" if response.status_code < 400 else "error",
                details={
                    "status_code": response.status_code,
                    "duration_ms": round(duration * 1000, 2),
                    "response_size": response.headers.get("content-length", "unknown")
                }
            )
            
            return response
            
        except Exception as e:
            # Log unhandled exception
            security_logger.log(
                level=LogLevel.ERROR,
                event_type=SecurityEventType.SYSTEM_ERROR,
                message=f"Unhandled exception in {request.method} {request.url.path}: {str(e)}",
                request_id=request_id,
                ip_address=ip_address,
                resource=request.url.path,
                action="unhandled_exception",
                outcome="error",
                details={"error": str(e)}
            )
            raise


def setup_security_logging(app):
    """Setup security logging for FastAPI app"""
    app.add_middleware(SecurityLoggingMiddleware)