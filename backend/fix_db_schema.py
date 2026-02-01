import logging
from sqlalchemy import text
from app.core.db import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_schema():
    with engine.connect() as conn:
        conn = conn.execution_options(isolation_level="AUTOCOMMIT")
        try:
            # Check status column
            logger.info("Checking for 'status' column in 'fraudalert'...")
            try:
                conn.execute(text("SELECT status FROM fraudalert LIMIT 1"))
                logger.info("'status' column exists.")
            except Exception:
                logger.info("Adding 'status' column...")
                conn.execute(text("ALTER TABLE fraudalert ADD COLUMN status VARCHAR DEFAULT 'OPEN'"))
                logger.info("Added 'status' column.")

            # Check metadata_json column
            logger.info("Checking for 'metadata_json' column in 'fraudalert'...")
            try:
                conn.execute(text("SELECT metadata_json FROM fraudalert LIMIT 1"))
                logger.info("'metadata_json' column exists.")
            except Exception:
                logger.info("Adding 'metadata_json' column...")
                conn.execute(text("ALTER TABLE fraudalert ADD COLUMN metadata_json JSONB DEFAULT '{}'"))
                logger.info("Added 'metadata_json' column.")
                
            logger.info("Schema fix complete.")
            
        except Exception as e:
            logger.error(f"Schema fix failed: {e}")

if __name__ == "__main__":
    fix_schema()
