"""
Shared Attribute Detector
Identifies entities sharing Tax IDs, bank accounts, or addresses.
Uncovers hidden relationships and potential UBO masking.
"""

from typing import List, Dict, Any
from sqlmodel import Session, select
from app.models import Entity
from app.core.event_bus import publish_event, EventType
import logging

logger = logging.getLogger(__name__)

class SharedAttributeDetector:
    """
    Scans for entities that share common identifiers.
    """
    
    @staticmethod
    def scan_project_for_links(db: Session, project_id: str) -> List[Dict[str, Any]]:
        """
        Performs a full scan of all entities in a project to find shared attributes.
        """
        entities = db.exec(select(Entity).where(Entity.project_id == project_id)).all()
        findings = []
        
        # 1. Detect Shared Tax IDs
        tax_id_map = {}
        for ent in entities:
            if ent.tax_id:
                if ent.tax_id not in tax_id_map:
                    tax_id_map[ent.tax_id] = []
                tax_id_map[ent.tax_id].append(ent)
        
        for tax_id, sharing_entities in tax_id_map.items():
            if len(sharing_entities) > 1:
                finding = {
                    "correlation_type": "SharedTaxID",
                    "attribute": "tax_id",
                    "value": tax_id,
                    "entities": [e.id for e in sharing_entities],
                    "entity_names": [e.name for e in sharing_entities],
                    "risk_boost": 0.4
                }
                findings.append(finding)
                publish_event(
                    EventType.CORRELATION_FOUND,
                    finding,
                    project_id=project_id
                )
        
        # 2. Detect Shared Bank Accounts
        bank_map = {}
        for ent in entities:
            if ent.bank_account_number:
                if ent.bank_account_number not in bank_map:
                    bank_map[ent.bank_account_number] = []
                bank_map[ent.bank_account_number].append(ent)
                
        for acc_num, sharing_entities in bank_map.items():
            if len(sharing_entities) > 1:
                finding = {
                    "correlation_type": "SharedBankAccount",
                    "attribute": "bank_account_number",
                    "value": acc_num,
                    "entities": [e.id for e in sharing_entities],
                    "entity_names": [e.name for e in sharing_entities],
                    "risk_boost": 0.6
                }
                findings.append(finding)
                publish_event(
                    EventType.CORRELATION_FOUND,
                    finding,
                    project_id=project_id
                )
                
        logger.info(f"Scan complete for project {project_id}. Found {len(findings)} shared attribute correlations.")
        return findings
