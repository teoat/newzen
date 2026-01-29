from datetime import datetime, timedelta
from sqlmodel import Session, create_engine
from app.models import (
    User,
    Case,
    Transaction,
    BankTransaction,
    TransactionCategory,
    CaseStatus,
    CasePriority,
)
from app.core.db import DATABASE_URL, init_db
from app.core.auth_utils import get_password_hash
from app.modules.fraud.rules import fraud_engine

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


def seed():
    init_db()
    with Session(engine) as db:
        # 1. Create User
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                full_name="Forensic Admin",
                email="admin@zenith.ai",
                hashed_password=get_password_hash("zenith"),
                role="admin",
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
        # 2. Create Case (The Aldi Case)
        case_aldi = (
            db.query(Case)
            .filter(Case.title == "Project High-Rise (Aldi Fraud Investigation)")
            .first()
        )
        if not case_aldi:
            case_aldi = Case(
                title="Project High-Rise (Aldi Fraud Investigation)",
                description="Audit of construction project funds where multiple discrepancies were found in ledger entries versus real bank mutations.",
                status=CaseStatus.INVESTIGATING,
                priority=CasePriority.CRITICAL,
                assigned_to_id=admin.id,
            )
            db.add(case_aldi)
            db.commit()
            db.refresh(case_aldi)
        # 3. Create Internal Transactions (Journal Entries)
        # We'll create some "suspicious" ones based on the Aldi case
        now = datetime.utcnow()
        txs = [
            # Normal Project Expense
            Transaction(
                case_id=case_aldi.id,
                proposed_amount=50000000,
                actual_amount=50000000,
                amount=50000000,
                sender="Zenith Corp",
                receiver="Vendor Semen Jaya",
                description="Pembelian Semen 500 Sak",
                category_code=TransactionCategory.P,
                timestamp=now - timedelta(days=10),
            ),
            # Inflated Expense (Penggelembungan)
            Transaction(
                case_id=case_aldi.id,
                proposed_amount=150000000,
                actual_amount=120000000,
                amount=120000000,
                sender="Zenith Corp",
                receiver="Alat Berat Makmur",
                description="Sewa Excavator 1 Bulan",
                category_code=TransactionCategory.F,
                audit_comment="Proposed was 150m, but only found 120m in bank records.",
                delta_inflation=30000000,
                timestamp=now - timedelta(days=9),
            ),
            # Personal Leakage (XP)
            Transaction(
                case_id=case_aldi.id,
                amount=15000000,
                actual_amount=15000000,
                sender="Zenith Corp",
                receiver="Aldi Awal",
                description="Reimbursement Perjalanan Dinas (Pribadi)",
                category_code=TransactionCategory.XP,
                potential_misappropriation=True,
                status="flagged",
                timestamp=now - timedelta(days=8),
            ),
            # Family Funneling
            Transaction(
                case_id=case_aldi.id,
                amount=25000000,
                actual_amount=25000000,
                sender="Zenith Corp",
                receiver="Mama Clivord",
                description="Transfer Operasional (Unidentified)",
                category_code=TransactionCategory.V,
                audit_comment="NGARANG - Entry looks invented.",
                status="flagged",
                timestamp=now - timedelta(days=7),
            ),
            # Tipex Detection (Redacted)
            Transaction(
                case_id=case_aldi.id,
                amount=7500000,
                actual_amount=7500000,
                sender="Zenith Corp",
                receiver="Unknown",
                description="Redacted via Tipex (Beneficiary Hidden)",
                category_code=TransactionCategory.P,
                is_redacted=True,
                status="locked",
                needs_proof=True,
                timestamp=now - timedelta(days=6),
            ),
            # Round Number (Benford Risk)
            Transaction(
                case_id=case_aldi.id,
                amount=100000000,
                actual_amount=100000000,
                sender="Zenith Corp",
                receiver="Sandi",
                description="Pinjaman Karyawan",
                category_code=TransactionCategory.P,
                status="flagged",
                timestamp=now - timedelta(days=5),
            ),
        ]
        for tx in txs:
            # Re-evaluate with engine
            res = fraud_engine.evaluate_transaction(tx)
            tx.risk_score = res["risk_score"]
            tx.aml_stage = res["aml_stage"]
            db.add(tx)
        # 4. Create Bank Transactions (Mutations)
        bank_txs = [
            BankTransaction(
                amount=50000000,
                bank_name="BCA",
                description="TRANSFER SEMEN JAYA",
                timestamp=now - timedelta(days=10, hours=2),
            ),
            BankTransaction(
                amount=120000000,
                bank_name="BCA",
                description="TRANSFER ALAT BERAT",
                timestamp=now - timedelta(days=9, hours=4),
            ),
            BankTransaction(
                amount=15000000,
                bank_name="BCA",
                description="TRSF ALDI AWAL",
                timestamp=now - timedelta(days=8, hours=1),
            ),
            BankTransaction(
                amount=20000000,  # Discrepancy with 25m internal
                bank_name="BCA",
                description="TRANSFER BANK LAIN",
                timestamp=now - timedelta(days=7, hours=5),
            ),
        ]
        for btx in bank_txs:
            db.add(btx)
        db.commit()
        print("Successfully seeded Forensic Intelligence Suite data.")


if __name__ == "__main__":
    seed()
