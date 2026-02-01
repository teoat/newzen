import sys
import os
import hashlib
from sqlmodel import Session, select
from app.models import AuditLog
from app.core.db import engine

# Add current path
sys.path.append(os.getcwd())

def verify_chain(entity_id: str = None):
    """
    Forensic Diagnostic: Verifies the integrity of the cryptographic audit chain.
    If entity_id is provided, verifies only that entity's chain.
    """
    print(f"🔍 ZENITH FORENSIC: Verifying Audit Chain {'for ' + entity_id if entity_id else 'GLOBAL'}...")
    
    with Session(engine) as session:
        statement = select(AuditLog)
        if entity_id:
            statement = statement.where(AuditLog.entity_id == entity_id)
        statement = statement.order_by(AuditLog.timestamp)
        
        logs = session.exec(statement).all()
        
        if not logs:
            print("⚪ No audit logs found.")
            return True
            
        corrupted = []
        # Group by entity for validation if global
        chains = {}
        for log in logs:
            if log.entity_id not in chains:
                chains[log.entity_id] = []
            chains[log.entity_id].append(log)
            
        for eid, entries in chains.items():
            prev_sig = "GENESIS"
            for i, entry in enumerate(entries):
                # 1. Check previous_hash link
                if entry.previous_hash != prev_sig:
                    print(f"❌ CHAIN BREAK at index {i} for entity {eid}: Expected {prev_sig}, got {entry.previous_hash}")
                    corrupted.append(entry.id)
                
                # 2. Re-calculate signature
                payload = f"{entry.entity_type}:{entry.entity_id}:{entry.action}:{entry.field_name}:{entry.old_value}:{entry.new_value}:{entry.changed_by_user_id}:{entry.previous_hash}"
                expected_sig = hashlib.sha256(payload.encode()).hexdigest()
                
                if entry.hash_signature != expected_sig:
                    # Note: Existing logs might not have signatures yet
                    if entry.hash_signature is not None:
                        print(f"❌ SIGNATURE MISMATCH at index {i} for entity {eid}")
                        corrupted.append(entry.id)
                
                prev_sig = entry.hash_signature
        
        if not corrupted:
            print(f"✅ AUDIT INTEGRITY VERIFIED: {len(logs)} entries checked.")
            return True
        else:
            print(f"⚠️  INTEGRITY FAILURE: {len(corrupted)} suspicious entries detected.")
            return False

if __name__ == "__main__":
    verify_chain()
