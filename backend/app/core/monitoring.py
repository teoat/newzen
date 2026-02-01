"""
Monitoring and alerting system for Zenith
Provides real-time system health monitoring and automated alerts
"""

import asyncio
import time
import json
import psutil
from datetime import datetime, UTC
from typing import Dict, List, Any, Optional, Callable
from enum import Enum
from dataclasses import dataclass, asdict
from fastapi import FastAPI
from app.core.security_logging import security_logger, SecurityEventType


class AlertSeverity(Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class MetricType(Enum):
    CPU_USAGE = "cpu_usage"
    MEMORY_USAGE = "memory_usage"
    DISK_USAGE = "disk_usage"
    RESPONSE_TIME = "response_time"
    ERROR_RATE = "error_rate"
    DATABASE_CONNECTIONS = "database_connections"
    CACHE_HIT_RATE = "cache_hit_rate"
    ACTIVE_USERS = "active_users"
    QUEUE_SIZE = "queue_size"


@dataclass
class Alert:
    id: str
    timestamp: datetime
    severity: AlertSeverity
    metric_type: MetricType
    title: str
    message: str
    current_value: float
    threshold: float
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class SystemMetrics:
    timestamp: datetime
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    active_connections: int
    response_time_avg: float
    error_rate: float
    cache_hit_rate: float
    queue_size: int


class MonitoringService:
    """
    System monitoring and alerting service
    """
    
    def __init__(self, redis_client=None):
        self.redis = redis_client or redis_client
        self.alerts: Dict[str, Alert] = {}
        self.metrics_history: List[SystemMetrics] = []
        self.thresholds = self._get_default_thresholds()
        self.monitoring_task = None
        self.alert_handlers: Dict[AlertSeverity, List[Callable]] = {
            AlertSeverity.INFO: [],
            AlertSeverity.WARNING: [],
            AlertSeverity.ERROR: [],
            AlertSeverity.CRITICAL: []
        }
    
    def _get_default_thresholds(self) -> Dict[MetricType, Dict[str, float]]:
        """Get default monitoring thresholds"""
        return {
            MetricType.CPU_USAGE: {"warning": 70.0, "critical": 90.0},
            MetricType.MEMORY_USAGE: {"warning": 75.0, "critical": 90.0},
            MetricType.DISK_USAGE: {"warning": 80.0, "critical": 95.0},
            MetricType.RESPONSE_TIME: {"warning": 1000.0, "critical": 3000.0},  # ms
            MetricType.ERROR_RATE: {"warning": 5.0, "critical": 15.0},  # percentage
            MetricType.DATABASE_CONNECTIONS: {"warning": 80.0, "critical": 95.0},  # percentage of max
            MetricType.CACHE_HIT_RATE: {"warning": 80.0, "critical": 60.0},  # percentage
            MetricType.QUEUE_SIZE: {"warning": 1000, "critical": 5000},
        }
    
    async def collect_system_metrics(self) -> SystemMetrics:
        """Collect current system metrics"""
        try:
            # CPU and memory usage
            cpu_usage = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            memory_usage = memory.percent
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_usage = (disk.used / disk.total) * 100
            
            # Database connections (approximate from Redis monitoring)
            try:
                db_connections = len(self.redis.keys("db_connection:*")) if self.redis else 0
            except Exception:
                db_connections = 0
            
            # Calculate average response time from recent metrics
            recent_metrics = self.metrics_history[-10:] if self.metrics_history else []
            response_time_avg = sum(m.response_time_avg for m in recent_metrics) / len(recent_metrics) if recent_metrics else 0
            
            # Calculate error rate from security logs
            error_rate = await self._calculate_error_rate()
            
            # Cache hit rate
            cache_hit_rate = await self._calculate_cache_hit_rate()
            
            # Queue size (from Celery or task queue)
            queue_size = await self._get_queue_size()
            
            metrics = SystemMetrics(
                timestamp=datetime.now(UTC),
                cpu_usage=cpu_usage,
                memory_usage=memory_usage,
                disk_usage=disk_usage,
                active_connections=db_connections,
                response_time_avg=response_time_avg,
                error_rate=error_rate,
                cache_hit_rate=cache_hit_rate,
                queue_size=queue_size
            )
            
            # Store in history (keep last 1000 entries)
            self.metrics_history.append(metrics)
            if len(self.metrics_history) > 1000:
                self.metrics_history = self.metrics_history[-1000:]
            
            # Store in Redis for persistence
            await self._store_metrics(metrics)
            
            return metrics
            
        except Exception as e:
            security_logger.log(
                level=AlertSeverity.ERROR,
                event_type=SecurityEventType.SYSTEM_ERROR,
                message=f"Error collecting system metrics: {str(e)}",
                details={"error": str(e)}
            )
            # Return empty metrics on error
            return SystemMetrics(
                timestamp=datetime.now(UTC),
                cpu_usage=0.0,
                memory_usage=0.0,
                disk_usage=0.0,
                active_connections=0,
                response_time_avg=0.0,
                error_rate=0.0,
                cache_hit_rate=0.0,
                queue_size=0
            )
    
    async def _calculate_error_rate(self) -> float:
        """Calculate error rate from recent logs"""
        try:
            # This would typically query your logs or monitoring system
            # For now, return a placeholder
            return 0.0
        except Exception:
            return 0.0
    
    async def _calculate_cache_hit_rate(self) -> float:
        """Calculate cache hit rate"""
        try:
            # Monitor cache performance
            total_requests = 100  # Placeholder
            cache_hits = 85  # Placeholder
            return (cache_hits / total_requests * 100) if total_requests > 0 else 0.0
        except Exception:
            return 0.0
    
    async def _get_queue_size(self) -> int:
        """Get current queue size"""
        try:
            # This would typically query your task queue (Celery, etc.)
            return 0  # Placeholder
        except Exception:
            return 0
    
    async def _store_metrics(self, metrics: SystemMetrics):
        """Store metrics in Redis"""
        try:
            key = f"system_metrics:{int(metrics.timestamp.timestamp())}"
            metrics_dict = asdict(metrics)
            # Handle datetime serialization
            metrics_dict['timestamp'] = metrics.timestamp.isoformat()
            
            if self.redis:
                self.redis.setex(key, 86400, json.dumps(metrics_dict))  # 24 hour TTL
        except Exception as e:
            security_logger.log(
                level=AlertSeverity.ERROR,
                event_type=SecurityEventType.SYSTEM_ERROR,
                message=f"Failed to store metrics: {str(e)}",
                details={"error": str(e)}
            )
    
    def check_thresholds(self, metrics: SystemMetrics) -> List[Alert]:
        """Check metrics against thresholds and create alerts"""
        new_alerts = []
        
        # Check each metric type
        metric_mappings = {
            MetricType.CPU_USAGE: metrics.cpu_usage,
            MetricType.MEMORY_USAGE: metrics.memory_usage,
            MetricType.DISK_USAGE: metrics.disk_usage,
            MetricType.RESPONSE_TIME: metrics.response_time_avg,
            MetricType.ERROR_RATE: metrics.error_rate,
            MetricType.DATABASE_CONNECTIONS: metrics.active_connections,
            MetricType.CACHE_HIT_RATE: metrics.cache_hit_rate,
            MetricType.QUEUE_SIZE: metrics.queue_size,
        }
        
        for metric_type, current_value in metric_mappings.items():
            if metric_type in self.thresholds:
                thresholds = self.thresholds[metric_type]
                
                # Check critical threshold first
                if current_value >= thresholds["critical"]:
                    alert = self._create_alert(
                        metric_type=metric_type,
                        severity=AlertSeverity.CRITICAL,
                        current_value=current_value,
                        threshold=thresholds["critical"]
                    )
                    new_alerts.append(alert)
                
                # Check warning threshold
                elif current_value >= thresholds["warning"]:
                    alert = self._create_alert(
                        metric_type=metric_type,
                        severity=AlertSeverity.WARNING,
                        current_value=current_value,
                        threshold=thresholds["warning"]
                    )
                    new_alerts.append(alert)
                
                # Special case for cache hit rate (lower is worse)
                elif metric_type == MetricType.CACHE_HIT_RATE:
                    if current_value <= thresholds["critical"]:
                        alert = self._create_alert(
                            metric_type=metric_type,
                            severity=AlertSeverity.CRITICAL,
                            current_value=current_value,
                            threshold=thresholds["critical"]
                        )
                        new_alerts.append(alert)
                    elif current_value <= thresholds["warning"]:
                        alert = self._create_alert(
                            metric_type=metric_type,
                            severity=AlertSeverity.WARNING,
                            current_value=current_value,
                            threshold=thresholds["warning"]
                        )
                        new_alerts.append(alert)
        
        return new_alerts
    
    def _create_alert(
        self,
        metric_type: MetricType,
        severity: AlertSeverity,
        current_value: float,
        threshold: float
    ) -> Alert:
        """Create a new alert"""
        alert_id = f"{metric_type.value}_{int(time.time())}"
        
        # Generate alert title and message
        titles = {
            MetricType.CPU_USAGE: "High CPU Usage",
            MetricType.MEMORY_USAGE: "High Memory Usage", 
            MetricType.DISK_USAGE: "High Disk Usage",
            MetricType.RESPONSE_TIME: "Slow Response Time",
            MetricType.ERROR_RATE: "High Error Rate",
            MetricType.DATABASE_CONNECTIONS: "High Database Connections",
            MetricType.CACHE_HIT_RATE: "Low Cache Hit Rate",
            MetricType.QUEUE_SIZE: "Large Queue Size"
        }
        
        messages = {
            MetricType.CPU_USAGE: f"CPU usage is {current_value:.1f}% (threshold: {threshold:.1f}%)",
            MetricType.MEMORY_USAGE: f"Memory usage is {current_value:.1f}% (threshold: {threshold:.1f}%)",
            MetricType.DISK_USAGE: f"Disk usage is {current_value:.1f}% (threshold: {threshold:.1f}%)",
            MetricType.RESPONSE_TIME: f"Average response time is {current_value:.0f}ms (threshold: {threshold:.0f}ms)",
            MetricType.ERROR_RATE: f"Error rate is {current_value:.1f}% (threshold: {threshold:.1f}%)",
            MetricType.DATABASE_CONNECTIONS: f"Database connections: {current_value:.0f} (threshold: {threshold:.0f})",
            MetricType.CACHE_HIT_RATE: f"Cache hit rate is {current_value:.1f}% (threshold: {threshold:.1f}%)",
            MetricType.QUEUE_SIZE: f"Queue size is {int(current_value)} (threshold: {int(threshold)})"
        }
        
        title = titles.get(metric_type, f"{metric_type.value} Alert")
        message = messages.get(metric_type, f"{metric_type.value}: {current_value} (threshold: {threshold})")
        
        alert = Alert(
            id=alert_id,
            timestamp=datetime.now(UTC),
            severity=severity,
            metric_type=metric_type,
            title=title,
            message=message,
            current_value=current_value,
            threshold=threshold
        )
        
        # Store alert
        self.alerts[alert_id] = alert
        
        return alert
    
    async def handle_alerts(self, alerts: List[Alert]):
        """Handle new alerts by calling registered handlers"""
        for alert in alerts:
            # Store in Redis
            if self.redis:
                alert_key = f"alert:{alert.id}"
                alert_dict = asdict(alert)
                alert_dict['timestamp'] = alert.timestamp.isoformat()
                if alert.resolved_at:
                    alert_dict['resolved_at'] = alert.resolved_at.isoformat()
                
                self.redis.setex(alert_key, 604800, json.dumps(alert_dict))  # 7 days TTL
            
            # Log alert
            security_logger.log(
                level=AlertSeverity.WARNING if alert.severity == AlertSeverity.WARNING else AlertSeverity.ERROR,
                event_type=SecurityEventType.SYSTEM_ERROR,
                message=alert.title,
                details={
                    "alert_id": alert.id,
                    "severity": alert.severity.value,
                    "metric": alert.metric_type.value,
                    "current_value": alert.current_value,
                    "threshold": alert.threshold,
                    "message": alert.message
                }
            )
            
            # Call registered handlers
            for handler in self.alert_handlers[alert.severity]:
                try:
                    await handler(alert)
                except Exception as e:
                    security_logger.log(
                        level=AlertSeverity.ERROR,
                        event_type=SecurityEventType.SYSTEM_ERROR,
                        message=f"Alert handler failed: {str(e)}",
                        details={"error": str(e), "alert_id": alert.id}
                    )
    
    def add_alert_handler(self, severity: AlertSeverity, handler: Callable[[Alert], Any]):
        """Add alert handler for specific severity"""
        self.alert_handlers[severity].append(handler)
    
    async def start_monitoring(self, interval: int = 30):
        """Start continuous monitoring"""
        self.monitoring_task = asyncio.create_task(self._monitoring_loop(interval))
    
    async def stop_monitoring(self):
        """Stop monitoring"""
        if self.monitoring_task:
            self.monitoring_task.cancel()
            try:
                await self.monitoring_task
            except asyncio.CancelledError:
                pass
    
    async def _monitoring_loop(self, interval: int):
        """Main monitoring loop"""
        while True:
            try:
                # Collect metrics
                metrics = await self.collect_system_metrics()
                
                # Check thresholds
                new_alerts = self.check_thresholds(metrics)
                
                # Handle alerts
                if new_alerts:
                    await self.handle_alerts(new_alerts)
                
                # Wait for next interval
                await asyncio.sleep(interval)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                security_logger.log(
                    level=AlertSeverity.ERROR,
                    event_type=SecurityEventType.SYSTEM_ERROR,
                    message=f"Monitoring loop error: {str(e)}",
                    details={"error": str(e)}
                )
                await asyncio.sleep(60)  # Wait before retrying
    
    def get_current_alerts(self, severity: Optional[AlertSeverity] = None, active_only: bool = True) -> List[Alert]:
        """Get current alerts"""
        alerts = list(self.alerts.values())
        
        if severity:
            alerts = [a for a in alerts if a.severity == severity]
        
        if active_only:
            alerts = [a for a in alerts if not a.resolved]
        
        return sorted(alerts, key=lambda x: x.timestamp, reverse=True)
    
    def resolve_alert(self, alert_id: str) -> bool:
        """Mark an alert as resolved"""
        if alert_id in self.alerts:
            self.alerts[alert_id].resolved = True
            self.alerts[alert_id].resolved_at = datetime.now(UTC)
            return True
        return False


# Global monitoring service instance
monitoring_service = MonitoringService()


async def default_alert_handler(alert: Alert):
    """Default alert handler - could send email, Slack, etc."""
    print(f"ALERT: {alert.title} - {alert.message}")


async def setup_monitoring(app: FastAPI):
    """Setup monitoring for FastAPI app"""
    # Register default alert handler
    monitoring_service.add_alert_handler(AlertSeverity.WARNING, default_alert_handler)
    monitoring_service.add_alert_handler(AlertSeverity.ERROR, default_alert_handler)
    monitoring_service.add_alert_handler(AlertSeverity.CRITICAL, default_alert_handler)
    
    # Start monitoring
    await monitoring_service.start_monitoring(interval=30)
    
    # Log monitoring start
    security_logger.log(
        level=AlertSeverity.INFO,
        event_type=SecurityEventType.SYSTEM_ERROR,
        message="System monitoring started",
        details={"interval": 30}
    )