import logging
from sqlalchemy import text
from app.core.db import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_project_schema():
    with engine.connect() as conn:
        conn = conn.execution_options(isolation_level="AUTOCOMMIT")
        try:
            logger.info("Checking for 'contract_exchange_rate' column in 'project'...")
            try:
                # Try simple select
                conn.execute(text("SELECT contract_exchange_rate FROM project LIMIT 1"))
                logger.info("'contract_exchange_rate' column exists.")
            except Exception as e:
                logger.info(f"Column missing ({e}). Adding 'contract_exchange_rate' column...")
                try:
                     # Add JSON column default to empty dict
                    conn.execute(text("ALTER TABLE project ADD COLUMN contract_exchange_rate JSONB DEFAULT '{}'"))
                    logger.info("Added 'contract_exchange_rate' column.")
                except Exception as e2:
                     logger.error(f"Failed to add column: {e2}")
            
            logger.info("Project Schema patch complete.")
            
        except Exception as e:
            logger.error(f"Schema fix failed: {e}")

if __name__ == "__main__":
    fix_project_schema()
