import sys
import os
from sqlmodel import SQLModel, Session
from app.core.db import engine
from app.models import Transaction, User, TransactionCategory

sys.path.append(os.getcwd())


def run():
    print("--- DROPPING TABLES ---")
    try:
        SQLModel.metadata.drop_all(engine)
    except Exception as e:
        print(f"Warning on drop: {e}")
    print("--- CREATING TABLES ---")
    SQLModel.metadata.create_all(engine)
    print("--- SEEDING DATA ---")
    with Session(engine) as session:
        # Create Users
        admin = User(
            username="admin",
            full_name="Admin Investigator",
            email="admin@zenith.ai",
            hashed_password="fakehashed",
            role="admin",
        )
        # Transactions with Geo Data
        tx1 = Transaction(
            proposed_amount=7550000,
            actual_amount=5250000,
            description="Bapa Banda - Tree/Pikul Cost",
            category_code=TransactionCategory.P,
            audit_comment="penggelembungan detected, actual should be 5.25M",
            status="flagged",
            verification_status="UNVERIFIED",
            sender="Field",
            receiver="Bapa Banda",
            latitude=-3.71,
            longitude=128.18,  # Ambon area
        )
        tx2 = Transaction(
            proposed_amount=1200000,
            actual_amount=1200000,
            description="Operational Gas",
            category_code=TransactionCategory.F,
            audit_comment="BUTUH BUKTI - No receipt found",
            status="locked",
            verification_status="UNVERIFIED",
            sender="Field",
            receiver="Vendor Gas",
            latitude=-3.69,
            longitude=128.17,
        )
        tx3 = Transaction(
            proposed_amount=45000000,
            actual_amount=45000000,
            description="Escavator Repair",
            category_code=TransactionCategory.P,
            status="pending",
            verification_status="UNVERIFIED",
            sender="Aldi",
            receiver="Workshop",
            latitude=-3.70,
            longitude=128.20,
        )
        session.add_all([admin, tx1, tx2, tx3])
        session.commit()
    print("--- DB V3 FINALIZED ---")


if __name__ == "__main__":
    run()
