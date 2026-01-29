import os
import shutil
import uuid
import hashlib
from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlmodel import Session
from app.core.db import get_session
from app.core.rag import rag_service
from app.models import Document, Transaction
from app.core.audit import AuditLogger
from app.modules.evidence.notary_service import BlockchainNotaryService
from app.core.auth_middleware import verify_project_access
from app.models import Project

router = APIRouter(prefix="/evidence", tags=["Evidence & RAG"])
UPLOAD_DIR = "storage/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def calculate_sha256(file_path):
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


@router.post("/{project_id}/upload")
async def upload_document(
    project_id: str,
    file: UploadFile = File(...),
    file_type: str = Form(...),
    case_id: Optional[str] = Form(None),
    transaction_id: Optional[str] = Form(None),
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    file_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1]
    save_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_ext}")
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    # Calculate Hash (Forensic Immutability)
    file_hash = calculate_sha256(save_path)
    # Process text for RAG (Mock for now if rag_service fails)
    try:
        extracted_text = rag_service.process_file(save_path, file_type)
    except Exception:
        extracted_text = "Processing skipped or failed."
    # Store metadata and text in DB
    new_doc = Document(
        id=file_id,
        filename=file.filename,
        file_type=file_type,
        file_hash=file_hash,
        content_text=extracted_text,
        metadata_json={"path": save_path, "size": os.path.getsize(save_path)},
        case_id=case_id,
        transaction_id=transaction_id,
    )
    db.add(new_doc)
    # Forensic Logic: Link Evidence to Transaction & Unlock if needed
    if transaction_id:
        tx = db.get(Transaction, transaction_id)
        if tx:
            if tx.status == "locked":
                old_status = tx.status
                tx.status = "review_pending"
                tx.needs_proof = False  # Proof provided
                db.add(tx)
                AuditLogger.log_change(
                    session=db,
                    entity_type="Transaction",
                    entity_id=tx.id,
                    action="EVIDENCE_UPLOAD",
                    field_name="status",
                    old_value=old_status,
                    new_value="review_pending",
                    reason=f"Evidence unlocked by file hash: {file_hash[:8]}...",
                )
            else:
                AuditLogger.log_change(
                    session=db,
                    entity_type="Transaction",
                    entity_id=tx.id,
                    action="EVIDENCE_ATTACH",
                    new_value=file_id,
                    reason=f"Supporting doc attached: {file.filename}",
                )
    db.commit()
    db.refresh(new_doc)
    return {
        "status": "success",
        "document_id": file_id,
        "file_hash": file_hash,
        "extracted_text": extracted_text[:200] + "..." if extracted_text else "",
    }


@router.post("/{project_id}/batch/upload")
async def upload_bulk_documents(
    project_id: str,
    files: List[UploadFile],
    case_id: Optional[str] = None,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """Bulk upload multiple evidence documents at once."""
    results = []
    for file in files:
        try:
            # Re-use logic from upload_document but we can't await a view function easily with different signatures
            # So we'll implement a simplified logic or refactor.
            # For now, let's just copy the saving logic to keep it simple and robust.
            file_id = str(uuid.uuid4())
            file_ext = os.path.splitext(file.filename)[1]
            save_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_ext}")
            with open(save_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            file_hash = calculate_sha256(save_path)
            new_doc = Document(
                id=file_id,
                filename=file.filename,
                file_type="bulk_import",
                file_hash=file_hash,
                content_text="Pending OCR",
                metadata_json={"path": save_path, "size": os.path.getsize(save_path)},
                case_id=case_id,
            )
            db.add(new_doc)
            results.append({"filename": file.filename, "status": "success", "id": file_id})
        except Exception as e:
            results.append({"filename": file.filename, "status": "error", "detail": str(e)})
    return {"status": "success", "processed": len(results), "results": results}


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


@router.post("/{project_id}/notarize/batch/{ingestion_id}")
async def notarize_ingestion(
    project_id: str,
    ingestion_id: str,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    Anchors an entire ingestion batch to the blockchain.
    Zenith V3 Immutable Proof Protocol.
    """
    result = BlockchainNotaryService.notarize_ingestion(db, ingestion_id)
    if result.get("status") == "error":
        raise HTTPException(status_code=404, detail=result["message"])
    return result
