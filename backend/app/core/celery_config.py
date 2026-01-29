"""
Celery Configuration for Zenith Forensic Platform
Handles distributed task processing, rate limiting, and job queuing.
"""

from celery import Celery
from celery.schedules import crontab
from kombu import Queue, Exchange
import os
from dotenv import load_dotenv

load_dotenv()
# Initialize Celery
celery_app = Celery(
    "zenith_forensic",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1"),
)
# Configuration
celery_app.conf.update(
    # Task Settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Rate Limiting & Concurrency
    worker_prefetch_multiplier=1,  # One task at a time per worker
    worker_max_tasks_per_child=50,  # Restart worker after 50 tasks
    task_acks_late=True,  # Acknowledge only after completion
    # Result Backend
    result_expires=3600,  # Keep results for 1 hour
    result_persistent=True,
    # Task Routing
    task_routes={
        "zenith_forensic.tasks.ingestion.*": {"queue": "ingestion"},
        "zenith_forensic.tasks.analysis.*": {"queue": "analysis"},
        "zenith_forensic.tasks.reconciliation.*": {"queue": "reconciliation"},
        "zenith_forensic.tasks.vectorization.*": {"queue": "embedding"},
    },
    # Queue Priority
    task_queue_max_priority=10,
    task_default_priority=5,
    # Beat Schedule (Periodic Tasks)
    beat_schedule={
        "cleanup-old-jobs": {
            "task": "zenith_forensic.tasks.maintenance.cleanup_old_jobs",
            "schedule": crontab(hour=2, minute=0),  # Daily at 2 AM
        },
        "system-health-check": {
            "task": "zenith_forensic.tasks.monitoring.health_check",
            "schedule": 300.0,  # Every 5 minutes
        },
    },
)
# Define Queues
celery_app.conf.task_queues = (
    Queue(
        "ingestion",
        Exchange("ingestion"),
        routing_key="ingestion",
        queue_arguments={"x-max-priority": 10},
    ),
    Queue(
        "analysis",
        Exchange("analysis"),
        routing_key="analysis",
        queue_arguments={"x-max-priority": 10},
    ),
    Queue(
        "reconciliation",
        Exchange("reconciliation"),
        routing_key="reconciliation",
        queue_arguments={"x-max-priority": 10},
    ),
    Queue(
        "embedding",
        Exchange("embedding"),
        routing_key="embedding",
        queue_arguments={"x-max-priority": 10},
    ),
    Queue("default", Exchange("default"), routing_key="default"),
)
