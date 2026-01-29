import hashlib
import time
from typing import Dict, Any
from sqlmodel import Session
from app.models import Document, Ingestion


class BlockchainNotaryService:
    @staticmethod
    def notarize_ingestion(db: Session, ingestion_id: str) -> Dict[str, Any]:
        """
        Simulates anchoring an Ingestion (Batch) hash to a blockchain.
        """
        ing = db.get(Ingestion, ingestion_id)
        if not ing:
            return {"status": "error", "message": "Ingestion record not found."}
        # 1. Generate a 'receipt' hash
        notary_payload = f"{ing.file_hash}_{time.time()}_ZENITH_SECRET_KEY"
        tx_hash = f"0x{hashlib.sha256(notary_payload.encode()).hexdigest()}"
        # 2. Update Ingestion Metadata
        metadata = ing.metadata_json or {}
        metadata["blockchain_notarized"] = True
        metadata["notary_tx_hash"] = tx_hash
        metadata["notary_timestamp"] = time.strftime("%Y-%m-%d %H:%M:%S")
        ing.metadata_json = metadata
        db.add(ing)
        # 3. Log the Forensic Anchor
        from app.core.audit import AuditLogger

        AuditLogger.log_change(
            session=db,
            entity_type="Ingestion",
            entity_id=ingestion_id,
            action="BLOCKCHAIN_NOTARY",
            new_value=tx_hash,
            reason=f"Batch {ing.file_name} anchored to immutable ledger.",
        )
        db.commit()
        db.refresh(ing)
        return {
            "status": "success",
            "ingestion_id": ingestion_id,
            "tx_hash": tx_hash,
            "anchor_point": "ZENITH_IMMUTABLE_V3",
            "verification_url": f"https://zenith-notary.io/tx/{tx_hash}",
        }

    @staticmethod
    def notarize_document(db: Session, document_id: str) -> Dict[str, Any]:
        """
        Simulates anchoring a document hash to a blockchain.
        """
        doc = db.get(Document, document_id)
        if not doc:
            return {"status": "error", "message": "Document not found."}
        # 1. Generate a 'receipt' hash (Simulated On-Chain Transaction)
        # This is a hash of (DocHash + Timestamp + ProjectSecret)
        notary_payload = f"{doc.file_hash}_{time.time()}_ZENITH_SECRET_KEY"
        tx_hash = f"0x{hashlib.sha256(notary_payload.encode()).hexdigest()}"
        # 2. Update Document Metadata
        metadata = doc.metadata_json or {}
        metadata["blockchain_notarized"] = True
        metadata["notary_tx_hash"] = tx_hash
        metadata["notary_timestamp"] = time.strftime("%Y-%m-%d %H:%M:%S")
        doc.metadata_json = metadata
        db.add(doc)
        # 3. Log the Forensic Anchor
        from app.core.audit import AuditLogger

        AuditLogger.log_change(
            session=db,
            entity_type="Document",
            entity_id=document_id,
            action="BLOCKCHAIN_NOTARY",
            new_value=tx_hash,
            reason="SHA256 Anchor established on simulated immutable ledger.",
        )
        db.commit()
        db.refresh(doc)
        return {
            "status": "success",
            "document_id": document_id,
            "tx_hash": tx_hash,
            "anchor_point": "ZENITH_IMMUTABLE_V3",
            "verification_url": f"https://zenith-notary.io/tx/{tx_hash}",
        }
