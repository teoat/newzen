import logging
from sqlalchemy import text
from app.core.db import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_fraudalert_schema():
    with engine.connect() as conn:
        conn = conn.execution_options(isolation_level="AUTOCOMMIT")
        try:
            # Check for project_id
            try:
                conn.execute(text("SELECT project_id FROM fraudalert LIMIT 1"))
                logger.info("'project_id' column exists.")
            except Exception:
                logger.info("Adding 'project_id' column...")
                conn.execute(text("ALTER TABLE fraudalert ADD COLUMN project_id VARCHAR NULL"))
                conn.execute(text("CREATE INDEX ix_fraudalert_project_id ON fraudalert (project_id)"))
                logger.info("Added 'project_id' column.")
                
             # Check for case_id
            try:
                conn.execute(text("SELECT case_id FROM fraudalert LIMIT 1"))
                logger.info("'case_id' column exists.")
            except Exception:
                logger.info("Adding 'case_id' column...")
                conn.execute(text("ALTER TABLE fraudalert ADD COLUMN case_id VARCHAR NULL"))
                logger.info("Added 'case_id' column.")
            
            logger.info("FraudAlert Schema patch complete.")
            
        except Exception as e:
            logger.error(f"Schema fix failed: {e}")

if __name__ == "__main__":
    fix_fraudalert_schema()
