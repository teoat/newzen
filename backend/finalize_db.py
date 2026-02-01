import sys
import os

# Add current path
sys.path.append(os.getcwd())
try:
    from sqlmodel import SQLModel, Session
    from app.core.db import engine
    from app.models import (
        Transaction,
        TransactionSource,
        TransactionCategory,
    )
    from datetime import datetime, UTC

    def run():
        print("--- DROPPING TABLES ---")
        try:
            SQLModel.metadata.drop_all(engine)
        except Exception as e:
            print(f"Warning on drop: {e}")
        print("--- CREATING TABLES (Including new Document fields) ---")
        SQLModel.metadata.create_all(engine)
        print("--- SEEDING FORENSIC DATA ---")
        with Session(engine) as session:
            # 1. 'Penggelembungan' Case: Bapa Banda
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
            # 2. 'BUTUH BUKTI' Case (LOCKED)
            tx2 = Transaction(
                proposed_amount=1200000,
                actual_amount=1200000,
                description="Operational Gas",
                category_code=TransactionCategory.F,
                audit_comment="BUTUH BUKTI - No receipt found",
                status="pending",  # Engine will lock this later
                sender="Field",
                receiver="Vendor Gas",
            )
            # 3. 'Personal XP' Case
            tx3 = Transaction(
                proposed_amount=450000,
                actual_amount=450000,
                description="Makan Keluarga",
                category_code=TransactionCategory.XP,
                audit_comment="Self-dealing / Personal expense",
                status="pending",
                sender="Personal",
                receiver="Restaurant",
            )
            # 4. Bank Entry
            bank_tx = Transaction(
                amount=5000000,
                actual_amount=5000000,
                proposed_amount=0,
                bank_name="BCA 921",
                description="WITHDRAWAL - FIELD OPS",
                transaction_date=datetime.now(UTC),
                timestamp=datetime.now(UTC),
                source_type=TransactionSource.BANK_STATEMENT,
                sender="BANK_UNKNOWN",
                receiver="BANK_UNKNOWN",
                status="COMPLETED"
            )
            session.add_all([tx1, tx2, tx3, bank_tx])
            session.commit()
        print("--- DB FINALIZED ---")

except Exception as e:
    print(f"CRITICAL FAIL: {e}")
    import traceback

    traceback.print_exc()
if __name__ == "__main__":
    run()
