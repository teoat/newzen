
import logging
from sqlmodel import Session, text
from app.core.db import engine

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_v3_schema():
    logger.info("🔧 Starting V3 Schema Patch...")
    
    with Session(engine) as db:
        # 1. Check Transaction Table
        logger.info("1. Checking 'transaction' table for V3 columns...")
        
        # Check embeddings_json
        try:
            db.exec(text("SELECT embeddings_json FROM transaction LIMIT 1"))
            logger.info("   - 'embeddings_json' exists.")
        except Exception:
            logger.warning("   - 'embeddings_json' MISSING. Adding...")
            db.rollback()
            db.exec(text("ALTER TABLE transaction ADD COLUMN embeddings_json JSON"))
            db.commit()
            
        # Check metadata_json
        try:
            db.exec(text("SELECT metadata_json FROM transaction LIMIT 1"))
            logger.info("   - 'metadata_json' exists.")
        except Exception:
            logger.warning("   - 'metadata_json' MISSING. Adding...")
            db.rollback()
            db.exec(text("ALTER TABLE transaction ADD COLUMN metadata_json JSON DEFAULT '{}'::json"))
            db.commit()

        # 2. Create QuarantineRow Table
        logger.info("2. Checking 'quarantine_rows' table...")
        try:
            db.exec(text("SELECT count(*) FROM quarantine_rows"))
            logger.info("   - 'quarantine_rows' table exists.")
        except Exception:
            logger.warning("   - 'quarantine_rows' MISSING. Creating...")
            db.rollback()
            # Manually create table to bypass broken Alembic
            sql = """
            CREATE TABLE quarantine_rows (
                id VARCHAR NOT NULL, 
                project_id VARCHAR NOT NULL, 
                ingestion_id VARCHAR, 
                raw_content VARCHAR NOT NULL, 
                row_index INTEGER NOT NULL, 
                error_message VARCHAR NOT NULL, 
                error_type VARCHAR NOT NULL, 
                status VARCHAR NOT NULL, 
                suggested_fix JSON, 
                created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
                resolved_at TIMESTAMP WITHOUT TIME ZONE, 
                PRIMARY KEY (id)
            );
            CREATE INDEX ix_quarantine_rows_project_id ON quarantine_rows (project_id);
            """
            db.exec(text(sql))
            db.commit()
            logger.info("   - 'quarantine_rows' created.")

    logger.info("✅ V3 Schema Patch Complete.")

if __name__ == "__main__":
    fix_v3_schema()
