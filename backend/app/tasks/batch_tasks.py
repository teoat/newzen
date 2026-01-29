"""
Celery tasks for batch processing of ingestion data.
Provides rate-limited, resilient batch processing with progress tracking.
"""

from app.core.celery_config import celery_app
from app.core.batch_optimizer import BatchOptimizer
from app.core.event_bus import publish_event, EventType
from celery import chord, group
from typing import List, Dict, Any
import time
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


@celery_app.task(
    bind=True,
    name="zenith_forensic.tasks.ingestion.process_transaction_batch",
    max_retries=3,
    default_retry_delay=60,  # 1 minute
    rate_limit="10/m",  # Max 10 batches per minute per worker
    time_limit=300,  # 5 minute hard timeout
    soft_time_limit=240,  # 4 minute soft timeout
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=600,  # Max 10 minutes
    retry_jitter=True,
)
def process_transaction_batch(
    self,
    batch: List[Dict[str, Any]],
    project_id: str,
    batch_num: int,
    total_batches: int,
    job_id: str,
) -> Dict[str, Any]:
    """
    Process a single batch of transactions.
    Args:
        batch: List of transaction records
        project_id: Associated project ID
        batch_num: Current batch number (1-indexed)
        total_batches: Total number of batches in job
        job_id: Parent job ID for tracking
    Returns:
        Processing results summary
    """
    try:
        logger.info(
            f"[Job {job_id}] Processing batch {batch_num}/{total_batches} "
            f"with {len(batch)} transactions for project {project_id}"
        )
        # Update task state for real-time monitoring
        self.update_state(
            state="PROCESSING",
            meta={
                "job_id": job_id,
                "batch_num": batch_num,
                "total_batches": total_batches,
                "items_count": len(batch),
                "progress": (batch_num / total_batches) * 100,
            },
        )
        # Update job record
        from app.database import get_db
        from app.models import ProcessingJob, JobStatus

        with get_db() as db:
            job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
            if job and job.status == JobStatus.PENDING:
                job.status = JobStatus.PROCESSING
                job.started_at = datetime.utcnow()
                db.commit()
                # Publish event for first batch starting
                if batch_num == 1:
                    publish_event(
                        EventType.BATCH_JOB_STARTED,
                        {
                            "job_id": job_id,
                            "project_id": project_id,
                            "total_items": job.total_items,
                            "total_batches": total_batches,
                            "data_type": job.data_type,
                        },
                        project_id=project_id,
                    )
        # Actual processing logic
        processed_count = 0
        failed_count = 0
        results = []
        for idx, transaction in enumerate(batch):
            try:
                # Process individual transaction
                result = _process_single_transaction(transaction, project_id)
                results.append(result)
                processed_count += 1
                # Update progress within batch
                if (idx + 1) % 50 == 0:  # Every 50 items
                    within_batch_progress = ((idx + 1) / len(batch)) * 100
                    logger.debug(
                        f"[Job {job_id}] Batch {batch_num}: "
                        f"{within_batch_progress:.1f}% complete"
                    )
            except Exception as e:
                logger.error(
                    f"[Job {job_id}] Failed to process transaction " f"{transaction.get('id')}: {e}"
                )
                failed_count += 1
        # Update job progress
        with get_db() as db:
            job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
            if job:
                job.batches_completed += 1
                job.items_processed += processed_count
                job.items_failed += failed_count
                db.commit()
        logger.info(
            f"[Job {job_id}] Batch {batch_num} completed: "
            f"{processed_count} processed, {failed_count} failed"
        )
        return {
            "job_id": job_id,
            "batch_num": batch_num,
            "processed": processed_count,
            "failed": failed_count,
            "results": results,
            "status": "completed",
        }
    except Exception as exc:
        logger.error(f"[Job {job_id}] Batch {batch_num} failed: {exc}")
        # Publish failure event after all retries exhausted
        if self.request.retries >= self.max_retries:
            from app.database import get_db
            from app.models import ProcessingJob, JobStatus

            with get_db() as db:
                job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
                if job:
                    job.status = JobStatus.FAILED
                    job.error_message = str(exc)
                    db.commit()
                    publish_event(
                        EventType.BATCH_JOB_FAILED,
                        {
                            "job_id": job_id,
                            "project_id": project_id,
                            "batch_num": batch_num,
                            "error": str(exc),
                            "items_processed": job.items_processed,
                            "items_failed": job.items_failed,
                        },
                        project_id=project_id,
                    )
        # Retry with exponential backoff
        raise self.retry(exc=exc)


def _process_single_transaction(transaction: Dict[str, Any], project_id: str) -> Dict[str, Any]:
    """
    Process a single transaction record.
    Integrates with existing ingestion logic.
    """
    # Use existing ingestion logic
    # This is a simplified version - actual implementation
    # should call your existing process_ingestion_task
    try:
        # For now, return success
        # TODO: Integrate with actual ingestion logic
        return {
            "id": transaction.get("id"),
            "status": "processed",
            "timestamp": time.time(),
        }
    except Exception as e:
        logger.error(f"Transaction processing error: {e}")
        raise


@celery_app.task(name="zenith_forensic.tasks.ingestion.finalize_batch_job", bind=True)
def finalize_batch_job(self, batch_results: List[Dict], job_id: str) -> Dict[str, Any]:
    """
    Finalize job after all batches complete.
    Args:
        batch_results: Results from all batch tasks
        job_id: Job identifier
    Returns:
        Final job summary
    """
    from app.database import get_db
    from app.models import ProcessingJob, JobStatus

    total_processed = sum(r.get("processed", 0) for r in batch_results)
    total_failed = sum(r.get("failed", 0) for r in batch_results)
    logger.info(
        f"[Job {job_id}] Finalizing: " f"{total_processed} processed, {total_failed} failed"
    )
    # Update job status in database
    with get_db() as db:
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if job:
            job.status = JobStatus.COMPLETED
            job.completed_at = datetime.utcnow()
            # Ensure final counts are accurate
            if job.items_processed != total_processed:
                logger.warning(
                    f"Job {job_id} count mismatch: "
                    f"expected {total_processed}, "
                    f"got {job.items_processed}"
                )
                job.items_processed = total_processed
                job.items_failed = total_failed
            db.commit()
            logger.info(
                f"[Job {job_id}] Completed successfully. " f"Success rate: {job.success_rate:.1f}%"
            )
            # Publish completion event
            publish_event(
                EventType.BATCH_JOB_COMPLETED,
                {
                    "job_id": job_id,
                    "project_id": job.project_id,
                    "total_processed": total_processed,
                    "total_failed": total_failed,
                    "success_rate": job.success_rate,
                    "duration_seconds": (
                        (job.completed_at - job.started_at).total_seconds()
                        if job.started_at
                        else None
                    ),
                },
                project_id=job.project_id,
            )
    # Trigger notifications or downstream tasks if needed
    # e.g., send webhook, update analytics, etc.
    return {
        "job_id": job_id,
        "total_processed": total_processed,
        "total_failed": total_failed,
        "status": "finalized",
    }


def submit_batch_processing_job(
    items: List[Dict[str, Any]], project_id: str, data_type: str = "transaction"
) -> str:
    """
    Submit a large dataset for batch processing.
    Args:
        items: List of items to process
        project_id: Associated project ID
        data_type: Type of data (for batch size optimization)
    Returns:
        Job ID for tracking
    """
    import uuid
    from app.models import ProcessingJob, JobStatus
    from app.database import get_db

    job_id = str(uuid.uuid4())
    # Calculate optimal batching
    optimizer = BatchOptimizer()
    config = optimizer.calculate_batch_config(data_type, len(items))
    # Split into batches
    batches = [items[i : i + config.size] for i in range(0, len(items), config.size)]
    logger.info(
        f"Submitting job {job_id}: {len(items)} items "
        f"split into {len(batches)} batches of ~{config.size} items"
    )
    # Create job record
    with get_db() as db:
        job = ProcessingJob(
            id=job_id,
            project_id=project_id,
            data_type=data_type,
            total_items=len(items),
            total_batches=len(batches),
            status=JobStatus.PENDING,
            batch_config={
                "size": config.size,
                "concurrent": config.concurrent_batches,
                "delay_ms": config.delay_between_batches_ms,
            },
        )
        db.add(job)
        db.commit()
    # Create task chain using Celery chord
    # Process batches in parallel, then finalize
    batch_tasks = group(
        process_transaction_batch.s(
            batch=batch,
            project_id=project_id,
            batch_num=idx + 1,
            total_batches=len(batches),
            job_id=job_id,
        ).set(
            priority=5 if idx < 3 else 3  # Higher priority for first batches
        )
        for idx, batch in enumerate(batches)
    )
    # Chord: run batches in parallel, then finalize
    workflow = chord(batch_tasks)(finalize_batch_job.s(job_id=job_id))
    # Store Celery task ID for monitoring
    with get_db() as db:
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if job:
            job.celery_task_ids = {"workflow": workflow.id}
            db.commit()
    logger.info(f"Job {job_id} submitted with workflow ID {workflow.id}")
    return job_id
