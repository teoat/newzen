"""
Architecture improvements to address circular dependencies
Provides dependency injection, service layer abstraction, and module boundaries
"""

from abc import ABC, abstractmethod
from typing import Dict, TypeVar, Any, Optional
from sqlmodel import Session
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T')


class ServiceRegistry:
    """
    Centralized service registry for dependency injection
    Prevents circular dependencies by managing service lifecycle
    """
    
    def __init__(self):
        self._services: Dict[str, Any] = {}
        self._factories: Dict[str, callable] = {}
        self._singletons: Dict[str, Any] = {}
    
    def register(self, name: str, factory: callable, singleton: bool = False):
        """Register a service factory"""
        self._factories[name] = factory
        if singleton:
            # Pre-create singleton
            self._singletons[name] = factory()
    
    def get(self, name: str) -> Any:
        """Get a service instance"""
        if name in self._singletons:
            return self._singletons[name]
        
        if name not in self._factories:
            raise ValueError(f"Service '{name}' not registered")
        
        return self._factories[name]()
    
    def register_instance(self, name: str, instance: Any):
        """Register a specific instance"""
        self._services[name] = instance
    
    def get_instance(self, name: str) -> Any:
        """Get a registered instance"""
        if name not in self._services:
            raise ValueError(f"Instance '{name}' not registered")
        return self._services[name]


# Global service registry
service_registry = ServiceRegistry()


class BaseService(ABC):
    """
    Abstract base class for all services
    Provides common functionality and dependency injection
    """
    
    def __init__(self, db: Session = None):
        self.db = db
        self._logger = logging.getLogger(self.__class__.__name__)
    
    @abstractmethod
    def get_service_name(self) -> str:
        """Return the unique service name"""
        pass
    
    def get_dependency(self, service_name: str):
        """Get a dependency from the registry"""
        return service_registry.get(service_name)


class DatabaseService(BaseService):
    """
    Centralized database service to prevent direct DB access in routers
    """
    
    def get_service_name(self) -> str:
        return "database"
    
    def get_project_transactions(
        self, 
        project_id: str, 
        limit: int = 1000, 
        offset: int = 0,
        filters: Optional[Dict[str, Any]] = None
    ):
        """Get paginated transactions for a project"""
        from app.core.database_optimizer import optimize_transaction_query
        
        return optimize_transaction_query(
            session=self.db,
            project_id=project_id,
            limit=limit,
            offset=offset,
            filters=filters
        )
    
    def get_transaction_count(self, project_id: str, filters: Optional[Dict[str, Any]] = None) -> int:
        """Get transaction count for a project"""
        from sqlalchemy import func
        from app.models import Transaction
        
        query = self.db.query(func.count(Transaction.id)).filter(Transaction.project_id == project_id)
        
        if filters:
            if 'status' in filters:
                query = query.filter(Transaction.status == filters['status'])
            if 'category_code' in filters:
                query = query.filter(Transaction.category_code == filters['category_code'])
        
        return query.scalar() or 0


class SecurityService(BaseService):
    """
    Centralized security service to prevent direct crypto operations
    """
    
    def get_service_name(self) -> str:
        return "security"
    
    def validate_user_access(self, user_id: str, project_id: str) -> bool:
        """Validate if user has access to project"""
        from app.models import UserProject
        
        access = self.db.query(UserProject).filter(
            UserProject.user_id == user_id,
            UserProject.project_id == project_id
        ).first()
        
        return access is not None
    
    def log_security_event(self, event_type: str, details: Dict[str, Any]):
        """Log security event using centralized logging"""
        from app.core.security_logging import security_logger
        
        security_logger.log(
            level=security_logger.LogLevel.INFO,
            event_type=security_logger.SecurityEventType(event_type),
            message=f"Security event: {event_type}",
            details=details
        )


class AuditService(BaseService):
    """
    Centralized audit service to prevent direct audit log operations
    """
    
    def get_service_name(self) -> str:
        return "audit"
    
    def log_change(
        self,
        entity_type: str,
        entity_id: str,
        action: str,
        user_id: str,
        old_value: Any = None,
        new_value: Any = None,
        reason: str = None
    ):
        """Log audit change"""
        from app.models import AuditLog
        from datetime import datetime, UTC
        
        audit_log = AuditLog(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            user_id=user_id,
            old_value=str(old_value) if old_value is not None else None,
            new_value=str(new_value) if new_value is not None else None,
            change_reason=reason,
            timestamp=datetime.now(UTC)
        )
        
        self.db.add(audit_log)
        self.db.commit()


class CacheService(BaseService):
    """
    Centralized cache service to prevent direct Redis operations
    """
    
    def get_service_name(self) -> str:
        return "cache"
    
    def get(self, key: str) -> Optional[Any]:
        """Get cached value"""
        from app.core.redis_client import redis_client
        
        try:
            return redis_client.get(key)
        except Exception as e:
            self._logger.error(f"Cache get error: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """Set cached value with TTL"""
        from app.core.redis_client import redis_client
        
        try:
            return redis_client.setex(key, ttl, value)
        except Exception as e:
            self._logger.error(f"Cache set error: {e}")
            return False
    
    def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate cache entries matching pattern"""
        from app.core.redis_client import redis_client
        
        try:
            keys = redis_client.keys(pattern)
            if keys:
                return redis_client.delete(*keys)
        except Exception as e:
            self._logger.error(f"Cache invalidation error: {e}")
        return 0


class NotificationService(BaseService):
    """
    Centralized notification service
    """
    
    def get_service_name(self) -> str:
        return "notification"
    
    def send_alert(self, user_id: str, message: str, severity: str = "info"):
        """Send notification to user"""
        # This could integrate with email, WebSocket, push notifications, etc.
        self._logger.info(f"Notification sent to {user_id}: {message} ({severity})")
    
    def broadcast_alert(self, message: str, severity: str = "info"):
        """Broadcast alert to all connected users"""
        # This would typically use WebSocket or Server-Sent Events
        self._logger.info(f"Broadcast notification: {message} ({severity})")


# Service factory functions
def create_database_service(db: Session) -> DatabaseService:
    return DatabaseService(db)

def create_security_service(db: Session) -> SecurityService:
    return SecurityService(db)

def create_audit_service(db: Session) -> AuditService:
    return AuditService(db)

def create_cache_service() -> CacheService:
    return CacheService()

def create_notification_service() -> NotificationService:
    return NotificationService()


# Initialize service registry
def initialize_services():
    """Initialize all services in the registry"""
    # Register factory functions
    service_registry.register("database", create_database_service, singleton=False)
    service_registry.register("security", create_security_service, singleton=False)
    service_registry.register("audit", create_audit_service, singleton=False)
    service_registry.register("cache", create_cache_service, singleton=True)
    service_registry.register("notification", create_notification_service, singleton=True)


# Dependency injection decorator
def inject_service(service_name: str):
    """Decorator for injecting services into functions"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            service = service_registry.get(service_name)
            return func(service, *args, **kwargs)
        return wrapper
    return decorator


# Safe service getter with fallback
def get_service(service_name: str, fallback: Any = None) -> Any:
    """Get service with optional fallback"""
    try:
        return service_registry.get(service_name)
    except ValueError:
        return fallback


# Initialize services on module import
initialize_services()