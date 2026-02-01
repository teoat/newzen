"""
Enhanced Monitoring System with Integrated Alerting
Implements production-ready monitoring with multiple alert channels
"""

import json
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

import requests
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from app.core.redis_client import redis_client

class AlertSeverity(Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    FATAL = "fatal"

class AlertChannel(Enum):
    EMAIL = "email"
    SLACK = "slack"
    WEBHOOK = "webhook"
    SMS = "sms"

@dataclass
class Alert:
    title: str
    message: str
    severity: AlertSeverity
    source: str
    timestamp: datetime
    metadata: Dict[str, Any]
    resolved: bool = False

class MonitoringAlert:
    """
    Production-ready monitoring with integrated alerting
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.setup_logging()
        
        # Alert configuration
        self.alert_channels = {
            AlertChannel.EMAIL: {
                "enabled": os.getenv("ALERT_EMAIL_ENABLED", "false").lower() == "true",
                "smtp_server": os.getenv("SMTP_SERVER", "smtp.gmail.com"),
                "smtp_port": int(os.getenv("SMTP_PORT", "587")),
                "smtp_username": os.getenv("SMTP_USERNAME", ""),
                "smtp_password": os.getenv("SMTP_PASSWORD", ""),
                "recipients": os.getenv("ALERT_EMAIL_RECIPIENTS", "").split(","),
                "from_email": os.getenv("ALERT_FROM_EMAIL", "monitoring@zenith.local")
            },
            AlertChannel.SLACK: {
                "enabled": os.getenv("SLACK_WEBHOOK_URL") is not None,
                "webhook_url": os.getenv("SLACK_WEBHOOK_URL", ""),
                "channel": os.getenv("SLACK_CHANNEL", "#alerts")
            },
            AlertChannel.WEBHOOK: {
                "enabled": os.getenv("ALERT_WEBHOOK_URL") is not None,
                "url": os.getenv("ALERT_WEBHOOK_URL", ""),
                "headers": json.loads(os.getenv("ALERT_WEBHOOK_HEADERS", "{}"))
            },
            AlertChannel.SMS: {
                "enabled": False,  # SMS requires provider configuration
                "provider": os.getenv("SMS_PROVIDER", "twilio"),
                "api_key": os.getenv("SMS_API_KEY", ""),
                "recipients": os.getenv("SMS_RECIPIENTS", "").split(",")
            }
        }
        
        # Alert deduplication
        self.recent_alerts = {}
        self.alert_cooldown = {}
        
        # Metrics storage
        self.metrics = {
            "alerts_sent": 0,
            "alerts_failed": 0,
            "last_alert_sent": None,
            "system_health": "unknown"
        }
    
    def setup_logging(self):
        """Configure structured logging for monitoring"""
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
    
    async def send_alert(self, alert: Alert) -> bool:
        """
        Send alert through configured channels
        """
        try:
            # Check for deduplication
            alert_key = f"{alert.source}:{alert.title}"
            if self.is_duplicate_alert(alert_key):
                self.logger.info(f"Alert deduplicated: {alert_key}")
                return True
            
            # Record alert for deduplication
            self.record_alert(alert_key)
            
            # Send through enabled channels
            success_count = 0
            total_channels = 0
            
            for channel, config in self.alert_channels.items():
                if config["enabled"]:
                    total_channels += 1
                    try:
                        if await self.send_via_channel(alert, channel, config):
                            success_count += 1
                            self.logger.info(f"Alert sent via {channel.value}")
                        else:
                            self.logger.error(f"Failed to send alert via {channel.value}")
                    except Exception as e:
                        self.logger.error(f"Error sending via {channel.value}: {e}")
            
            # Update metrics
            if success_count > 0:
                self.metrics["alerts_sent"] += 1
                self.metrics["last_alert_sent"] = datetime.now().isoformat()
            else:
                self.metrics["alerts_failed"] += 1
            
            # Store in Redis for tracking
            await self.store_alert_in_redis(alert)
            
            self.logger.info(f"Alert sent: {success_count}/{total_channels} channels successful")
            return success_count > 0
            
        except Exception as e:
            self.logger.error(f"Critical error in send_alert: {e}")
            return False
    
    def is_duplicate_alert(self, alert_key: str) -> bool:
        """Check if alert is duplicate (within cooldown period)"""
        now = datetime.now()
        if alert_key in self.recent_alerts:
            last_sent = self.recent_alerts[alert_key]
            cooldown_period = timedelta(minutes=5)  # 5 minute cooldown
            
            if now - last_sent < cooldown_period:
                return True
        
        return False
    
    def record_alert(self, alert_key: str):
        """Record alert for deduplication"""
        self.recent_alerts[alert_key] = datetime.now()
        
        # Cleanup old entries
        cutoff = datetime.now() - timedelta(hours=1)
        self.recent_alerts = {
            key: time for key, time in self.recent_alerts.items() 
            if time > cutoff
        }
    
    async def send_via_channel(self, alert: Alert, channel: AlertChannel, config: Dict[str, Any]) -> bool:
        """Send alert through specific channel"""
        try:
            if channel == AlertChannel.EMAIL:
                return await self.send_email_alert(alert, config)
            elif channel == AlertChannel.SLACK:
                return await self.send_slack_alert(alert, config)
            elif channel == AlertChannel.WEBHOOK:
                return await self.send_webhook_alert(alert, config)
            elif channel == AlertChannel.SMS:
                return await self.send_sms_alert(alert, config)
            else:
                self.logger.error(f"Unknown alert channel: {channel}")
                return False
        except Exception as e:
            self.logger.error(f"Error sending via {channel.value}: {e}")
            return False
    
    async def send_email_alert(self, alert: Alert, config: Dict[str, Any]) -> bool:
        """Send email alert"""
        try:
            msg = MimeMultipart()
            msg['From'] = config["from_email"]
            msg['To'] = ", ".join(config["recipients"])
            
            # Format subject based on severity
            severity_emoji = {
                AlertSeverity.INFO: "ℹ️",
                AlertSeverity.WARNING: "⚠️",
                AlertSeverity.CRITICAL: "🚨",
                AlertSeverity.FATAL: "💀"
            }
            
            emoji = severity_emoji.get(alert.severity, "🔔")
            msg['Subject'] = f"{emoji} Zenith Alert: {alert.title}"
            
            # Create email body
            body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #{'#28a745' if alert.severity in [AlertSeverity.CRITICAL, AlertSeverity.FATAL] else '#ffc107'};">
                    <h2 style="color: #{'#dc3545' if alert.severity in [AlertSeverity.CRITICAL, AlertSeverity.FATAL] else '#856404'}; margin-top: 0;">
                        {emoji} {alert.title}
                    </h2>
                    <p style="font-size: 16px; line-height: 1.5; color: #333;">
                        {alert.message}
                    </p>
                    <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h4 style="color: #495057; margin-top: 0;">Details:</h4>
                        <ul style="color: #6c757d;">
                            <li><strong>Source:</strong> {alert.source}</li>
                            <li><strong>Severity:</strong> {alert.severity.value.upper()}</li>
                            <li><strong>Time:</strong> {alert.timestamp.strftime('%Y-%m-%d %H:%M:%S UTC')}</li>
                            {"<li><strong>Metadata:</strong> <pre>{json.dumps(alert.metadata, indent=2)}</pre></li>" if alert.metadata else ""}
                        </ul>
                    </div>
                    <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #dee2e6;">
                        <small style="color: #6c757d;">
                            This is an automated alert from the Zenith Financial Intelligence Platform monitoring system.
                        </small>
                    </div>
                </div>
            </body>
            </html>
            """
            
            msg.attach(MimeText(body, 'html'))
            
            # Send email
            with smtplib.SMTP(config["smtp_server"], config["smtp_port"]) as server:
                server.starttls()
                server.login(config["smtp_username"], config["smtp_password"])
                server.send_message(msg)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Email alert failed: {e}")
            return False
    
    async def send_slack_alert(self, alert: Alert, config: Dict[str, Any]) -> bool:
        """Send Slack alert"""
        try:
            # Format Slack message
            severity_color = {
                AlertSeverity.INFO: "good",
                AlertSeverity.WARNING: "warning", 
                AlertSeverity.CRITICAL: "danger",
                AlertSeverity.FATAL: "danger"
            }
            
            severity_emoji = {
                AlertSeverity.INFO: "ℹ️",
                AlertSeverity.WARNING: "⚠️",
                AlertSeverity.CRITICAL: "🚨",
                AlertSeverity.FATAL: "💀"
            }
            
            emoji = severity_emoji.get(alert.severity, "🔔")
            color = severity_color.get(alert.severity, "warning")
            
            payload = {
                "text": f"{emoji} Zenith Alert: {alert.title}",
                "attachments": [{
                    "color": color,
                    "title": alert.title,
                    "text": alert.message,
                    "fields": [
                        {
                            "title": "Source",
                            "value": alert.source,
                            "short": True
                        },
                        {
                            "title": "Severity",
                            "value": alert.severity.value.upper(),
                            "short": True
                        },
                        {
                            "title": "Time",
                            "value": alert.timestamp.strftime('%Y-%m-%d %H:%M:%S UTC'),
                            "short": True
                        }
                    ],
                    "footer": "Zenith Financial Intelligence Platform",
                    "ts": int(alert.timestamp.timestamp())
                }]
            }
            
            # Add metadata if present
            if alert.metadata:
                metadata_text = "\n".join([f"• {k}: {v}" for k, v in alert.metadata.items()])
                payload["attachments"][0]["fields"].append({
                    "title": "Metadata",
                    "value": metadata_text,
                    "short": False
                })
            
            response = requests.post(
                config["webhook_url"],
                json=payload,
                timeout=30
            )
            
            return response.status_code == 200
            
        except Exception as e:
            self.logger.error(f"Slack alert failed: {e}")
            return False
    
    async def send_webhook_alert(self, alert: Alert, config: Dict[str, Any]) -> bool:
        """Send generic webhook alert"""
        try:
            payload = {
                "alert": {
                    "title": alert.title,
                    "message": alert.message,
                    "severity": alert.severity.value,
                    "source": alert.source,
                    "timestamp": alert.timestamp.isoformat(),
                    "metadata": alert.metadata
                },
                "system": "zenith-financial-intelligence",
                "version": "1.0.0"
            }
            
            response = requests.post(
                config["url"],
                json=payload,
                headers=config["headers"],
                timeout=30
            )
            
            return response.status_code in [200, 201, 202]
            
        except Exception as e:
            self.logger.error(f"Webhook alert failed: {e}")
            return False
    
    async def send_sms_alert(self, alert: Alert, config: Dict[str, Any]) -> bool:
        """Send SMS alert (placeholder for future implementation)"""
        self.logger.warning("SMS alerts not yet implemented")
        return False
    
    async def store_alert_in_redis(self, alert: Alert):
        """Store alert in Redis for tracking and analytics"""
        try:
            if not redis_client:
                return
            
            # Store alert data
            alert_data = {
                "id": f"alert_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{alert.source}",
                "title": alert.title,
                "message": alert.message,
                "severity": alert.severity.value,
                "source": alert.source,
                "timestamp": alert.timestamp.isoformat(),
                "metadata": alert.metadata,
                "created_at": datetime.now().isoformat()
            }
            
            # Store in Redis list (latest 1000 alerts)
            redis_client.lpush("alerts:recent", json.dumps(alert_data))
            redis_client.ltrim("alerts:recent", 0, 999)
            
            # Store by severity for analytics
            redis_client.lpush(f"alerts:{alert.severity.value}", json.dumps(alert_data))
            redis_client.expire(f"alerts:{alert.severity.value}", 86400)  # 24 hours
            
            # Update metrics
            redis_client.hset("monitoring:metrics", "alerts_total", 
                             int(redis_client.hget("monitoring:metrics", "alerts_total") or 0) + 1)
            redis_client.hset("monitoring:metrics", "last_alert", alert.timestamp.isoformat())
            
        except Exception as e:
            self.logger.error(f"Failed to store alert in Redis: {e}")
    
    async def get_alerts(self, severity: Optional[AlertSeverity] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent alerts from Redis"""
        try:
            if not redis_client:
                return []
            
            if severity:
                # Get alerts by severity
                alert_data = redis_client.lrange(f"alerts:{severity.value}", 0, limit - 1)
            else:
                # Get recent alerts
                alert_data = redis_client.lrange("alerts:recent", 0, limit - 1)
            
            return [json.loads(alert) for alert in alert_data]
            
        except Exception as e:
            self.logger.error(f"Failed to get alerts from Redis: {e}")
            return []
    
    async def get_metrics(self) -> Dict[str, Any]:
        """Get monitoring metrics"""
        try:
            if redis_client:
                redis_metrics = redis_client.hgetall("monitoring:metrics")
                return {k: v.decode() if isinstance(v, bytes) else v for k, v in redis_metrics.items()}
            else:
                return self.metrics
        except Exception as e:
            self.logger.error(f"Failed to get metrics from Redis: {e}")
            return self.metrics
    
    async def check_system_health(self) -> Dict[str, Any]:
        """Comprehensive system health check"""
        try:
            health_status = {
                "timestamp": datetime.now().isoformat(),
                "overall_status": "healthy",
                "components": {},
                "alerts": [],
                "metrics": await self.get_metrics()
            }
            
            # Check backend health
            try:
                import requests
                response = requests.get("http://localhost:8200/health", timeout=5)
                health_status["components"]["backend"] = {
                    "status": "healthy" if response.status_code == 200 else "unhealthy",
                    "response_time": response.elapsed.total_seconds,
                    "details": "HTTP " + str(response.status_code)
                }
            except Exception as e:
                health_status["components"]["backend"] = {
                    "status": "unhealthy",
                    "error": str(e)
                }
                health_status["overall_status"] = "unhealthy"
            
            # Check database health
            try:
                if redis_client:
                    db_status = redis_client.ping()
                    health_status["components"]["database"] = {
                        "status": "healthy" if db_status else "unhealthy",
                        "details": "Redis connection " + ("successful" if db_status else "failed")
                    }
                else:
                    health_status["components"]["database"] = {
                        "status": "unknown",
                        "details": "Redis not available"
                    }
            except Exception as e:
                health_status["components"]["database"] = {
                    "status": "unhealthy",
                    "error": str(e)
                }
                health_status["overall_status"] = "unhealthy"
            
            # Check recent critical alerts
            recent_alerts = await self.get_alerts(AlertSeverity.CRITICAL, 10)
            if recent_alerts:
                health_status["overall_status"] = "unhealthy"
                health_status["alerts"] = recent_alerts[:5]
            
            self.metrics["system_health"] = health_status["overall_status"]
            return health_status
            
        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            return {
                "timestamp": datetime.now().isoformat(),
                "overall_status": "error",
                "error": str(e),
                "components": {},
                "alerts": [],
                "metrics": self.metrics
            }

# Singleton instance
monitoring_alert = MonitoringAlert()

# Convenience functions
async def send_critical_alert(title: str, message: str, source: str = "system", metadata: Dict[str, Any] = None):
    """Send critical alert"""
    alert = Alert(
        title=title,
        message=message,
        severity=AlertSeverity.CRITICAL,
        source=source,
        timestamp=datetime.now(),
        metadata=metadata or {}
    )
    return await monitoring_alert.send_alert(alert)

async def send_warning_alert(title: str, message: str, source: str = "system", metadata: Dict[str, Any] = None):
    """Send warning alert"""
    alert = Alert(
        title=title,
        message=message,
        severity=AlertSeverity.WARNING,
        source=source,
        timestamp=datetime.now(),
        metadata=metadata or {}
    )
    return await monitoring_alert.send_alert(alert)

async def send_info_alert(title: str, message: str, source: str = "system", metadata: Dict[str, Any] = None):
    """Send info alert"""
    alert = Alert(
        title=title,
        message=message,
        severity=AlertSeverity.INFO,
        source=source,
        timestamp=datetime.now(),
        metadata=metadata or {}
    )
    return await monitoring_alert.send_alert(alert)