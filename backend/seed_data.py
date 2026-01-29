from sqlmodel import Session, delete
from app.models import (
    Case,
    Transaction,
    BankTransaction,
    FraudAlert,
    CaseStatus,
    CasePriority,
)
from app.core.db import engine
from datetime import datetime, timedelta


def seed():
    with Session(engine) as session:
        # Clear existing data using SQLModel delete
        session.exec(delete(FraudAlert))
        session.exec(delete(Transaction))
        session.exec(delete(BankTransaction))
        session.exec(delete(Case))
        session.commit()
        # 1. Forensic Case
        forensic_case = Case(
            title="Forensic Audit: Aldi (Operasi March 2020)",
            description="Analysis of potential misappropriation and circular flow concealment.",
            status=CaseStatus.INVESTIGATING,
            priority=CasePriority.CRITICAL,
            risk_score=0.95,
        )
        session.add(forensic_case)
        session.commit()
        session.refresh(forensic_case)
        base_time = datetime(2020, 3, 10, 10, 0, 0)
        txs = [
            Transaction(
                amount=250000000.0,
                sender="Aldi",
                receiver="Frantines Widharta",
                description="Transfer Modal",
                category="Operasi",
                timestamp=base_time,
                status="pending",
            ),
            Transaction(
                amount=250000000.0,
                sender="External Source",
                receiver="Aldi",
                description="Pinjam Tipex",
                category="Non-Project",
                timestamp=base_time + timedelta(hours=24),
                status="pending",
            ),
            Transaction(
                amount=1500000.0,
                sender="Aldi",
                receiver="Tokopedia",
                description="Operasi Makan & Lembur (Beer / Shopee)",
                category="Operasi",
                timestamp=base_time + timedelta(days=2),
                status="pending",
            ),
            Transaction(
                amount=50000000.0,
                sender="Aldi",
                receiver="Faldi C Arwan",
                description="Biaya Solar (Family)",
                category="Bahan",
                timestamp=base_time + timedelta(days=3),
                status="pending",
            ),
            Transaction(
                amount=1200000000.0,
                sender="Aldi",
                receiver="Vendor Alat Berat",
                description="Purchase Excavator PC200",
                category="Alat",
                timestamp=base_time + timedelta(days=4),
                status="pending",
            ),
        ]
        for t in txs:
            session.add(t)
        # 3. Bank Statement
        bank_txs = [
            BankTransaction(
                amount=250000000.0,
                bank_name="BCA",
                description="TRF FRANTINES WIDHARTA",
                timestamp=base_time,
            ),
            BankTransaction(
                amount=150000.0,
                bank_name="BCA",
                description="TOKOPEDIA PMT",
                timestamp=base_time + timedelta(days=2),
            ),
        ]
        for bt in bank_txs:
            session.add(bt)
        session.commit()
        print("Forensic seeding completed successfully!")


if __name__ == "__main__":
    seed()
