"""
System monitoring and maintenance tasks.
Runs periodically via Celery Beat to ensure system health.
"""

from app.core.celery_config import celery_app
from app.core.batch_optimizer import BatchOptimizer
from datetime import datetime, UTC, timedelta
import logging

logger = logging.getLogger(__name__)


@celery_app.task(name="zenith_forensic.tasks.monitoring.health_check")
def health_check() -> dict:
    """
    Periodic health check of system resources.
    Triggers alerts if resources are critically low.
    """
    health_status = BatchOptimizer.get_health_status()
    # Log current resource usage
    logger.info(
        f"System Health Check: {health_status['status'].upper()} - "
        f"{health_status['message']} | "
        f"CPU={health_status['cpu_percent']:.1f}%, "
        f"Memory Free={health_status['memory_available_gb']:.2f}GB, "
        f"Disk I/O Wait={health_status['disk_io_wait']:.1f}%"
    )
    # Send alerts for critical conditions
    if health_status["status"] == "critical":
        logger.critical(f"CRITICAL: {health_status['message']} - " f"Immediate attention required!")
        send_alert(health_status)
    elif health_status["status"] == "warning":
        logger.warning(f"WARNING: {health_status['message']} - " f"Monitor closely")
    return health_status


@celery_app.task(name="zenith_forensic.tasks.maintenance.cleanup_old_jobs")
def cleanup_old_jobs() -> dict:
    """
    Archive old completed jobs to separate table for compliance.
    Runs daily to prevent main table bloat while preserving audit trail.
    
    Retention policy: Active jobs (7 days) -> Archive table (indefinite)
    """
    from app.database import get_db
    from app.models import ProcessingJob, JobStatus

    # Archive jobs older than 7 days
    cutoff_date = datetime.now(UTC) - timedelta(days=7)
    archived_count = 0
    
    with get_db() as db:
        # Find old completed/failed jobs
        old_jobs = (
            db.query(ProcessingJob)
            .filter(
                ProcessingJob.status.in_(
                    [JobStatus.COMPLETED, JobStatus.FAILED,
                     JobStatus.CANCELLED]
                ),
                ProcessingJob.completed_at < cutoff_date,
            )
            .all()
        )
        
        if not old_jobs:
            logger.info("No old jobs to archive")
            return {
                "archived_count": 0,
                "cutoff_date": cutoff_date.isoformat(),
                "status": "completed",
            }
        
        # Archive each job (preserving full audit trail)
        from app.models import ProcessingJobArchive
        
        for job in old_jobs:
            # Create archive record with full snapshot
            archive = ProcessingJobArchive(
                id=job.id,
                project_id=job.project_id,
                data_type=job.data_type,
                total_items=job.total_items,
                items_processed=job.items_processed,
                items_failed=job.items_failed,
                status=job.status,
                started_at=job.started_at,
                completed_at=job.completed_at,
                error_message=job.error_message,
                archived_at=datetime.now(UTC),
                job_snapshot=job.dict()  # Full JSON snapshot
            )
            
            db.add(archive)
            db.delete(job)
            archived_count += 1
        
        db.commit()
        logger.info(
            f"Successfully archived {archived_count} jobs to "
            f"long-term storage (7+ days old)"
        )
        
    return {
        "archived_count": archived_count,
        "cutoff_date": cutoff_date.isoformat(),
        "status": "completed",
    }


def send_alert(alert_data: dict):
    """
    Send system alerts via configured channels.
    
    Supports multiple notification channels for operational resilience:
    - Console logging (always)
    - Slack webhook (if configured)
    - Email via SendGrid (if configured)
    
    Args:
        alert_data: Alert information including status and metrics
    """
    # Always log locally
    logger.warning(
        f"ALERT: {alert_data['status']} - {alert_data['message']}"
    )
    
    # Send to external channels
    _send_slack_alert(alert_data)
    _send_email_alert(alert_data)


def _send_slack_alert(alert_data: dict):
    """Send alert to Slack via webhook."""
    import os
    import requests
    from datetime import datetime, UTC
    
    webhook_url = os.getenv('SLACK_WEBHOOK_URL')
    
    if not webhook_url:
        logger.debug(
            "SLACK_WEBHOOK_URL not configured, skipping Slack alert"
        )
        return
    
    try:
        # Format for Slack
        color = 'danger' if alert_data['status'] == 'critical' else 'warning'
        emoji = '🚨' if alert_data['status'] == 'critical' else '⚠️'
        
        payload = {
            'text': f"{emoji} *Zenith System Alert*",
            'attachments': [{
                'color': color,
                'title': (
                    f"{alert_data['status'].upper()}: "
                    f"{alert_data['message']}"
                ),
                'fields': [
                    {
                        'title': 'CPU Usage',
                        'value': f"{alert_data['cpu_percent']:.1f}%",
                        'short': True
                    },
                    {
                        'title': 'Memory Available',
                        'value': f"{alert_data['memory_available_gb']:.2f}GB",
                        'short': True
                    },
                    {
                        'title': 'Disk I/O Wait',
                        'value': f"{alert_data['disk_io_wait']:.1f}%",
                        'short': True
                    },
                    {
                        'title': 'Timestamp',
                        'value': datetime.now(UTC).isoformat(),
                        'short': True
                    },
                ],
                'footer': 'Zenith Monitoring'
            }]
        }
        
        response = requests.post(webhook_url, json=payload, timeout=5)
        response.raise_for_status()
        logger.info("Slack alert sent successfully")
        
    except Exception as e:
        logger.error(f"Failed to send Slack alert: {e}")


def _send_email_alert(alert_data: dict):
    """Send alert via email using SendGrid."""
    import os
    from datetime import datetime, UTC
    
    sendgrid_api_key = os.getenv('SENDGRID_API_KEY')
    alert_email = os.getenv('ALERT_EMAIL', 'ops@zenith.app')
    
    if not sendgrid_api_key:
        logger.debug(
            "SENDGRID_API_KEY not configured, skipping email alert"
        )
        return
    
    try:
        # Use SendGrid API
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        
        subject = f"🚨 Zenith Alert: {alert_data['status'].upper()}"
        
        html_content = f"""
        <h2>System Alert: {alert_data['message']}</h2>
        <table style="border-collapse: collapse; width: 100%;">
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">
                    <strong>Status:</strong>
                </td>
                <td style="padding: 8px; border: 1px solid #ddd;">
                    {alert_data['status']}
                </td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">
                    <strong>CPU:</strong>
                </td>
                <td style="padding: 8px; border: 1px solid #ddd;">
                    {alert_data['cpu_percent']:.1f}%
                </td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">
                    <strong>Memory Available:</strong>
                </td>
                <td style="padding: 8px; border: 1px solid #ddd;">
                    {alert_data['memory_available_gb']:.2f}GB
                </td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">
                    <strong>Disk I/O Wait:</strong>
                </td>
                <td style="padding: 8px; border: 1px solid #ddd;">
                    {alert_data['disk_io_wait']:.1f}%
                </td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">
                    <strong>Time:</strong>
                </td>
                <td style="padding: 8px; border: 1px solid #ddd;">
                    {datetime.now(UTC).isoformat()}
                </td>
            </tr>
        </table>
        <p style="margin-top: 20px;">
            Please investigate immediately if status is CRITICAL.
        </p>
        """
        
        message = Mail(
            from_email='alerts@zenith.app',
            to_emails=alert_email,
            subject=subject,
            html_content=html_content
        )
        
        sg = SendGridAPIClient(sendgrid_api_key)
        response = sg.send(message)
        logger.info(f"Email alert sent: {response.status_code}")
        
    except Exception as e:
        logger.error(f"Failed to send email alert: {e}")

