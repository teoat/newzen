import datetime
from dotenv import load_dotenv
from sqlmodel import SQLModel, Session
from app.core.db import engine
from app.models import Transaction, BankTransaction, TransactionCategory

load_dotenv()


def run():
    print("--- DROPPING TABLES ---")
    print(f"Tables in metadata: {list(SQLModel.metadata.tables.keys())}")
    SQLModel.metadata.drop_all(engine)
    print("--- CREATING TABLES ---")
    SQLModel.metadata.create_all(engine)
    print("--- SEEDING DATA ---")
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
            timestamp=datetime.datetime.utcnow(),
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
        session.add_all([tx1, tx2, tx3, tx4, tx5, bank_tx])
        session.commit()
    print("--- DONE ---")


if __name__ == "__main__":
    run()
