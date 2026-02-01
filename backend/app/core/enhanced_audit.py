"""
Comprehensive Audit Logging System
Provides centralized, structured logging for all operations
"""

import json
import logging
import traceback
import uuid
import os
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from enum import Enum

class LogLevel(Enum):
    TRACE = "trace"
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"
    FATAL = "fatal"

class AuditCategory(Enum):
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    DATA_ACCESS = "data_access"
    API_REQUEST = "api_request"
    DATABASE_OPERATION = "database_operation"
    BUSINESS_LOGIC = "business_logic"
    SECURITY_EVENT = "security_event"
    SYSTEM_OPERATION = "system_operation"
    USER_ACTION = "user_action"
    INGESTION = "ingestion"
    PERFORMANCE = "performance"
    ERROR_HANDLING = "error_handling"

class AuditAction(Enum):
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    PERMISSION_GRANTED = "permission_granted"
    PERMISSION_DENIED = "permission_denied"
    DATA_CREATE = "data_create"
    DATA_READ = "data_read"
    DATA_UPDATE = "data_update"
    DATA_DELETE = "data_delete"
    API_ENDPOINT_CALLED = "api_endpoint_called"
    SQL_QUERY_EXECUTED = "sql_query_executed"
    SYSTEM_STARTUP = "system_startup"
    SYSTEM_SHUTDOWN = "system_shutdown"
    BATCH_PROCESSING = "batch_processing"
    FILE_UPLOAD = "file_upload"
    FILE_DOWNLOAD = "file_download"

@dataclass
class AuditLog:
    timestamp: str
    log_id: str
    level: str
    category: str
    action: str
    user_id: Optional[str]
    session_id: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    resource: Optional[str]
    outcome: str
    message: str
    details: Dict[str, Any]
    duration_ms: Optional[float]
    stack_trace: Optional[str]
    correlation_id: Optional[str]
    tags: List[str]

class EnhancedAuditLogger:
    """
    Production-ready audit logging with multiple outputs
    """
    
    def __init__(self):
        self.setup_loggers()
        
        # In-memory buffer for structured logs
        self.log_buffer = []
        self.buffer_size = 1000
        
        # Configuration
        self.log_format = os.getenv("AUDIT_LOG_FORMAT", "json")  # json, structured, plain
        self.file_logging = os.getenv("AUDIT_FILE_LOGGING", "true").lower() == "true"
        self.redis_logging = os.getenv("AUDIT_REDIS_LOGGING", "true").lower() == "true"
        
        # Retention settings
        self.retention_days = int(os.getenv("AUDIT_RETENTION_DAYS", "30"))
        
        # Statistics
        self.stats = {
            "logs_written": 0,
            "logs_failed": 0,
            "last_rotation": None,
            "buffer_full_count": 0
        }
    
    def setup_loggers(self):
        """Setup different loggers for audit logging"""
        
        # File logger
        if self.file_logging:
            self.file_logger = logging.getLogger("audit_file")
            handler = logging.FileHandler("logs/audit.log", mode='a')
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            self.file_logger.addHandler(handler)
            self.file_logger.setLevel(logging.INFO)
        
        # Redis logger
        if self.redis_logging:
            from app.core.redis_client import redis_client
            self.redis_client = redis_client
        
        # Console logger for development
        self.console_logger = logging.getLogger("audit_console")
        console_handler = logging.StreamHandler()
        console_formatter = logging.Formatter(
            '%(asctime)s [AUDIT] %(levelname)s: %(message)s'
        )
        console_handler.setFormatter(console_formatter)
        self.console_logger.addHandler(console_handler)
        self.console_logger.setLevel(logging.INFO)
    
    def log_event(self, 
                  level: LogLevel, 
                  category: AuditCategory, 
                  action: AuditAction, 
                  message: str, 
                  user_id: Optional[str] = None,
                  session_id: Optional[str] = None,
                  ip_address: Optional[str] = None,
                  user_agent: Optional[str] = None,
                  resource: Optional[str] = None,
                  outcome: str = "success",
                  details: Dict[str, Any] = None,
                  duration_ms: Optional[float] = None,
                  stack_trace: Optional[str] = None,
                  correlation_id: Optional[str] = None,
                  tags: List[str] = None):
        """Log an audit event with full context"""
        
        try:
            audit_log = AuditLog(
                timestamp=datetime.now(timezone.utc).isoformat(),
                log_id=str(uuid.uuid4()),
                level=level.value,
                category=category.value,
                action=action.value,
                user_id=user_id,
                session_id=session_id,
                ip_address=ip_address,
                user_agent=user_agent,
                resource=resource,
                outcome=outcome,
                message=message,
                details=details or {},
                duration_ms=duration_ms,
                stack_trace=stack_trace,
                correlation_id=correlation_id,
                tags=tags or []
            )
            
            # Add to buffer
            self.log_buffer.append(audit_log)
            
            # Check buffer size and flush if needed
            if len(self.log_buffer) >= self.buffer_size:
                self.flush_buffer()
            
            # Log based on configuration
            if self.file_logging:
                self.log_to_file(audit_log)
            
            if self.redis_logging:
                self.log_to_redis(audit_log)
            
            # Always log critical/fatal to console
            if level in [LogLevel.CRITICAL, LogLevel.FATAL]:
                self.console_logger.error(f"[{level.value.upper()}] {message}")
                if stack_trace:
                    self.console_logger.error(f"Stack trace: {stack_trace}")
            
            self.stats["logs_written"] += 1
            
        except Exception as e:
            self.stats["logs_failed"] += 1
            self.console_logger.error(f"Failed to log audit event: {e}")
    
    def log_to_file(self, audit_log: AuditLog):
        """Log audit event to file"""
        try:
            log_entry = json.dumps(asdict(audit_log), default=str)
            self.file_logger.info(log_entry)
        except Exception as e:
            self.stats["logs_failed"] += 1
            self.console_logger.error(f"Failed to log to file: {e}")
    
    def log_to_redis(self, audit_log: AuditLog):
        """Log audit event to Redis"""
        try:
            if not self.redis_client:
                return
            
            log_key = f"audit:{audit_log.timestamp[:10]}:{audit_log.category}"
            log_data = json.dumps(asdict(audit_log), default=str)
            
            # Store in Redis with TTL (30 days)
            self.redis_client.lpush(log_key, log_data)
            self.redis_client.expire(log_key, self.retention_days * 86400)  # Convert days to seconds
            
            # Store index for quick lookup
            index_data = {
                "log_id": audit_log.log_id,
                "timestamp": audit_log.timestamp,
                "level": audit_log.level,
                "category": audit_log.category,
                "user_id": audit_log.user_id,
                "outcome": audit_log.outcome
            }
            
            self.redis_client.lpush("audit:index", json.dumps(index_data))
            self.redis_client.expire("audit:index", self.retention_days * 86400)
            
            # Store recent logs (last 10000)
            self.redis_client.lpush("audit:recent", log_data)
            self.redis_client.ltrim("audit:recent", 0, 9999)
            
        except Exception as e:
            self.stats["logs_failed"] += 1
            self.console_logger.error(f"Failed to log to Redis: {e}")
    
    def flush_buffer(self):
        """Flush log buffer to storage"""
        try:
            if not self.log_buffer:
                return
            
            if self.file_logging:
                # Batch write to file
                log_entries = [json.dumps(asdict(log), default=str) for log in self.log_buffer]
                self.file_logger.info("\n".join(log_entries))
            
            if self.redis_logging:
                # Batch write to Redis
                for log in self.log_buffer:
                    self.log_to_redis(log)
            
            buffer_size = len(self.log_buffer)
            self.log_buffer.clear()
            
            if buffer_size >= self.buffer_size:
                self.stats["buffer_full_count"] += 1
            
            self.console_logger.info(f"Flushed {buffer_size} audit log entries")
            
        except Exception as e:
            self.stats["logs_failed"] += len(self.log_buffer)
            self.console_logger.error(f"Failed to flush buffer: {e}")
            self.log_buffer.clear()
    
    def rotate_logs(self):
        """Rotate log files based on retention policy"""
        try:
            if not self.file_logging:
                return
            
            log_file = "logs/audit.log"
            rotated_file = f"logs/audit_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
            
            if os.path.exists(log_file):
                os.rename(log_file, rotated_file)
            
            self.stats["last_rotation"] = datetime.now().isoformat()
            self.console_logger.info("Log files rotated")
            
            # Cleanup old logs beyond retention
            self.cleanup_old_logs()
            
        except Exception as e:
            self.console_logger.error(f"Failed to rotate logs: {e}")
    
    def cleanup_old_logs(self):
        """Clean up old log files based on retention policy"""
        try:
            import glob
            from datetime import datetime, timedelta
            
            log_files = glob.glob("logs/audit_*.log")
            cutoff_date = datetime.now() - timedelta(days=self.retention_days)
            
            for log_file in log_files:
                try:
                    # Extract date from filename
                    file_date_str = os.path.basename(log_file).replace("audit_", "").replace(".log", "")
                    file_date = datetime.strptime(file_date_str, "%Y%m%d_%H%M%S")
                    
                    if file_date < cutoff_date:
                        os.remove(log_file)
                        self.console_logger.info(f"Removed old log file: {log_file}")
                        
                except Exception:
                    continue
                    
        except Exception as e:
            self.console_logger.error(f"Failed to cleanup old logs: {e}")
    
    def query_audit_logs(self, 
                       category: Optional[AuditCategory] = None,
                       level: Optional[LogLevel] = None,
                       user_id: Optional[str] = None,
                       session_id: Optional[str] = None,
                       start_date: Optional[str] = None,
                       end_date: Optional[str] = None,
                       limit: int = 100) -> List[Dict[str, Any]]:
        """Query audit logs with filters"""
        try:
            results = []
            
            if self.redis_logging:
                # Use Redis index for efficient querying
                index_entries = self.redis_client.lrange("audit:index", 0, -1)
                
                for entry in index_entries:
                    try:
                        entry_data = json.loads(entry)
                        
                        # Apply filters
                        if category and entry_data.get("category") != category.value:
                            continue
                        
                        if level and entry_data.get("level") != level.value:
                            continue
                        
                        if user_id and entry_data.get("user_id") != user_id:
                            continue
                        
                        if session_id and entry_data.get("session_id") != session_id:
                            continue
                        
                        if start_date and entry_data.get("timestamp") < start_date:
                            continue
                        
                        if end_date and entry_data.get("timestamp") > end_date:
                            continue
                        
                        results.append(entry_data)
                        
                        if len(results) >= limit:
                            break
                            
                    except Exception:
                        continue
            
            return results[:limit]
            
        except Exception as e:
            self.console_logger.error(f"Failed to query audit logs: {e}")
            return []
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get audit logging statistics"""
        return {
            "current_buffer_size": len(self.log_buffer),
            "configuration": {
                "log_format": self.log_format,
                "file_logging": self.file_logging,
                "redis_logging": self.redis_logging,
                "retention_days": self.retention_days,
                "buffer_size": self.buffer_size
            },
            **self.stats
        }
    
    def export_logs(self, format: str = "json", category: Optional[AuditCategory] = None) -> str:
        """Export audit logs in specified format"""
        try:
            logs = self.query_audit_logs(category=category, limit=10000)
            
            if format.lower() == "json":
                return json.dumps(logs, indent=2, default=str)
            
            elif format.lower() == "csv":
                import csv
                import io
                
                output = io.StringIO()
                if logs:
                    writer = csv.DictWriter(output, fieldnames=logs[0].keys())
                    writer.writeheader()
                    writer.writerows(logs)
                
                return output.getvalue()
            
            else:
                raise ValueError(f"Unsupported export format: {format}")
                
        except Exception as e:
            self.console_logger.error(f"Failed to export logs: {e}")
            return ""

# Convenience decorator for function logging
def audit_log(category: AuditCategory, action: AuditAction, level: LogLevel = LogLevel.INFO):
    """Decorator for automatic function auditing"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            try:
                result = func(*args, **kwargs)
                
                # Extract context from kwargs if available
                user_id = kwargs.get("current_user_id")
                session_id = kwargs.get("session_id")
                ip_address = kwargs.get("ip_address")
                
                enhanced_logger.log_event(
                    level=level,
                    category=category,
                    action=action,
                    message=f"Function {func.__name__} executed successfully",
                    user_id=user_id,
                    session_id=session_id,
                    ip_address=ip_address,
                    resource=func.__module__,
                    outcome="success",
                    details={"args_count": len(args), "kwargs_count": len(kwargs)}
                )
                
                return result
                
            except Exception as e:
                enhanced_logger.log_event(
                    level=LogLevel.ERROR,
                    category=category,
                    action=action,
                    message=f"Function {func.__name__} failed: {str(e)}",
                    stack_trace=traceback.format_exc(),
                    resource=func.__module__,
                    outcome="error",
                    details={"error_type": type(e).__name__}
                )
                
                raise
        
        return wrapper

# Singleton instance
enhanced_logger = EnhancedAuditLogger()

# Convenience functions
def log_auth_event(user_id: str, action: AuditAction, outcome: str = "success", details: Dict[str, Any] = None):
    """Log authentication events"""
    enhanced_logger.log_event(
        level=LogLevel.INFO if outcome == "success" else LogLevel.WARNING,
        category=AuditCategory.AUTHENTICATION,
        action=action,
        message=f"Authentication {action.value} - {outcome}",
        user_id=user_id,
        outcome=outcome,
        details=details
    )

def log_data_access(user_id: str, action: AuditAction, resource: str, outcome: str = "success"):
    """Log data access events"""
    enhanced_logger.log_event(
        level=LogLevel.INFO if outcome == "success" else LogLevel.WARNING,
        category=AuditCategory.DATA_ACCESS,
        action=action,
        message=f"Data {action.value} - {resource} - {outcome}",
        user_id=user_id,
        resource=resource,
        outcome=outcome
    )

def log_api_request(user_id: str, endpoint: str, method: str, status_code: int, duration_ms: float):
    """Log API request events"""
    enhanced_logger.log_event(
        level=LogLevel.INFO if 200 <= status_code < 300 else LogLevel.WARNING,
        category=AuditCategory.API_REQUEST,
        action=AuditAction.API_ENDPOINT_CALLED,
        message=f"API {method} {endpoint} - {status_code}",
        user_id=user_id,
        resource=endpoint,
        outcome="success" if 200 <= status_code < 300 else "error",
        duration_ms=duration_ms,
        details={
            "method": method,
            "status_code": status_code,
            "endpoint": endpoint
        }
    )

def log_security_event(severity: LogLevel, action: str, message: str, details: Dict[str, Any] = None):
    """Log security events"""
    enhanced_logger.log_event(
        level=severity,
        category=AuditCategory.SECURITY_EVENT,
        action=AuditAction.SYSTEM_STARTUP,  # Using as generic
        message=message,
        outcome="alert" if severity in [LogLevel.CRITICAL, LogLevel.FATAL] else "warning",
        details=details
    )