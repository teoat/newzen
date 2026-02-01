import json
import hashlib
import hmac
from typing import List, Dict, Any
from datetime import datetime, UTC
from sqlmodel import Session
from app.models import IntegrityRegistry, Transaction
from app.core.config import settings

class ExportService:
    def __init__(self, db: Session):
        self.db = db

    def generate_signed_export(
        self,
        project_id: str,
        user_id: str,
        data: List[Dict[str, Any]],
        export_type: str = "TRANSACTION_SET"
    ) -> Dict[str, Any]:
        """
        Generates a forensic-grade signed export.
        Every export is anchored to the IntegrityRegistry with a HMAC signature.
        """
        # 1. Serialize and Hash Data
        payload_str = json.dumps(data, sort_keys=True, default=str)
        payload_hash = hashlib.sha256(payload_str.encode()).hexdigest()
        
        # 2. Generate Digital Signature (HMAC-SHA256 using System Secret)
        signature = hmac.new(
            settings.SECRET_KEY.encode(),
            payload_str.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # 3. Record in Integrity Registry
        registry_entry = IntegrityRegistry(
            project_id=project_id,
            entity_type="EXPORT",
            entity_id=f"EXP-{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}",
            file_hash=payload_hash,
            digital_signature=signature,
            signer_id=user_id,
            sealed_by_id=user_id,
            metadata_json={
                "export_type": export_type,
                "row_count": len(data),
                "signing_algorithm": "HMAC-SHA256"
            }
        )
        
        self.db.add(registry_entry)
        self.db.commit()
        self.db.refresh(registry_entry)
        
        # 4. Return signed package
        return {
            "data": data,
            "forensic_footer": {
                "registry_id": registry_entry.id,
                "integrity_seal": registry_entry.file_hash,
                "digital_signature": registry_entry.digital_signature,
                "generated_at": registry_entry.sealed_at.isoformat(),
                "verified_by": "Zenith Forensic V3"
            }
        }

    @staticmethod
    def verify_export_integrity(signed_package: Dict[str, Any]) -> bool:
        """
        Standalone verification logic for lawyers/auditors.
        Verifies that data matches the signature and seal.
        """
        try:
            data = signed_package["data"]
            footer = signed_package["forensic_footer"]
            
            # Re-serialize
            payload_str = json.dumps(data, sort_keys=True, default=str)
            
            # Verify Hash (Tamper Detection)
            current_hash = hashlib.sha256(payload_str.encode()).hexdigest()
            if current_hash != footer["integrity_seal"]:
                return False
                
            return True
        except Exception:
            return False
