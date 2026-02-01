# Quick Fix Guide - Critical TODOs

This guide provides **ready-to-implement code** for the most critical unimplemented TODOs.

---

## 🔴 CRITICAL: Evidence Search Project Filtering

**File:** `backend/app/modules/evidence/router.py:146`  
**Priority:** Implement before production deployment  
**Risk:** Multi-tenant data isolation breach

### Current Code (Line 146-148)

```python
@router.get("/{project_id}/search")
async def search_evidence(
    project_id: str,
    query: str,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """Search for relevant evidence using RAG context."""
    # TODO: Pass project_id to filter RAG context
    results = rag_service.query_context(query)
    return results
```

### Fixed Code

```python
@router.get("/{project_id}/search")
async def search_evidence(
    project_id: str,
    query: str,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """Search for relevant evidence using RAG context."""
    # Filter RAG context by project for security isolation
    results = rag_service.query_context(query, project_id=project_id)
    return results
```

### Update RAG Service

You'll also need to update `app/core/rag.py`:

```python
class RAGService:
    def query_context(self, query: str, project_id: Optional[str] = None, top_k: int = 5):
        """
        Query vector store with project filtering.
        
        Args:
            query: Search query
            project_id: Filter results to this project only (SECURITY)
            top_k: Number of results
        """
        # Create embedding
        query_embedding = self.embed_text(query)
        
        # Build filter for project isolation
        metadata_filter = {"project_id": project_id} if project_id else {}
        
        # Query with filter
        results = self.vector_store.query(
            query_embedding,
            top_k=top_k,
            metadata_filter=metadata_filter  # CRITICAL for multi-tenant security
        )
        
        return results
```

---

## 🟡 HIGH: System Health Alerting

**File:** `backend/app/tasks/monitoring.py:32,88`  
**Priority:** Implement for production monitoring

### Complete Implementation

```python
# backend/app/tasks/monitoring.py

import os
import requests
from typing import Dict, Optional

def send_alert(alert_data: Dict):
    """
    Send system alerts via configured channels.
    
    Args:
        alert_data: Alert information including status and metrics
    """
    # Log locally regardless
    logger.warning(f"ALERT: {alert_data['status']} - {alert_data['message']}")
    
    # 1. Slack Integration
    _send_slack_alert(alert_data)
    
    # 2. Email Integration
    _send_email_alert(alert_data)


def _send_slack_alert(alert_data: Dict):
    """Send alert to Slack webhook."""
    webhook_url = os.getenv('SLACK_WEBHOOK_URL')
    
    if not webhook_url:
        logger.debug("SLACK_WEBHOOK_URL not configured, skipping Slack alert")
        return
    
    try:
        # Format alert for Slack
        color = 'danger' if alert_data['status'] == 'critical' else 'warning'
        emoji = '🚨' if alert_data['status'] == 'critical' else '⚠️'
        
        payload = {
            'text': f"{emoji} **Zenith System Alert**",
            'attachments': [{
                'color': color,
                'title': f"{alert_data['status'].upper()}: {alert_data['message']}",
                'fields': [
                    {'title': 'CPU Usage', 'value': f"{alert_data['cpu_percent']:.1f}%", 'short': True},
                    {'title': 'Memory Available', 'value': f"{alert_data['memory_available_gb']:.2f}GB", 'short': True},
                    {'title': 'Disk I/O Wait', 'value': f"{alert_data['disk_io_wait']:.1f}%", 'short': True},
                    {'title': 'Timestamp', 'value': datetime.utcnow().isoformat(), 'short': True},
                ],
                'footer': 'Zenith Monitoring',
                'footer_icon': 'https://zenith.app/icon.png'
            }]
        }
        
        response = requests.post(webhook_url, json=payload, timeout=5)
        response.raise_for_status()
        logger.info("Slack alert sent successfully")
        
    except Exception as e:
        logger.error(f"Failed to send Slack alert: {e}")


def _send_email_alert(alert_data: Dict):
    """Send alert via email using SendGrid."""
    sendgrid_api_key = os.getenv('SENDGRID_API_KEY')
    alert_email = os.getenv('ALERT_EMAIL', 'ops@zenith.app')
    
    if not sendgrid_api_key:
        logger.debug("SENDGRID_API_KEY not configured, skipping email alert")
        return
    
    try:
        # Use SendGrid API
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        
        subject = f"🚨 Zenith Alert: {alert_data['status'].upper()}"
        
        html_content = f"""
        <h2>System Alert: {alert_data['message']}</h2>
        <table>
            <tr><td><strong>Status:</strong></td><td>{alert_data['status']}</td></tr>
            <tr><td><strong>CPU:</strong></td><td>{alert_data['cpu_percent']:.1f}%</td></tr>
            <tr><td><strong>Memory Available:</strong></td><td>{alert_data['memory_available_gb']:.2f}GB</td></tr>
            <tr><td><strong>Disk I/O Wait:</strong></td><td>{alert_data['disk_io_wait']:.1f}%</td></tr>
            <tr><td><strong>Time:</strong></td><td>{datetime.utcnow().isoformat()}</td></tr>
        </table>
        <p>Please investigate immediately if status is CRITICAL.</p>
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
```

### Environment Variables Required

Add to your `.env`:

```bash
# Alerting Configuration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
ALERT_EMAIL=ops@yourcompany.com
```

### Dependencies

Add to `requirements.txt`:

```
sendgrid>=6.9.0
requests>=2.28.0
```

---

## 🟡 MEDIUM: Batch Task Integration

**File:** `backend/app/tasks/batch_tasks.py:170`  
**Status:** Needs verification - may already be implemented elsewhere

### Investigation Steps

1. **Check if ingestion logic exists:**

```bash
grep -r "process_ingestion" backend/app/
```

1. **Look for existing transaction processing:**

```bash
grep -r "def.*process.*transaction" backend/app/modules/
```

1. **Check for reconciliation service integration:**

```bash
grep -r "ReconciliationService\|TransactionService" backend/app/
```

### If Found - Refactor to Use Existing Logic

```python
# backend/app/tasks/batch_tasks.py

from app.modules.ingestion.service import process_transaction  # Import existing service

def _process_single_transaction(transaction: Dict[str, Any], project_id: str) -> Dict[str, Any]:
    """
    Process a single transaction record.
    Integrates with existing ingestion logic.
    """
    try:
        # Use existing service instead of stub
        result = process_transaction(
            transaction_data=transaction,
            project_id=project_id
        )
        
        return {
            "id": transaction.get("id"),
            "status": "processed",
            "timestamp": time.time(),
            "result": result
        }
    except Exception as e:
        logger.error(f"Transaction processing error: {e}")
        raise
```

### If Not Found - Implement Basic Processing

```python
def _process_single_transaction(transaction: Dict[str, Any], project_id: str) -> Dict[str, Any]:
    """
    Process a single transaction record with reconciliation and forensics.
    """
    from app.database import get_db
    from app.models import Transaction, TransactionStatus
    from app.modules.forensic.reconciliation_service import ReconciliationService
    
    with get_db() as db:
        try:
            # 1. Create or update transaction record
            tx = Transaction(
                id=transaction.get("id", str(uuid.uuid4())),
                project_id=project_id,
                amount=Decimal(str(transaction["amount"])),
                date=transaction["date"],
                description=transaction.get("description", ""),
                source_system=transaction.get("source", "batch_import"),
                status=TransactionStatus.PENDING_REVIEW,
                metadata_json=transaction
            )
            
            db.add(tx)
            db.commit()
            
            # 2. Run reconciliation
            recon_service = ReconciliationService(db)
            recon_result = recon_service.match_transaction(tx.id, project_id)
            
            # 3. Run forensic checks
            from app.modules.forensic.rab_service import RABService
            rab_service = RABService(db)
            forensic_flags = rab_service.analyze_transaction(tx.id)
            
            return {
                "id": tx.id,
                "status": "processed",
                "timestamp": time.time(),
                "reconciliation": recon_result,
                "forensic_flags": forensic_flags
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Transaction processing failed: {e}")
            raise
```

---

## 🟡 MEDIUM: Job Archival Strategy

**File:** `backend/app/tasks/monitoring.py:67`

### Option 1: Archive Table (Recommended)

```python
# backend/app/models.py - Add archive model

class ProcessingJobArchive(SQLModel, table=True):
    """Archived processing jobs for long-term retention."""
    __tablename__ = "processing_job_archive"
    
    id: str = Field(primary_key=True)
    project_id: str = Field(index=True)
    data_type: str
    total_items: int
    items_processed: int
    items_failed: int
    status: JobStatus
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    error_message: Optional[str]
    archived_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Store full job as JSON for completeness
    job_snapshot: Dict = Field(default={}, sa_column=Column(JSON))
```

```python
# backend/app/tasks/monitoring.py - Update cleanup function

@celery_app.task(name="zenith_forensic.tasks.maintenance.cleanup_old_jobs")
def cleanup_old_jobs() -> dict:
    """
    Archive old completed jobs to separate table.
    Runs daily to prevent main table bloat.
    """
    from app.database import get_db
    from app.models import ProcessingJob, ProcessingJobArchive, JobStatus
    
    cutoff_date = datetime.utcnow() - timedelta(days=7)
    
    with get_db() as db:
        # Find old jobs
        old_jobs = (
            db.query(ProcessingJob)
            .filter(
                ProcessingJob.status.in_([
                    JobStatus.COMPLETED, 
                    JobStatus.FAILED, 
                    JobStatus.CANCELLED
                ]),
                ProcessingJob.completed_at < cutoff_date,
            )
            .all()
        )
        
        archived_count = 0
        
        for job in old_jobs:
            # Create archive record
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
                archived_at=datetime.utcnow(),
                job_snapshot=job.dict()  # Full snapshot
            )
            
            db.add(archive)
            db.delete(job)
            archived_count += 1
        
        db.commit()
        logger.info(f"Archived {archived_count} jobs to long-term storage")
        
    return {
        "archived_count": archived_count,
        "cutoff_date": cutoff_date.isoformat(),
        "status": "completed"
    }
```

### Option 2: S3/GCS Export (For Very Long Retention)

```python
# backend/app/tasks/monitoring.py

import boto3
import json
from botocore.exceptions import ClientError

def export_jobs_to_s3(jobs: List[ProcessingJob]) -> str:
    """Export jobs to S3 for long-term archival."""
    
    s3_client = boto3.client('s3')
    bucket_name = os.getenv('ARCHIVE_BUCKET', 'zenith-job-archives')
    
    # Group by month for efficient storage
    archive_key = f"job-archives/{datetime.utcnow().strftime('%Y/%m')}/jobs-{uuid.uuid4()}.jsonl"
    
    # Create JSONL file
    lines = [json.dumps(job.dict()) for job in jobs]
    archive_data = '\n'.join(lines)
    
    try:
        s3_client.put_object(
            Bucket=bucket_name,
            Key=archive_key,
            Body=archive_data.encode('utf-8'),
            ContentType='application/jsonl',
            StorageClass='GLACIER_IR'  # Cheap long-term storage
        )
        logger.info(f"Exported {len(jobs)} jobs to s3://{bucket_name}/{archive_key}")
        return archive_key
        
    except ClientError as e:
        logger.error(f"S3 export failed: {e}")
        raise
```

---

## 📋 Deployment Checklist

Before marking TODOs as complete:

- [ ] Evidence search filtering implemented and tested with multiple projects
- [ ] Alerting configured with Slack webhook tested
- [ ] Alerting configured with email tested  
- [ ] Batch integration verified or implemented
- [ ] Archive strategy chosen and implemented
- [ ] Archive retention policy documented
- [ ] All changes tested in staging environment
- [ ] Security review completed for evidence filtering
- [ ] Monitoring dashboards updated

---

## 🔗 Related Files

- Evidence RAG Service: `backend/app/core/rag.py`
- Monitoring Config: `backend/app/core/celery_config.py`
- Batch Models: `backend/app/models.py`
- Integration Tests: `backend/tests/integration/`
