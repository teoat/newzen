from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from typing import List, Dict, Any, Optional
import pandas as pd
import shutil
import os
import uuid
import re
import hashlib
from datetime import datetime
from pydantic import BaseModel, validator
from app.core.db import get_session, engine
from app.core.audit import AuditLogger
from app.core.event_bus import publish_event, EventType
from app.core.auth_middleware import verify_project_access
from app.models import (
    Transaction,
    BankTransaction,
    TransactionCategory,
    Document,
    Ingestion,
    Project,  # Moved this Project import here
)
from app.modules.fraud.reconciliation_router import detect_forensic_triggers
from app.core.reconciliation_intelligence import BatchReferenceDetector

router = APIRouter(prefix="/ingestion", tags=["Evidence Ingestion"])
UPLOAD_DIR = "storage/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def process_internal_batch(file_path: str, project_id: str):
    """Background task to process internal ledger files."""
    try:
        # Create a new session for the background task
        with Session(engine) as db:
            df = pd.read_csv(file_path) if file_path.endswith(".csv") else pd.read_excel(file_path)
            # Simple normalization
            df.columns = [c.lower().replace(" ", "_") for c in df.columns]
            count = 0
            for _, row in df.iterrows():
                try:
                    # Robust Coordinate Parsing
                    lat = row.get("latitude")
                    lng = row.get("longitude")
                    geo = row.get("geolocation")
                    if geo and isinstance(geo, str) and "," in geo:
                        parts = geo.split(",")
                        lat = parts[0].strip()
                        lng = parts[1].strip()
                    desc = str(row.get("description", ""))
                    # Extract batch ref
                    batch_ref = BatchReferenceDetector.extract_batch_id(desc)
                    tx = Transaction(
                        project_id=project_id,
                        proposed_amount=float(row.get("proposed_amount", 0) or 0),
                        actual_amount=float(row.get("actual_amount", 0) or 0),
                        amount=float(row.get("actual_amount", 0) or 0),
                        sender=str(row.get("sender", "Unknown")),
                        receiver=str(row.get("receiver", "Unknown")),
                        description=desc,
                        category_code=str(row.get("category_code", TransactionCategory.P)),
                        account_entity=str(row.get("account_entity", "")),
                        audit_comment=str(row.get("audit_comment", "")),
                        latitude=float(lat) if lat and str(lat).strip() else None,
                        longitude=float(lng) if lng and str(lng).strip() else None,
                        # ...
                        timestamp=pd.to_datetime(
                            row.get("timestamp", datetime.utcnow())
                        ).to_pydatetime(),
                        status="pending",
                        batch_reference=batch_ref,
                    )
                    # Run forensic triggers
                    detect_forensic_triggers(tx, db)
                    db.add(tx)
                    count += 1
                except Exception as row_err:
                    print(f"Row error: {row_err}")
                    continue
            db.commit()
            publish_event(
                EventType.DATA_INGESTED,
                {"file": file_path, "rows": count, "type": "internal"},
                project_id=project_id,
            )
            print(f"Background Ingestion Complete: {count} rows processed from {file_path}")
    except Exception as e:
        print(f"File Processing Error: {e}")
    finally:
        # Cleanup
        if os.path.exists(file_path):
            os.remove(file_path)


def process_bank_batch(file_path: str, project_id: str):
    """Background task to process bank statement files."""
    try:
        with Session(engine) as db:
            df = pd.read_csv(file_path) if file_path.endswith(".csv") else pd.read_excel(file_path)
            df.columns = [c.lower().replace(" ", "_") for c in df.columns]
            count = 0
            for _, row in df.iterrows():
                try:
                    desc = str(row.get("description", ""))
                    # Extract batch ref
                    batch_ref = BatchReferenceDetector.extract_batch_id(desc)
                    bank_tx = BankTransaction(
                        project_id=project_id,
                        amount=float(row.get("amount", 0) or 0),
                        bank_name=str(row.get("bank_name", "BCA")),
                        description=desc,
                        timestamp=pd.to_datetime(
                            row.get("timestamp", datetime.utcnow())
                        ).to_pydatetime(),
                        batch_reference=batch_ref,
                    )
                    db.add(bank_tx)
                    count += 1
                except Exception as row_err:
                    print(f"Row error: {row_err}")
                    continue
            db.commit()
            publish_event(
                EventType.DATA_INGESTED,
                {"file": file_path, "rows": count, "type": "bank"},
                project_id=project_id,
            )
            print(f"Background Bank Ingestion Complete: {count} rows processed from {file_path}")
    except Exception as e:
        print(f"File Processing Error: {e}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


@router.post("/{project_id}/upload/internal")
async def upload_internal_ledger(
    project_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    project: Project = Depends(verify_project_access),
):
    """
    Async upload for Internal Ledger (Expenses/Journal).
    Processes file in background to prevent timeouts.
    """
    file_id = str(uuid.uuid4())
    ext = file.filename.split(".")[-1]
    file_path = f"{UPLOAD_DIR}/internal_{file_id}.{ext}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    publish_event(
        EventType.DATA_UPLOADED,
        {"filename": file.filename, "type": "internal"},
        project_id=project.id,
    )
    background_tasks.add_task(process_internal_batch, file_path, project.id)
    return {
        "status": "queued",
        "message": "File uploaded and ingestion started in background.",
        "file_id": file_id,
    }


@router.post("/{project_id}/upload/bank")
async def upload_bank_statement(
    project_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    project: Project = Depends(verify_project_access),
):
    """
    Async upload for Bank Statements.
    """
    file_id = str(uuid.uuid4())
    ext = file.filename.split(".")[-1]
    file_path = f"{UPLOAD_DIR}/bank_{file_id}.{ext}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    publish_event(
        EventType.DATA_UPLOADED,
        {"filename": file.filename, "type": "bank"},
        project_id=project.id,
    )
    background_tasks.add_task(process_bank_batch, file_path, project.id)
    return {
        "status": "queued",
        "message": "File uploaded and ingestion started in background.",
        "file_id": file_id,
    }


# Security: File upload limits
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
MAX_ROWS = 100_000  # Maximum rows per CSV


class MappingItem(BaseModel):
    systemField: str
    label: str
    fileColumn: str
    required: bool
    isCustom: Optional[bool] = False


class ForensicCopilot:
    @staticmethod
    def generate_reasoning(
        row: Dict[str, Any], mappings: List[MappingItem], ingestion_type: str
    ) -> Dict[str, Any]:
        """Generates 'Inner Monologue' for a transaction."""
        field_map = {m.systemField: m.fileColumn for m in mappings if m.fileColumn}

        def get_val(f):
            col = field_map.get(f)
            return row.get(col) if col else None

        desc = (get_val("description") or "").upper()
        # 1. Primary & Alternative Theory
        primary = "Matched to Project Expense"
        alternative = None
        confidence = 85
        keywords = []
        if ingestion_type == "Statement":
            primary = "Bank Transaction Verification"
            confidence = 95
            if "MARKUP" in desc:
                alternative = "Potential Overpricing"
                confidence = 70
            elif "BCA" in desc or "MANDIRI" in desc:
                keywords.append("Bank Label")
        personal_kw = ["GPA", "PRIVATE", "MALL", "MEAL", "LUNCH"]
        if any(kw in desc for kw in personal_kw):
            primary = "Personal Leakage Signature"
            alternative = "Staff Welfare / Reimbursement"
            confidence = 65
            keywords.extend([kw for kw in personal_kw if kw in desc])
        return {
            "primary": primary,
            "alternative": alternative,
            "confidence": confidence,
            "triggers": keywords or ["Standard Pattern"],
        }


class IngestionPayload(BaseModel):
    projectId: str
    fileName: str
    fileType: str
    fileHash: str
    mappings: List[MappingItem]
    previewData: List[Dict[str, Any]]
    totalRows: int
    beginningBalance: Optional[float] = None
    endingBalance: Optional[float] = None
    batchMetadata: Optional[Dict[str, Any]] = None  # For chunked processing

    @validator("fileHash")
    def validate_hash(cls, v):
        if not v.startswith("SHA256:"):
            raise ValueError("Hash must use SHA256 format")
        return v


class BalanceCheck(BaseModel):
    matched: bool
    difference: float
    message: str


class IngestionResult(BaseModel):
    success: bool
    ingestionId: str
    recordsProcessed: int
    validationErrors: List[str]
    warnings: List[str]
    timestamp: str
    diagnostics: Dict[str, Any]
    balanceCheck: Optional[BalanceCheck] = None


def validate_geolocation(value: str) -> List[str]:
    """Validate geolocation format (expects LAT, LONG or similar)"""
    errors: List[str] = []
    if not value or value == "—":
        return errors
    # Check for common patterns
    if "lat" not in value.lower() and "long" not in value.lower():
        if "," not in value:
            msg = f"Geolocation format unclear: {value[:50]}"
            errors.append(msg)
    return errors


def validate_account_number(value: str) -> List[str]:
    """Validate account number (basic check for alphanumeric)"""
    errors: List[str] = []
    if not value or value == "—":
        return errors
    # Basic validation: should contain digits
    if not any(c.isdigit() for c in str(value)):
        msg = f"Account number should contain digits: {value[:30]}"
        errors.append(msg)
    return errors


def validate_amount(value: Any) -> List[str]:
    """Validate amount is numeric"""
    errors: List[str] = []
    if not value or value == "—":
        return errors
    try:
        # Try to convert to float
        float(str(value).replace(",", "").replace("Rp", "").strip())
    except ValueError:
        errors.append(f"Amount is not numeric: {value}")
    return errors


@router.post("/ingestion/validate")
async def validate_ingestion(
    payload: IngestionPayload,
    project: Project = Depends(verify_project_access),
):
    """
    Validate ingested data before final consolidation.
    Checks field formats, required fields, and data integrity.
    """
    # Ensure project ID in payload matches authorized project
    if payload.projectId != project.id:
        raise HTTPException(status_code=403, detail="Unauthorized project context")

    validation_errors = []
    warnings = []
    # Check required mappings
    required_fields = [m.systemField for m in payload.mappings if m.required]
    mapped_fields = [m.systemField for m in payload.mappings if m.fileColumn]
    missing_required = set(required_fields) - set(mapped_fields)
    if missing_required:
        msg = f"Missing required field mappings: {', '.join(missing_required)}"
        validation_errors.append(msg)
    # Validate data based on mapped fields
    field_validators = {
        "geolocation": validate_geolocation,
        "account_number": validate_account_number,
        "amount": validate_amount,
    }
    # Sample validate first 10 rows
    preview_insights = []
    for idx, row in enumerate(payload.previewData[:10]):
        # Reasoning preview
        col_names = [m.systemField for m in payload.mappings if m.fileColumn]
        ingestion_type = "Journal"
        if "balance" in col_names or "credit" in col_names:
            ingestion_type = "Statement"
        insight = ForensicCopilot.generate_reasoning(row, payload.mappings, ingestion_type)
        preview_insights.append(insight)
        for mapping in payload.mappings:
            if mapping.fileColumn and mapping.fileColumn in row:
                validator_func = field_validators.get(mapping.systemField)
                if validator_func:
                    errors_val = validator_func(row[mapping.fileColumn])
                    if errors_val:
                        warnings.extend([f"Row {idx+1}: {err}" for err in errors_val])
    return {
        "valid": len(validation_errors) == 0,
        "errors": validation_errors,
        "warnings": warnings[:20],  # Limit warnings
        "insights": preview_insights,
        "summary": {
            "totalRows": payload.totalRows,
            "mappedFields": len(mapped_fields),
            "requiredFieldsMapped": len([f for f in required_fields if f in mapped_fields]),
        },
    }


@router.post("/ingestion/consolidate", response_model=IngestionResult)
async def consolidate_ingestion(
    payload: IngestionPayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_session),
):
    """
    Finalize ingestion asynchronously.
    Returns an Ingestion ID immediately while processing continues in background.
    """
    from app.modules.ingestion.tasks import process_ingestion_task
    from app.models import Project, Ingestion

    # 1. Project Validation
    project = db.exec(select(Project).where(Project.id == payload.projectId)).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {payload.projectId} not found")
    # 2. Generate ID
    ing_seed = f"{payload.projectId}_{payload.fileName}_{datetime.now().isoformat()}"
    ingestion_id = hashlib.sha256(ing_seed.encode()).hexdigest()[:16].upper()
    # 3. Create Draft Record
    try:
        draft_ingestion = Ingestion(
            id=ingestion_id,
            project_id=payload.projectId,
            file_name=payload.fileName,
            file_type=payload.fileType,
            file_hash=payload.fileHash,
            records_processed=0,
            status="pending",  # Start as pending
            metadata_json={"total_rows_expected": len(payload.previewData)},
        )
        db.add(draft_ingestion)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to initialize ingestion: {str(e)}")
    # 4. Dispatch Processing
    # Check if we should use Batch Processing for large files (>1000 rows)
    if len(payload.previewData) > 1000:
        try:
            from app.tasks.batch_tasks import submit_batch_processing_job

            # Submit to Celery
            job_id = submit_batch_processing_job(
                items=payload.previewData,
                project_id=payload.projectId,
                data_type="transaction",
            )
            # Update Ingestion record with Job ID
            draft_ingestion.metadata_json = {
                **(draft_ingestion.metadata_json or {}),
                "job_id": job_id,
                "processing_mode": "batch_celery",
            }
            db.add(draft_ingestion)
            db.commit()
            return IngestionResult(
                success=True,
                ingestionId=ingestion_id,
                recordsProcessed=0,
                validationErrors=[],
                warnings=["Batch processing started for large dataset."],
                timestamp=datetime.now().isoformat(),
                diagnostics={
                    "status": "pending",
                    "mode": "batch",
                    "job_id": job_id,
                    "message": f"Queued {len(payload.previewData)} records for batch processing",
                },
                balanceCheck=None,
            )
        except ImportError:
            print(
                "Batch processing module not available, falling back to standard background task."
            )
        except Exception as e:
            print(f"Failed to submit batch job: {e}, falling back to standard background task.")
    # Fallback / Standard: Dispatch Background Task
    background_tasks.add_task(process_ingestion_task, payload.dict(), ingestion_id)
    # 5. Return Immediate Response
    return IngestionResult(
        success=True,
        ingestionId=ingestion_id,
        recordsProcessed=0,
        validationErrors=[],
        warnings=["Processing started in background."],
        timestamp=datetime.now().isoformat(),
        diagnostics={
            "status": "pending",
            "mode": "standard",
            "message": "Offloaded to background worker",
        },
        balanceCheck=None,
    )


@router.get("/ingestion/status/{ingestion_id}")
async def get_ingestion_status(ingestion_id: str, db: Session = Depends(get_session)):
    """
    Poll status of an asynchronous ingestion task.
    Supports both standard background tasks and Celery batch jobs.
    """
    from app.models import Ingestion, ProcessingJob

    ingestion = db.get(Ingestion, ingestion_id)
    if not ingestion:
        raise HTTPException(status_code=404, detail="Ingestion ID not found")
    # Check if this is a Batch Job
    job_id = (ingestion.metadata_json or {}).get("job_id")
    if job_id:
        job = db.get(ProcessingJob, job_id)
        if job:
            # Sync Job status to Ingestion status
            if job.status == "completed":
                ingestion.status = "completed"
                ingestion.records_processed = job.items_processed
            elif job.status == "failed":
                ingestion.status = "failed"
            elif job.status == "processing":
                ingestion.status = "processing"
            # Update Ingestion record
            db.add(ingestion)
            db.commit()
            return {
                "id": ingestion.id,
                "status": ingestion.status,
                "recordsProcessed": job.items_processed,
                "totalRows": job.total_items,
                "progress": job.progress_percent,
                "fileHash": ingestion.file_hash,
                "timestamp": ingestion.created_at.isoformat(),
                "diagnostics": {
                    **(ingestion.metadata_json or {}),
                    "batch_status": job.status,
                    "batches_completed": job.batches_completed,
                    "total_batches": job.total_batches,
                },
            }
    return {
        "id": ingestion.id,
        "status": ingestion.status,
        "recordsProcessed": ingestion.records_processed,
        "fileHash": ingestion.file_hash,
        "timestamp": ingestion.created_at.isoformat(),
        "diagnostics": ingestion.metadata_json or {},
    }


@router.get("/ingestion/history/{project_id}")
async def get_ingestion_history(
    project_id: str,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    Retrieve real ingestion history for a project from the DB.
    """
    statements = (
        select(Ingestion)
        .where(Ingestion.project_id == project.id)
        .order_by(Ingestion.created_at.desc())
    )
    history = db.exec(statements).all()
    return {
        "projectId": project_id,
        "ingestions": [
            {
                "id": h.id,
                "fileName": h.file_name,
                "timestamp": h.created_at.isoformat(),
                "recordsProcessed": h.records_processed,
                "status": h.status,
                "fileHash": h.file_hash,
            }
            for h in history
        ],
    }


@router.get("/ingestion/verify-integrity/{file_hash}")
async def verify_integrity(file_hash: str, db: Session = Depends(get_session)):
    """
    Forensic Integrity Check: Verify if a file exists in the manifest
    and hasn't been tampered with since original ingestion.
    """
    if not file_hash.startswith("SHA256:"):
        file_hash = f"SHA256:{file_hash}"
    doc = db.exec(select(Document).where(Document.file_hash == file_hash)).first()
    ingestion = db.exec(select(Ingestion).where(Ingestion.file_hash == file_hash)).first()
    if not doc and not ingestion:
        return {
            "verified": False,
            "status": "NOT_FOUND",
            "message": "File not found in forensic manifest",
        }
    AuditLogger.log_change(
        session=db,
        entity_type="Ingestion",
        entity_id=ingestion.id if ingestion else doc.id,
        action="VERIFY_INTEGRITY",
        reason=f"Integrity check for hash {file_hash}",
    )
    db.commit()
    return {
        "verified": True,
        "status": "ANCHORED",
        "file_name": doc.filename if doc else ingestion.file_name,
        "timestamp": (doc.created_at if doc else ingestion.created_at).isoformat(),
        "integrity_hash": file_hash,
    }


@router.post("/ingestion/smart-map")
async def smart_map_columns(columns: List[str]):
    """
    Intelligent Column Mapping: Uses fuzzy matching to map
    detected CSV columns to Zenith system fields.
    """
    system_fields = {
        # Core Financial Attributes
        "date": ["tanggal", "date", "tgl", "txn_date", "timestamp", "booking_date"],
        "description": [
            "uraian",
            "description",
            "desc",
            "keterangan",
            "narrative",
            "details",
        ],
        "amount": [
            "nominal",
            "amount",
            "jumlah",
            "total",
            "value",
            "transaction_amount",
        ],  # Normalized to float
        # Balance Sheet & Flow
        "balance": ["saldo", "balance", "closing_balance", "end_balance"],
        "credit": ["credit", "kredit", "in", "deposit", "masuk"],
        "debit": ["debit", "out", "payment", "keluar", "withdrawal"],
        # Forensic Entities (Aliases handled by EntityResolver)
        "sender": ["sender", "pengirim", "source", "from"],
        "receiver": ["receiver", "penerima", "beneficiary", "to", "destination"],
        "account_number": ["account", "rekening", "no_rek", "acc_num"],
        # Contextual Metadata
        "city": ["city", "kota", "branch_city"],
        "sub_group": [
            "sub_group",
            "sub_kategori",
            "batch",
            "sequence",
            "urutan",
            "line_id",
        ],
        # Project Timeline & Phases
        "timeline": [
            "phase",
            "termin",
            "period",
            "milestone",
            "stage",
            "tahap",
            "week",
            "month",
        ],
    }
    mapping = {}
    for col in columns:
        col_clean = re.sub(r"[^a-zA-Z0-9]", "", col.lower())
        for sys_field, aliases in system_fields.items():
            if any(alias in col_clean for alias in aliases) or col_clean == sys_field:
                mapping[col] = sys_field
                break
    return {
        "mappings": mapping,
        "confidence": 0.9 if mapping else 0.0,
        "count": len(mapping),
    }


@router.get("/ingestion/sample-data")
async def get_sample_data():
    """
    Priority 1: Step-by-Step Onboarding with Sample Data.
    Provides a standardized sample CSV for investigative testing.
    """
    sample_csv = [
        "date,description,amount,sender,receiver,category,city,coordinates",
        '2026-01-10,Site Foundation Materials,120000000,Project Fund,PT Semen Indonesia,P,Jakarta,"-6.2088, 106.8456"',
        '2026-01-12,CASH WITHDRAWAL,10000000,Project Manager,Personal Wallet,XP,Jakarta,"6.2088 S, 106.8456 E"',
        '2026-01-14,Round Number Transfer,50000000,Project Fund,Suspect Entity A,V,Singapore,"Lat: -6.2, Long: 106.8"',
        '2026-01-15,Consulting Fees,25000000,Project Fund,Consultant X,F,Jakarta,"106.8456 E, 6.2088 S"',
        '2026-01-18,Steel Rebar D-16,85000000,Project Fund,PT Baja Steel,P,Surabaya,"-7.2575, 112.7521"',
    ]
    return {
        "filename": "zenith_forensic_sample.csv",
        "data": "\n".join(sample_csv),
        "instructions": "Download this CSV and upload it to the Ingestion Lab to see forensic patterns in action.",
    }
