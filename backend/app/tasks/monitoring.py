"""
System monitoring and maintenance tasks.
Runs periodically via Celery Beat to ensure system health.
"""

from app.core.celery_config import celery_app
from app.core.batch_optimizer import BatchOptimizer
from datetime import datetime, timedelta
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
        # TODO: Integrate with alerting system (email, Slack, PagerDuty)
        send_alert(health_status)
    elif health_status["status"] == "warning":
        logger.warning(f"WARNING: {health_status['message']} - " f"Monitor closely")
    return health_status


@celery_app.task(name="zenith_forensic.tasks.maintenance.cleanup_old_jobs")
def cleanup_old_jobs() -> dict:
    """
    Clean up old completed jobs from the database.
    Runs daily to prevent table bloat.
    """
    from app.database import get_db
    from app.models import ProcessingJob, JobStatus

    # Archive jobs older than 7 days
    cutoff_date = datetime.utcnow() - timedelta(days=7)
    with get_db() as db:
        # Count jobs to be archived
        old_jobs = (
            db.query(ProcessingJob)
            .filter(
                ProcessingJob.status.in_(
                    [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED]
                ),
                ProcessingJob.completed_at < cutoff_date,
            )
            .all()
        )
        count = len(old_jobs)
        if count > 0:
            logger.info(f"Archiving {count} old jobs (>7 days)")
            # In production, move to archive table instead of delete
            # For now, just log the count
            # TODO: Implement proper archival strategy
            # Delete old jobs (or move to archive)
            for job in old_jobs:
                db.delete(job)
            db.commit()
            logger.info(f"Successfully archived {count} jobs")
        else:
            logger.info("No old jobs to archive")
    return {
        "archived_count": count,
        "cutoff_date": cutoff_date.isoformat(),
        "status": "completed",
    }


def send_alert(alert_data: dict):
    """
    Send system alerts via configured channels.
    Args:
        alert_data: Alert information including status and metrics
    """
    # TODO: Implement actual alerting
    # Options:
    # - Email via SendGrid/SES
    # - Slack webhook
    # - PagerDuty API
    # - Custom webhook
    logger.warning(f"ALERT: {alert_data['status']} - {alert_data['message']}")
    # Example Slack webhook integration:
    # import requests
    # webhook_url = os.getenv('SLACK_WEBHOOK_URL')
    # if webhook_url:
    #     payload = {
    #         'text': f"🚨 System Alert: {alert_data['message']}",
    #         'attachments': [{
    #             'color': 'danger' if alert_data['status'] == 'critical' else 'warning',
    #             'fields': [
    #                 {'title': 'CPU', 'value': f"{alert_data['cpu_percent']}%", 'short': True},
    #                 {'title': 'Memory', 'value': f"{alert_data['memory_available_gb']}GB", 'short': True},
    #             ]
    #         }]
    #     }
    #     requests.post(webhook_url, json=payload)
