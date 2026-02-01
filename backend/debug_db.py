
import uuid
import traceback
from datetime import datetime, UTC
from sqlmodel import Session
from app.core.db import engine
from app.models import Transaction, Project

def debug_db_insert():
    print("🐞 DEBUGGING DB INSERT")
    
    tx_id = str(uuid.uuid4())
    project_id = str(uuid.uuid4())
    
    try:
        with Session(engine) as db:
            print("1. Creating Project...")
            proj = Project(
                id=project_id,
                name="Debug Project",
                code=f"DBG-{uuid.uuid4().hex[:4]}",
                contract_value=1000,
                start_date=datetime.now(UTC),
                contractor_name="Debug Inc"
            )
            db.add(proj)
            db.commit()
            print("   ✅ Project Created.")
            
            print("2. Creating Transaction...")
            tx = Transaction(
                id=tx_id,
                project_id=project_id,
                description="debug tx",
                actual_amount=100,
                receiver="Mr. Debug",
                sender="Debug Sender",
                transaction_date=datetime.now(UTC)
            )
            db.add(tx)
            db.commit()
            print("   ✅ Transaction Created.")
            
    except Exception:
        print("\n❌ CRITICAL FAILURE")
        traceback.print_exc()

if __name__ == "__main__":
    debug_db_insert()
