# Background Processing Architecture

## Batch Queue System with Rate Limiting

**Version:** 1.0  
**Last Updated:** 2026-01-29  
**Status:** Design Specification

---

## Executive Summary

This document outlines the architecture for implementing a robust background task processing system that handles large-scale data analysis in batches while preventing system resource exhaustion.

### Key Objectives

- **Prevent System Overload**: Implement rate limiting and resource monitoring
- **Batch Processing**: Process data in manageable chunks
- **Fault Tolerance**: Retry failed tasks with exponential backoff
- **Observability**: Track progress and system health in real-time
- **Scalability**: Handle millions of transactions efficiently

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Upload Data  │→ │  API Call    │→ │ Job Monitor  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       FastAPI Backend                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Job Submission Endpoint                                  │   │
│  │  - Validate input                                         │   │
│  │  - Create job record                                      │   │
│  │  - Split into batches                                     │   │
│  │  - Enqueue tasks                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Task Queue (Redis)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Pending   │→ │  Processing │→ │  Completed  │            │
│  │   Queue     │  │   Queue     │  │   Archive   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Celery Worker Pool (Auto-scaling)                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │ Worker 1│  │ Worker 2│  │ Worker 3│  │ Worker N│           │
│  │ [Rate   │  │ [Rate   │  │ [Rate   │  │ [Rate   │           │
│  │ Limited]│  │ Limited]│  │ Limited]│  │ Limited]│           │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌──────────────────┐
                    │   Resource       │
                    │   Monitor        │
                    │   (Prometheus)   │
                    └──────────────────┘
```

---

## 1. Task Queue Configuration

### 1.1 Technology Stack

**Primary Stack:**

- **Message Broker**: Redis (primary) + RabbitMQ (fallback for complex routing)
- **Task Queue**: Celery 5.x
- **Result Backend**: Redis
- **Database**: PostgreSQL (job metadata, progress tracking)
- **Monitoring**: Flower (Celery monitoring) + Prometheus + Grafana

**Why Celery?**

- Native Python integration with FastAPI
- Advanced rate limiting capabilities (`rate_limit` parameter)
- Built-in retry logic with exponential backoff
- Task prioritization support
- Distributed task execution
- Mature ecosystem and active community

### 1.2 Celery Configuration

```python
# backend/app/core/celery_config.py

from celery import Celery
from celery.schedules import crontab
from kombu import Queue, Exchange
import os

# Initialize Celery
celery_app = Celery(
    'zenith_forensic',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/1')
)

# Configuration
celery_app.conf.update(
    # Task Settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Rate Limiting & Concurrency
    worker_prefetch_multiplier=1,  # One task at a time per worker
    worker_max_tasks_per_child=50,  # Restart worker after 50 tasks (prevent memory leaks)
    task_acks_late=True,  # Acknowledge only after completion
    
    # Result Backend
    result_expires=3600,  # Keep results for 1 hour
    result_persistent=True,
    
    # Task Routing
    task_routes={
        'zenith_forensic.tasks.ingestion.*': {'queue': 'ingestion'},
        'zenith_forensic.tasks.analysis.*': {'queue': 'analysis'},
        'zenith_forensic.tasks.reconciliation.*': {'queue': 'reconciliation'},
        'zenith_forensic.tasks.vectorization.*': {'queue': 'embedding'},
    },
    
    # Queue Priority
    task_queue_max_priority=10,
    task_default_priority=5,
    
    # Beat Schedule (Periodic Tasks)
    beat_schedule={
        'cleanup-old-jobs': {
            'task': 'zenith_forensic.tasks.maintenance.cleanup_old_jobs',
            'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
        },
        'system-health-check': {
            'task': 'zenith_forensic.tasks.monitoring.health_check',
            'schedule': 300.0,  # Every 5 minutes
        },
    },
)

# Define Queues
celery_app.conf.task_queues = (
    Queue('ingestion', Exchange('ingestion'), routing_key='ingestion',
          queue_arguments={'x-max-priority': 10}),
    Queue('analysis', Exchange('analysis'), routing_key='analysis',
          queue_arguments={'x-max-priority': 10}),
    Queue('reconciliation', Exchange('reconciliation'), routing_key='reconciliation',
          queue_arguments={'x-max-priority': 10}),
    Queue('embedding', Exchange('embedding'), routing_key='embedding',
          queue_arguments={'x-max-priority': 10}),
    Queue('default', Exchange('default'), routing_key='default'),
)
```

---

## 2. Batch Processing Strategy

### 2.1 Batch Size Calculation

Dynamic batch sizing based on system resources:

```python
# backend/app/core/batch_optimizer.py

import psutil
from typing import Dict, Any
from dataclasses import dataclass

@dataclass
class SystemResources:
    cpu_percent: float
    memory_available_gb: float
    disk_io_wait: float
    
@dataclass
class BatchConfig:
    size: int
    concurrent_batches: int
    delay_between_batches_ms: int

class BatchOptimizer:
    """
    Dynamically calculates optimal batch sizes based on system load.
    """
    
    # Default configurations for different data types
    DEFAULT_BATCH_SIZES = {
        'transaction': 500,
        'entity': 200,
        'embedding': 100,  # More CPU intensive
        'reconciliation': 300,
    }
    
    # Resource thresholds
    CPU_THRESHOLD_LOW = 50.0      # < 50% CPU: Increase batch size
    CPU_THRESHOLD_HIGH = 80.0     # > 80% CPU: Decrease batch size
    MEMORY_THRESHOLD_GB = 2.0     # Minimum 2GB free RAM required
    
    @staticmethod
    def get_system_resources() -> SystemResources:
        """Get current system resource utilization."""
        cpu = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory().available / (1024**3)  # GB
        disk_io = psutil.cpu_times_percent(interval=1).iowait
        
        return SystemResources(
            cpu_percent=cpu,
            memory_available_gb=memory,
            disk_io_wait=disk_io
        )
    
    @classmethod
    def calculate_batch_config(
        cls,
        data_type: str,
        total_items: int,
        resources: SystemResources = None
    ) -> BatchConfig:
        """
        Calculate optimal batch configuration.
        
        Args:
            data_type: Type of data being processed
            total_items: Total number of items to process
            resources: Current system resources (auto-detected if None)
        
        Returns:
            BatchConfig with optimized parameters
        """
        if resources is None:
            resources = cls.get_system_resources()
        
        base_size = cls.DEFAULT_BATCH_SIZES.get(data_type, 250)
        
        # Adjust based on CPU load
        if resources.cpu_percent < cls.CPU_THRESHOLD_LOW:
            # System has capacity, increase batch size
            batch_size = int(base_size * 1.5)
            concurrent = 4
            delay = 100  # ms
        elif resources.cpu_percent > cls.CPU_THRESHOLD_HIGH:
            # System is stressed, decrease batch size
            batch_size = int(base_size * 0.5)
            concurrent = 2
            delay = 500  # ms
        else:
            # Normal operation
            batch_size = base_size
            concurrent = 3
            delay = 200  # ms
        
        # Adjust based on memory
        if resources.memory_available_gb < cls.MEMORY_THRESHOLD_GB:
            batch_size = int(batch_size * 0.5)
            concurrent = max(1, concurrent - 1)
        
        # Cap concurrent batches based on total items
        max_concurrent = min(concurrent, max(1, total_items // batch_size))
        
        return BatchConfig(
            size=batch_size,
            concurrent_batches=max_concurrent,
            delay_between_batches_ms=delay
        )


# Usage Example
def create_processing_job(data_type: str, items: list):
    """Create a background job with optimized batching."""
    optimizer = BatchOptimizer()
    config = optimizer.calculate_batch_config(data_type, len(items))
    
    print(f"Processing {len(items)} items in batches of {config.size}")
    print(f"Running {config.concurrent_batches} batches concurrently")
    print(f"Delay between batches: {config.delay_between_batches_ms}ms")
    
    # Split into batches and queue
    batches = [items[i:i + config.size] 
               for i in range(0, len(items), config.size)]
    
    return batches, config
```

### 2.2 Rate-Limited Task Definition

```python
# backend/app/tasks/ingestion_tasks.py

from app.core.celery_config import celery_app
from app.core.batch_optimizer import BatchOptimizer
from celery import chord, group
from typing import List, Dict, Any
import time
import logging

logger = logging.getLogger(__name__)

@celery_app.task(
    bind=True,
    name='zenith_forensic.tasks.ingestion.process_transaction_batch',
    max_retries=3,
    default_retry_delay=60,  # 1 minute
    rate_limit='10/m',  # Max 10 batches per minute per worker
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
    total_batches: int
) -> Dict[str, Any]:
    """
    Process a single batch of transactions.
    
    Args:
        batch: List of transaction records
        project_id: Associated project ID
        batch_num: Current batch number (1-indexed)
        total_batches: Total number of batches in job
    
    Returns:
        Processing results summary
    """
    try:
        logger.info(
            f"Processing batch {batch_num}/{total_batches} "
            f"with {len(batch)} transactions for project {project_id}"
        )
        
        # Update task state for real-time monitoring
        self.update_state(
            state='PROCESSING',
            meta={
                'batch_num': batch_num,
                'total_batches': total_batches,
                'items_count': len(batch),
                'progress': (batch_num / total_batches) * 100
            }
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
                        f"Batch {batch_num}: {within_batch_progress:.1f}% complete"
                    )
                    
            except Exception as e:
                logger.error(
                    f"Failed to process transaction {transaction.get('id')}: {e}"
                )
                failed_count += 1
        
        return {
            'batch_num': batch_num,
            'processed': processed_count,
            'failed': failed_count,
            'results': results,
            'status': 'completed'
        }
        
    except Exception as exc:
        logger.error(f"Batch {batch_num} failed: {exc}")
        # Retry with exponential backoff
        raise self.retry(exc=exc)


def _process_single_transaction(transaction: Dict[str, Any], project_id: str):
    """Process a single transaction record."""
    from app.modules.ingestion.tasks import process_ingestion_task
    
    # Your existing processing logic
    # This is placeholder - integrate your actual logic
    return {
        'id': transaction.get('id'),
        'status': 'processed',
        'timestamp': time.time()
    }


@celery_app.task(
    name='zenith_forensic.tasks.ingestion.finalize_batch_job',
    bind=True
)
def finalize_batch_job(self, batch_results: List[Dict], job_id: str):
    """
    Finalize job after all batches complete.
    
    Args:
        batch_results: Results from all batch tasks
        job_id: Job identifier
    """
    total_processed = sum(r['processed'] for r in batch_results)
    total_failed = sum(r['failed'] for r in batch_results)
    
    logger.info(
        f"Job {job_id} completed: "
        f"{total_processed} processed, {total_failed} failed"
    )
    
    # Update job status in database
    from app.models import ProcessingJob
    from app.database import get_db
    
    with get_db() as db:
        job = db.query(ProcessingJob).filter(
            ProcessingJob.id == job_id
        ).first()
        
        if job:
            job.status = 'completed'
            job.items_processed = total_processed
            job.items_failed = total_failed
            job.completed_at = time.time()
            db.commit()
    
    # Trigger notifications or downstream tasks
    # ...
    
    return {
        'job_id': job_id,
        'total_processed': total_processed,
        'total_failed': total_failed,
        'status': 'finalized'
    }


def submit_batch_processing_job(
    items: List[Dict[str, Any]],
    project_id: str,
    data_type: str = 'transaction'
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
    from app.models import ProcessingJob
    from app.database import get_db
    
    job_id = str(uuid.uuid4())
    
    # Calculate optimal batching
    optimizer = BatchOptimizer()
    config = optimizer.calculate_batch_config(data_type, len(items))
    
    # Split into batches
    batches = [
        items[i:i + config.size]
        for i in range(0, len(items), config.size)
    ]
    
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
            status='pending',
            batch_config={
                'size': config.size,
                'concurrent': config.concurrent_batches,
                'delay_ms': config.delay_between_batches_ms
            }
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
            total_batches=len(batches)
        ).set(priority=5 if idx < 3 else 3)  # Higher priority for first batches
        for idx, batch in enumerate(batches)
    )
    
    # Chord: run batches in parallel, then finalize
    workflow = chord(batch_tasks)(
        finalize_batch_job.s(job_id=job_id)
    )
    
    return job_id
```

---

## 3. Database Schema for Job Tracking

```python
# backend/app/models/processing_job.py

from sqlmodel import SQLModel, Field, Column, JSON
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class ProcessingJob(SQLModel, table=True):
    """Track background processing jobs."""
    
    __tablename__ = "processing_jobs"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    project_id: Optional[str] = Field(
        default=None,
        foreign_key="project.id",
        index=True
    )
    
    # Job Metadata
    data_type: str  # 'transaction', 'entity', 'embedding', etc.
    status: JobStatus = Field(default=JobStatus.PENDING, index=True)
    
    # Batch Configuration
    total_items: int
    total_batches: int
    batch_config: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    
    # Progress Tracking
    batches_completed: int = Field(default=0)
    items_processed: int = Field(default=0)
    items_failed: int = Field(default=0)
    
    # Timing
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Error Handling
    error_message: Optional[str] = None
    retry_count: int = Field(default=0)
    
    # Celery Integration
    celery_task_ids: Dict[str, str] = Field(
        default_factory=dict,
        sa_column=Column(JSON)
    )  # Maps batch_num to task_id
    
    @property
    def progress_percent(self) -> float:
        """Calculate overall progress percentage."""
        if self.total_items == 0:
            return 0.0
        return (self.items_processed / self.total_items) * 100
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate of processed items."""
        total_attempted = self.items_processed + self.items_failed
        if total_attempted == 0:
            return 0.0
        return (self.items_processed / total_attempted) * 100
```

---

## 4. API Endpoints

```python
# backend/app/api/v1/endpoints/batch_jobs.py

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models import ProcessingJob, JobStatus
from app.tasks.ingestion_tasks import submit_batch_processing_job
from pydantic import BaseModel

router = APIRouter(prefix="/batch-jobs", tags=["batch-processing"])

class JobSubmissionRequest(BaseModel):
    project_id: str
    data_type: str
    items: List[Dict[str, Any]]

class JobStatusResponse(BaseModel):
    id: str
    status: str
    progress_percent: float
    items_processed: int
    items_failed: int
    total_items: int
    created_at: str
    estimated_completion_time: Optional[str] = None

@router.post("/submit", response_model=Dict[str, str])
async def submit_job(
    request: JobSubmissionRequest,
    db: Session = Depends(get_db)
):
    """
    Submit a batch processing job.
    
    Returns job ID for tracking.
    """
    if len(request.items) == 0:
        raise HTTPException(status_code=400, detail="No items provided")
    
    if len(request.items) > 1_000_000:
        raise HTTPException(
            status_code=400,
            detail="Maximum 1 million items per job"
        )
    
    job_id = submit_batch_processing_job(
        items=request.items,
        project_id=request.project_id,
        data_type=request.data_type
    )
    
    return {"job_id": job_id, "status": "submitted"}

@router.get("/{job_id}", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    db: Session = Depends(get_db)
):
    """Get status of a processing job."""
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Estimate completion time
    if job.status == JobStatus.PROCESSING and job.started_at:
        elapsed = (datetime.utcnow() - job.started_at).total_seconds()
        if job.items_processed > 0:
            rate = job.items_processed / elapsed  # items per second
            remaining = job.total_items - job.items_processed
            eta_seconds = remaining / rate if rate > 0 else None
            eta = datetime.utcnow() + timedelta(seconds=eta_seconds) if eta_seconds else None
        else:
            eta = None
    else:
        eta = None
    
    return JobStatusResponse(
        id=job.id,
        status=job.status.value,
        progress_percent=job.progress_percent,
        items_processed=job.items_processed,
        items_failed=job.items_failed,
        total_items=job.total_items,
        created_at=job.created_at.isoformat(),
        estimated_completion_time=eta.isoformat() if eta else None
    )

@router.post("/{job_id}/cancel")
async def cancel_job(
    job_id: str,
    db: Session = Depends(get_db)
):
    """Cancel a running job."""
    from app.core.celery_config import celery_app
    
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status in [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail=f"Job already {job.status.value}")
    
    # Revoke all celery tasks
    for task_id in job.celery_task_ids.values():
        celery_app.control.revoke(task_id, terminate=True)
    
    job.status = JobStatus.CANCELLED
    db.commit()
    
    return {"status": "cancelled"}

@router.get("/", response_model=List[JobStatusResponse])
async def list_jobs(
    project_id: Optional[str] = None,
    status: Optional[JobStatus] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """List all processing jobs with optional filters."""
    query = db.query(ProcessingJob)
    
    if project_id:
        query = query.filter(ProcessingJob.project_id == project_id)
    
    if status:
        query = query.filter(ProcessingJob.status == status)
    
    jobs = query.order_by(ProcessingJob.created_at.desc()).offset(offset).limit(limit).all()
    
    return [
        JobStatusResponse(
            id=job.id,
            status=job.status.value,
            progress_percent=job.progress_percent,
            items_processed=job.items_processed,
            items_failed=job.items_failed,
            total_items=job.total_items,
            created_at=job.created_at.isoformat()
        )
        for job in jobs
    ]
```

---

## 5. Frontend Integration

### 5.1 Job Monitoring Hook

```typescript
// frontend/src/hooks/useJobMonitor.ts

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/utils/constants';

interface JobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress_percent: number;
  items_processed: number;
  items_failed: number;
  total_items: number;
  created_at: string;
  estimated_completion_time?: string;
}

export function useJobMonitor(jobId: string | null, pollInterval: number = 2000) {
  const [job, setJob] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchJobStatus = useCallback(async () => {
    if (!jobId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/v1/batch-jobs/${jobId}`);
      
      if (response.ok) {
        const data = await response.json();
        setJob(data);
        setError(null);
      } else {
        setError('Failed to fetch job status');
      }
    } catch (err) {
      setError('Network error');
      console.error('Job status fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;

    // Initial fetch
    fetchJobStatus();

    // Set up polling if job is still running
    const shouldPoll = job?.status === 'pending' || job?.status === 'processing';
    
    if (shouldPoll) {
      const intervalId = setInterval(fetchJobStatus, pollInterval);
      return () => clearInterval(intervalId);
    }
  }, [jobId, job?.status, fetchJobStatus, pollInterval]);

  return { job, error, isLoading, refresh: fetchJobStatus };
}
```

### 5.2 Progress Monitor Component

```typescript
// frontend/src/components/JobProgressMonitor.tsx

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Clock, TrendingUp } from 'lucide-react';
import { useJobMonitor } from '@/hooks/useJobMonitor';

interface JobProgressMonitorProps {
  jobId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export function JobProgressMonitor({ 
  jobId, 
  onComplete, 
  onError 
}: JobProgressMonitorProps) {
  const { job, error, isLoading } = useJobMonitor(jobId);

  React.useEffect(() => {
    if (job?.status === 'completed' && onComplete) {
      onComplete();
    }
    if (job?.status === 'failed' && onError) {
      onError('Job processing failed');
    }
  }, [job?.status, onComplete, onError]);

  if (!job && isLoading) {
    return (
      <div className="flex items-center gap-3 p-4 bg-slate-900/40 rounded-2xl border border-white/5">
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
        <span className="text-sm text-slate-400">Loading job status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
        <XCircle className="w-5 h-5 text-rose-500" />
        <span className="text-sm text-rose-400">{error}</span>
      </div>
    );
  }

  if (!job) return null;

  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-emerald-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-rose-500" />;
      case 'processing':
        return <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />;
      default:
        return <Clock className="w-6 h-6 text-slate-500" />;
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case 'completed':
        return 'border-emerald-500/20 bg-emerald-500/10';
      case 'failed':
      case 'cancelled':
        return 'border-rose-500/20 bg-rose-500/10';
      case 'processing':
        return 'border-indigo-500/20 bg-indigo-500/10';
      default:
        return 'border-white/5 bg-slate-900/40';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-2xl border ${getStatusColor()} space-y-4`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              Processing Job
            </h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
              Status: {job.status}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-white">
            {job.progress_percent.toFixed(1)}%
          </div>
          <div className="text-[9px] text-slate-500 uppercase tracking-widest">
            Complete
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${job.progress_percent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400"
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>{job.items_processed.toLocaleString()} / {job.total_items.toLocaleString()} items</span>
          {job.estimated_completion_time && job.status === 'processing' && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ETA: {new Date(job.estimated_completion_time).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <div>
            <div className="text-xs font-bold text-slate-400">Processed</div>
            <div className="text-sm font-black text-white">
              {job.items_processed.toLocaleString()}
            </div>
          </div>
        </div>
        {job.items_failed > 0 && (
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-500" />
            <div>
              <div className="text-xs font-bold text-slate-400">Failed</div>
              <div className="text-sm font-black text-rose-400">
                {job.items_failed.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
```

---

## 6. Resource Monitoring & Alerts

### 6.1 System Health Check Task

```python
# backend/app/tasks/monitoring.py

from app.core.celery_config import celery_app
from app.core.batch_optimizer import BatchOptimizer
import logging

logger = logging.getLogger(__name__)

@celery_app.task(name='zenith_forensic.tasks.monitoring.health_check')
def health_check():
    """
    Periodic health check of system resources.
    Triggers alerts if resources are critically low.
    """
    resources = BatchOptimizer.get_system_resources()
    
    # Log current resource usage
    logger.info(
        f"System Health: CPU={resources.cpu_percent:.1f}%, "
        f"Memory Free={resources.memory_available_gb:.2f}GB, "
        f"Disk I/O Wait={resources.disk_io_wait:.1f}%"
    )
    
    # Check for critical conditions
    alerts = []
    
    if resources.cpu_percent > 95:
        alerts.append({
            'level': 'critical',
            'metric': 'cpu',
            'value': resources.cpu_percent,
            'message': 'CPU usage critically high'
        })
    
    if resources.memory_available_gb < 1.0:
        alerts.append({
            'level': 'critical',
            'metric': 'memory',
            'value': resources.memory_available_gb,
            'message': 'Available memory critically low'
        })
    
    if resources.disk_io_wait > 50:
        alerts.append({
            'level': 'warning',
            'metric': 'disk_io',
            'value': resources.disk_io_wait,
            'message': 'High disk I/O wait time'
        })
    
    # Send alerts if any
    if alerts:
        send_alerts(alerts)
    
    return {
        'resources': resources.__dict__,
        'alerts': alerts,
        'status': 'critical' if any(a['level'] == 'critical' for a in alerts) else 'healthy'
    }

def send_alerts(alerts: list):
    """Send alerts via configured channels (email, Slack, etc.)."""
    # Implementation depends on your notification preferences
    for alert in alerts:
        logger.warning(f"ALERT: {alert['message']} ({alert['metric']}={alert['value']})")
        # Add email/Slack/webhook notification here
```

---

## 7. Deployment Configuration

### 7.1 Docker Compose for Local Development

```yaml
# docker-compose.celery.yml

version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  celery_worker:
    build: ./backend
    command: celery -A app.core.celery_config:celery_app worker --loglevel=info --concurrency=4 --max-tasks-per-child=50
    volumes:
      - ./backend:/app
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/1
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      redis:
        condition: service_healthy
    deploy:
      replicas: 2  # Run 2 worker instances
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  celery_beat:
    build: ./backend
    command: celery -A app.core.celery_config:celery_app beat --loglevel=info
    volumes:
      - ./backend:/app
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - redis

  flower:
    build: ./backend
    command: celery -A app.core.celery_config:celery_app flower --port=5555
    ports:
      - "5555:5555"
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/1
    depends_on:
      - redis
      - celery_worker

volumes:
  redis_data:
```

### 7.2 Kubernetes Configuration

```yaml
# k8s/celery-worker-deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: celery-worker
  namespace: zenith-lite
spec:
  replicas: 3  # Auto-scale based on queue length
  selector:
    matchLabels:
      app: celery-worker
  template:
    metadata:
      labels:
        app: celery-worker
    spec:
      containers:
      - name: worker
        image: zenith-backend:latest
        command:
          - celery
          - -A
          - app.core.celery_config:celery_app
          - worker
          - --loglevel=info
          - --concurrency=4
          - --max-tasks-per-child=50
        env:
        - name: CELERY_BROKER_URL
          value: "redis://redis-service:6379/0"
        - name: CELERY_RESULT_BACKEND
          value: "redis://redis-service:6379/1"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        resources:
          requests:
            memory: "1Gi"
            cpu: "1000m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          exec:
            command:
            - celery
            - -A
            - app.core.celery_config:celery_app
            - inspect
            - ping
          initialDelaySeconds: 30
          periodSeconds: 60
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: celery-worker-hpa
  namespace: zenith-lite
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: celery-worker
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## 8. Best Practices & Recommendations

### 8.1 Performance Optimization

1. **Connection Pooling**
   - Use SQLAlchemy connection pools with proper limits
   - Configure Redis connection pooling
   - Example: `pool_size=20, max_overflow=10`

2. **Batch Size Tuning**
   - Start with conservative batch sizes (100-500 items)
   - Monitor memory usage and adjust
   - Use dynamic batch sizing based on data complexity

3. **Task Prioritization**
   - Critical tasks: priority 9-10
   - Normal tasks: priority 5-6
   - Cleanup/maintenance: priority 1-2

4. **Result Expiration**
   - Set short TTL for task results (1-2 hours)
   - Archive important results to database
   - Clean up completed tasks regularly

### 8.2 Error Handling

1. **Retry Strategy**
   - Use exponential backoff: `retry_backoff=True`
   - Maximum retry delay: 10 minutes
   - Add jitter to prevent thundering herd

2. **Dead Letter Queue**
   - Configure for tasks that fail all retries
   - Manual review and reprocessing
   - Alert on DLQ threshold

3. **Circuit Breaker**
   - Stop processing if error rate > 50%
   - Prevents cascading failures
   - Automatic recovery after cooldown

### 8.3 Monitoring & Observability

1. **Key Metrics to Track**
   - Task throughput (tasks/minute)
   - Task latency (95th percentile)
   - Queue depth
   - Worker CPU/memory usage
   - Error rate by task type

2. **Alerting Thresholds**
   - Queue depth > 10,000: Warning
   - Queue depth > 50,000: Critical
   - Error rate > 5%: Warning
   - Error rate > 20%: Critical
   - Worker CPU > 90%: Warning

3. **Logging Standards**
   - Structured logging (JSON format)
   - Include correlation IDs
   - Log all task lifecycle events
   - Sampling for high-volume tasks

---

## 9. Migration Path

### Phase 1: Setup Infrastructure (Week 1)

- [ ] Install Redis and Celery
- [ ] Configure Celery with basic settings
- [ ] Create ProcessingJob model
- [ ] Set up Flower monitoring

### Phase 2: Implement Basic Batching (Week 2)

- [ ] Create batch optimizer
- [ ] Implement first batch task (transactions)
- [ ] Add API endpoints for job submission
- [ ] Build frontend job monitor component

### Phase 3: Rate Limiting & Optimization (Week 3)

- [ ] Implement dynamic batch sizing
- [ ] Add resource monitoring
- [ ] Configure retry logic
- [ ] Set up alerting

### Phase 4: Scale & Monitor (Week 4)

- [ ] Deploy to Kubernetes
- [ ] Configure auto-scaling
- [ ] Set up Prometheus/Grafana
- [ ] Performance testing and tuning

---

## 10. Cost Optimization

### Resource Allocation Guidelines

| Environment | Workers | Batch Size | Est. Throughput | Monthly Cost |
|-------------|---------|------------|-----------------|--------------|
| Development | 1-2     | 100-200    | 10K txn/hour    | ~$50         |
| Staging     | 2-4     | 300-500    | 50K txn/hour    | ~$200        |
| Production  | 4-10    | 500-1000   | 200K txn/hour   | ~$800        |

**Optimization Tips:**

- Use spot instances for workers (70% cost savings)
- Scale down during off-hours
- Use Redis clustering only in production
- Monitor and rightsize worker resources monthly

---

## Conclusion

This architecture provides a robust, scalable foundation for background batch processing that:

✅ **Prevents system overload** through dynamic rate limiting  
✅ **Handles millions of records** efficiently via intelligent batching  
✅ **Provides real-time visibility** into processing status  
✅ **Gracefully handles failures** with retry logic and circuit breakers  
✅ **Scales automatically** based on workload and resources  

**Next Steps:**

1. Review this architecture with your team
2. Set up local development environment with Docker Compose
3. Implement Phase 1 (Infrastructure Setup)
4. Test with sample dataset
5. Iterate and optimize based on real-world performance

---

**Document Owner**: AI Development Team  
**Last Review**: 2026-01-29  
**Next Review**: 2026-02-28
