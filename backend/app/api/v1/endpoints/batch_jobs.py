"""
API endpoints for batch job processing management.
Allows job submission, monitoring, and cancellation.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from app.core.db import get_session as get_db
from app.models import ProcessingJob, JobStatus
from app.tasks.batch_tasks import submit_batch_processing_job

router = APIRouter(prefix="/batch-jobs", tags=["batch-processing"])


# Request/Response Models
class JobSubmissionRequest(BaseModel):
    """Request model for job submission."""

    project_id: str = Field(
        ..., description="Project ID to associate with job"
    )
    data_type: str = Field(
        default="transaction",
        description="Type of data: transaction, entity, embedding, etc.",
    )
    items: List[Dict[str, Any]] = Field(
        ..., description="List of items to process"
    )


class JobStatusResponse(BaseModel):
    """Response model for job status."""

    id: str
    status: str
    progress_percent: float
    items_processed: int
    items_failed: int
    total_items: int
    total_batches: int
    batches_completed: int
    success_rate: float
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    estimated_completion_time: Optional[str] = None
    error_message: Optional[str] = None


class JobListItem(BaseModel):
    """Simplified job info for list view."""

    id: str
    project_id: Optional[str]
    status: str
    data_type: str
    progress_percent: float
    total_items: int
    created_at: str


# Endpoints
@router.post("/submit", response_model=Dict[str, str])
async def submit_job(
    request: JobSubmissionRequest, db: Session = Depends(get_db)
):
    """
    Submit a batch processing job.
    - **project_id**: Project to associate with this job
    - **data_type**: Type of data being processed
    - **items**: List of items to process (max 1M items)
    Returns job ID for tracking.
    """
    if len(request.items) == 0:
        raise HTTPException(status_code=400, detail="No items provided")
    if len(request.items) > 1_000_000:
        raise HTTPException(
            status_code=400, detail="Maximum 1 million items per job"
        )
    try:
        job_id = submit_batch_processing_job(
            items=request.items,
            project_id=request.project_id,
            data_type=request.data_type,
        )
        return {
            "job_id": job_id,
            "status": "submitted",
            "message": f"Job queued with {len(request.items)} items",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to submit job: {str(e)}"
        )


@router.get("/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str, db: Session = Depends(get_db)):
    """
    Get detailed status of a processing job.
    - **job_id**: Job identifier returned from submit endpoint
    """
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    # Calculate ETA if job is processing
    eta = None
    if job.status == JobStatus.PROCESSING and job.started_at:
        elapsed_seconds = (datetime.utcnow() - job.started_at).total_seconds()
        if job.items_processed > 0:
            # items per second
            rate = job.items_processed / elapsed_seconds
            remaining_items = job.total_items - job.items_processed
            eta_seconds = remaining_items / rate if rate > 0 else None
            if eta_seconds:
                eta = datetime.utcnow() + timedelta(seconds=eta_seconds)
    return JobStatusResponse(
        id=job.id,
        status=job.status.value,
        progress_percent=job.progress_percent,
        items_processed=job.items_processed,
        items_failed=job.items_failed,
        total_items=job.total_items,
        total_batches=job.total_batches,
        batches_completed=job.batches_completed,
        success_rate=job.success_rate,
        created_at=job.created_at.isoformat(),
        started_at=job.started_at.isoformat() if job.started_at else None,
        completed_at=(
            job.completed_at.isoformat() if job.completed_at else None
        ),
        estimated_completion_time=eta.isoformat() if eta else None,
        error_message=job.error_message,
    )


@router.post("/{job_id}/cancel")
async def cancel_job(job_id: str, db: Session = Depends(get_db)):
    """
    Cancel a running job.
    - **job_id**: Job to cancel
    Revokes all pending Celery tasks associated with the job.
    """
    from app.core.celery_config import celery_app

    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status in [
        JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED
    ]:
        raise HTTPException(
            status_code=400, detail=f"Job already {job.status.value}"
        )
    # Revoke all celery tasks
    for task_id in job.celery_task_ids.values():
        celery_app.control.revoke(task_id, terminate=True)
    job.status = JobStatus.CANCELLED
    job.completed_at = datetime.utcnow()
    db.commit()
    return {
        "status": "cancelled",
        "job_id": job_id,
        "message": "Job cancelled successfully",
    }


@router.get("/", response_model=List[JobListItem])
async def list_jobs(
    project_id: Optional[str] = Query(
        None, description="Filter by project ID"
    ),
    status: Optional[JobStatus] = Query(None, description="Filter by status"),
    limit: int = Query(
        50, ge=1, le=100, description="Maximum number of jobs to return"
    ),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
):
    """
    List all processing jobs with optional filters.
    - **project_id**: Filter by project (optional)
    - **status**: Filter by job status (optional)
    - **limit**: Max results (1-100, default 50)
    - **offset**: Pagination offset
    """
    query = db.query(ProcessingJob)
    if project_id:
        query = query.filter(ProcessingJob.project_id == project_id)
    if status:
        query = query.filter(ProcessingJob.status == status)
        jobs = query.order_by(ProcessingJob.created_at.desc()) \
        .offset(offset).limit(limit).all()
    return [
        JobListItem(
            id=job.id,
            project_id=job.project_id,
            status=job.status.value,
            data_type=job.data_type,
            progress_percent=job.progress_percent,
            total_items=job.total_items,
            created_at=job.created_at.isoformat(),
        )
        for job in jobs
    ]


@router.get("/stats/summary")
async def get_job_stats(
    project_id: Optional[str] = Query(None), db: Session = Depends(get_db)
):
    """
    Get aggregate statistics for batch jobs.
    - **project_id**: Limit stats to specific project (optional)
    """
    query = db.query(ProcessingJob)
    if project_id:
        query = query.filter(ProcessingJob.project_id == project_id)
    all_jobs = query.all()
    stats = {
        "total_jobs": len(all_jobs),
        "by_status": {
            "pending": len([
                j for j in all_jobs if j.status == JobStatus.PENDING
            ]),
            "processing": len([
                j for j in all_jobs if j.status == JobStatus.PROCESSING
            ]),
            "completed": len([
                j for j in all_jobs if j.status == JobStatus.COMPLETED
            ]),
            "failed": len([
                j for j in all_jobs if j.status == JobStatus.FAILED
            ]),
            "cancelled": len([
                j for j in all_jobs if j.status == JobStatus.CANCELLED
            ]),
        },
        "total_items_processed": sum(
                j.items_processed for j in all_jobs
            ),
            "total_items_failed": sum(
                j.items_failed for j in all_jobs
            ),
        "average_success_rate": (
                sum(j.success_rate for j in all_jobs) / len(all_jobs)
                if all_jobs else 0
            ),
    }
    return stats
