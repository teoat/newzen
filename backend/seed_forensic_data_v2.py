import sys
import os

# Add current dir to path
sys.path.append(os.getcwd())
print("Python version:", sys.version)
print("CWD:", os.getcwd())
try:
    from sqlmodel import Session, SQLModel
    from app.models import Transaction, TransactionCategory
    from app.core.db import engine

    print("Imports successful")
    # Ensure tables exist
    SQLModel.metadata.create_all(engine)
    print("Tables created/verified")
    with Session(engine) as session:
        # Clear existing
        print("Adding transactions...")
        tx1 = Transaction(
            proposed_amount=7550000,
            actual_amount=5250000,
            description="Bapa Banda - Tree/Pikul Cost",
            category_code=TransactionCategory.P,
            audit_comment="penggelembungan detected, actual should be 5.25M",
            status="pending",
            sender="Field",
            receiver="Bapa Banda",
        )
        session.add(tx1)
        session.commit()
        print("Success: tx1 added")
except Exception:
    import traceback

    traceback.print_exc()
