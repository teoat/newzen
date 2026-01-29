import sys
import os
from datetime import datetime
from sqlmodel import Session
from app.models import Transaction, BankTransaction, TransactionCategory
from app.core.db import engine

# Add current dir to path
sys.path.append(os.getcwd())


def seed():
    print("Seeding forensic data...")
    try:
        with Session(engine) as session:
            # Clear existing to avoid unique constraint if any (thought User is only one with unique)
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
            # 2. 'BUTUH BUKTI' Case
            tx2 = Transaction(
                proposed_amount=1200000,
                actual_amount=1200000,
                description="Operational Gas",
                category_code=TransactionCategory.F,
                audit_comment="BUTUH BUKTI - No receipt found",
                status="pending",
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
            # 4. Bank Entry for Aggregate Matching (Minimal Arus Uang)
            bank_tx = BankTransaction(
                amount=5000000,
                bank_name="BCA 921",
                description="WITHDRAWAL - FIELD OPS",
                timestamp=datetime.utcnow(),
            )
            # Adding some V/F vouchers that sum to 5M
            tx4 = Transaction(
                proposed_amount=3000000,
                actual_amount=3000000,
                description="Vendor Payment A",
                category_code=TransactionCategory.V,
                status="pending",
                sender="Field",
                receiver="Vendor A",
            )
            tx5 = Transaction(
                proposed_amount=2000000,
                actual_amount=2000000,
                description="Field Voucher B",
                category_code=TransactionCategory.F,
                status="pending",
                sender="Field",
                receiver="Field Staff",
            )
            session.add(tx1)
            session.add(tx2)
            session.add(tx3)
            session.add(tx4)
            session.add(tx5)
            session.add(bank_tx)
            session.commit()
            print("Forensic seed data injected successfully.")
    except Exception as e:
        print(f"FAILED TO SEED: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    seed()
