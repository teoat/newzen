import os
import uuid
import hashlib
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, Form
from sqlmodel import Session, select
from app.core.db import get_session
from app.core.rag import rag_service
from app.models import Document, Transaction
from app.core.audit import AuditLogger
from app.core.field_encryption import get_encryptor
from app.modules.evidence.notary_service import BlockchainNotaryService
from app.core.auth_middleware import verify_project_access
from app.core.event_bus import publish_event, EventType
from app.models import Project, UserProjectAccess, ProjectRole, User
from app.core.security import get_current_user

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
    
    # Read file content
    content = await file.read()
    
    # Calculate Hash (Forensic Immutability) BEFORE encryption
    file_hash = hashlib.sha256(content).hexdigest()
    
    # Encrypt file content
    encryptor = get_encryptor()
    encrypted_content = encryptor.encrypt_file(content)
    
    # Save encrypted content
    with open(save_path, "wb") as buffer:
        buffer.write(encrypted_content)
        
    # Process text for RAG (Requires decryption or processing original content)
    try:
        # We process the original content for RAG before it's encrypted on disk
        extracted_text = rag_service.process_file_content(content, file_type)
    except Exception:
        extracted_text = "Processing skipped or failed."
        
    # Store metadata and text in DB
    new_doc = Document(
        id=file_id,
        project_id=project_id,
        filename=file.filename,
        file_type=file_type,
        file_hash=file_hash,
        content_text=extracted_text,
        metadata_json={"filename": file.filename, "size": len(content), "encrypted": True},
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
    
    # Fire Event
    publish_event(
        EventType.EVIDENCE_ADDED,
        {
            "document_id": file_id,
            "filename": file.filename,
            "file_type": file_type,
            "case_id": case_id,
            "transaction_id": transaction_id
        },
        project_id=project_id,
        user_id="user:action" # In real app, get from Context
    )
    
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
    encryptor = get_encryptor()
    for file in files:
        try:
            file_id = str(uuid.uuid4())
            file_ext = os.path.splitext(file.filename)[1]
            save_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_ext}")
            
            content = await file.read()
            file_hash = hashlib.sha256(content).hexdigest()
            encrypted_content = encryptor.encrypt_file(content)
            
            with open(save_path, "wb") as buffer:
                buffer.write(encrypted_content)
                
            new_doc = Document(
                id=file_id,
                project_id=project_id,
                filename=file.filename,
                file_type="bulk_import",
                file_hash=file_hash,
                content_text="Pending OCR",
                metadata_json={"filename": file.filename, "size": len(content), "encrypted": True},
                case_id=case_id,
            )
            db.add(new_doc)
            
            # Fire Event per file
            publish_event(
                EventType.EVIDENCE_ADDED,
                {
                    "document_id": file_id,
                    "filename": file.filename,
                    "file_type": "bulk_import",
                    "case_id": case_id,
                },
                project_id=project_id
            )
            
            results.append({"filename": file.filename, "status": "success", "id": file_id})
        except Exception as e:
            results.append({"filename": file.filename, "status": "error", "detail": str(e)})
    db.commit()
    return {"status": "success", "processed": len(results), "results": results}


@router.get("/{project_id}/download/{document_id}")
async def download_document(
    project_id: str,
    document_id: str,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    Retrieves and decrypts an evidence document.
    """
    doc = db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # In a real system, we'd find the file path from id
    # Since we use UUID as filename, we can reconstruct it
    file_ext = os.path.splitext(doc.filename)[1]
    file_path = os.path.join(UPLOAD_DIR, f"{doc.id}{file_ext}")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File missing on disk")
        
    with open(file_path, "rb") as f:
        encrypted_data = f.read()
        
    encryptor = get_encryptor()
    decrypted_data = encryptor.decrypt_file(encrypted_data)
    
    
    # SECURITY: Sealed Document Check
    is_sealed = doc.metadata_json.get("sealed", False) or doc.file_type == "sealed_dossier"
    if is_sealed:
        # Check user role
        user_access = db.exec(
            select(UserProjectAccess)
            .where(UserProjectAccess.project_id == project_id)
            .where(UserProjectAccess.user_id == current_user.id)
        ).first()

        if not user_access:
             raise HTTPException(status_code=403, detail="Access denied to sealed evidence.")

        allowed_roles = [ProjectRole.ADJUDICATOR, ProjectRole.ADMIN]
        if user_access.role not in allowed_roles:
            raise HTTPException(
                status_code=403, 
                detail="Sealed evidence requires ADJUDICATOR or ADMIN role."
            )
        
    return Response(
        content=decrypted_data,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename={doc.filename}"}
    )


@router.get("/{project_id}/search")
async def search_evidence(
    project_id: str,
    query: str,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    Search for relevant evidence using RAG context.
    
    Security: Results are strictly scoped to the verified project to prevent
    cross-project data leakage in multi-tenant environments.
    """
    # SECURITY: Filter RAG context by project for multi-tenant isolation
    results = rag_service.query_context(query, project_id=project_id)
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
