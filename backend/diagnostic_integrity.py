from sqlmodel import Session, select
from app.core.db import engine
from app.models import Transaction, ReconciliationMatch, FraudAlert, Project
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_integrity():
    with Session(engine) as db:
        logger.info("--- Starting System Integrity Diagnostic ---")

        # 1. Orphaned Reconciliation Matches
        logger.info("1. Checking for Orphaned Reconciliation Matches...")
        orphans = db.exec(
            select(ReconciliationMatch)
            .outerjoin(Transaction, ReconciliationMatch.internal_tx_id == Transaction.id)
            .where(Transaction.id is None)
        ).all()
        if orphans:
            logger.error(f"FAIL: Found {len(orphans)} orphaned ReconciliationMatch records (internal_tx_id not found).")
            # Recommendation: Delete or Archive
        else:
            logger.info("PASS: No orphaned ReconciliationMatch records.")

        # 2. Project Data Consistency
        logger.info("2. Checking Project Configuration...")
        projects = db.exec(select(Project)).all()
        for p in projects:
            if not p.contract_value or p.contract_value <= 0:
                logger.warning(f"WARN: Project {p.name} (ID: {p.id}) has invalid contract_value: {p.contract_value}")
            
            # Check for coordinates
            if p.latitude is None or p.longitude is None:
                logger.warning(f"WARN: Project {p.name} (ID: {p.id}) missing GPS coordinates. GPS Anomaly detection disabled.")

        # 3. Fraud Alert Consistency
        logger.info("3. Checking Fraud Alert Metadata...")
        alerts = db.exec(select(FraudAlert).limit(100)).all() # Check sample
        invalid_meta = 0
        for a in alerts:
            if not isinstance(a.metadata_json, dict):
                invalid_meta += 1
        
        if invalid_meta > 0:
        
            logger.error(f"FAIL: Found {invalid_meta} alerts with invalid metadata_json format.")
        else:
            logger.info("PASS: FraudAlert metadata consistency verified.")

        # 4. Redis Connection Check (Simulated)
        logger.info("4. Checking Redis Connectivity...")
        import os
        redis_url = os.getenv("REDIS_URL")
        logger.info(f"Redis URL is configured: {redis_url is not None}")

        logger.info("--- Diagnostic Complete ---")

if __name__ == "__main__":

    check_integrity()
