"""
System Maintenance Tasks
Handles database optimization and cache pruning.
"""

from datetime import datetime, UTC, timedelta
from sqlmodel import text, Session, select
from app.core.db import engine
from app.core.redis_client import redis_client
from app.models import AuditLog, AuditLogArchive
import logging

logger = logging.getLogger(__name__)

class NurseService:
    """
    Zenith V3 Health Guardian.
    Monitors background worker health and Redis stream lag.
    """
    @staticmethod
    def check_worker_lag():
        if not redis_client:
            return
        
        try:
            # Query stream groups
            stream_key = "zenith:v3:events"
            groups = redis_client.xinfo_groups(stream_key)
            for g in groups:
                lag = g.get("lag", 0)
                if lag > 100:
                    logger.warning(f"⚠️ [NURSE] Critical Lag Detected! Group {g['name']} is {lag} records behind.")
                else:
                    logger.info(f"✅ [NURSE] Worker Health: Lag is {lag}")
        except Exception as e:
            logger.error(f"[NURSE] Failed to check lag: {e}")

class AuditRetentionPolicy:
    """
    Forensic Data Lifecycle Management.
    Moves old audit records to cold storage.
    """
    @staticmethod
    def archive_old_logs(days: int = 90):
        cutoff = datetime.now(UTC) - timedelta(days=days)
        
        with Session(engine) as db:
            # 1. Identify old logs
            stmt = select(AuditLog).where(AuditLog.timestamp < cutoff)
            old_logs = db.exec(stmt).all()
            
            if not old_logs:
                logger.info(f"Retention: No logs older than {days} days found.")
                return

            logger.info(f"Retention: Archiving {len(old_logs)} records...")
            
            for log in old_logs:
                # 2. Copy to archive
                archive = AuditLogArchive(
                    **log.model_dump(),
                    archived_at=datetime.now(UTC)
                )
                db.add(archive)
                # 3. Delete from primary
                db.delete(log)
            
            db.commit()
            logger.info("Retention: Archiving complete.")

def perform_system_maintenance():
    """
    Main entry point for scheduled maintenance.
    """
    logger.info("Starting system maintenance...")
    
    # 1. Health Monitoring
    NurseService.check_worker_lag()
    
    # 2. Forensic Retention
    AuditRetentionPolicy.archive_old_logs()
    
    # 3. Database Vacuum (Postgres only)
    if engine.name == "postgresql":
        try:
            with engine.connect() as conn:
                # VACUUM cannot run inside a transaction block
                conn.execution_options(isolation_level="AUTOCOMMIT").execute(text("VACUUM ANALYZE"))
                logger.info("PostgreSQL VACUUM ANALYZE complete.")
        except Exception as e:
            logger.error(f"Database vacuum failed: {e}")
    else:
        logger.info(f"Skipping vacuum for {engine.name} engine.")

    # 2. Redis Cache Pruning
    if redis_client:
        try:
            # Simple pruning: remove keys matching a pattern or just clear DB if needed
            # For this MVP, we'll just log stats. 
            # Production: identify keys with low idle time or memory-heavy sets.
            info = redis_client.info("memory")
            logger.info(f"Redis memory usage: {info.get('used_memory_human')}")
            
            # Prune specific forensic temporary caches if they exist
            # redis_client.delete("temp_batch_*") 
        except Exception as e:
            logger.error(f"Cache pruning failed: {e}")

    logger.info("System maintenance complete.")

if __name__ == "__main__":
    perform_system_maintenance()
