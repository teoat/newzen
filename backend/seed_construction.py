import logging
import uuid
from datetime import datetime, timedelta
from sqlmodel import Session, select
from dotenv import load_dotenv
from app.core.db import engine, init_db
from app.models import Project, Milestone, BudgetLine, Transaction, TransactionCategory

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_project_data():
    """
    Seeds the database with a Construction Project Audit scenario.
    Scenario: 'Project Alpha - High Rise Office'
    Problem: Contractor claimed 40% progress (Termin 2) but site inspection shows only 25%.
             Material prices for 'Concrete' are marked up 150% vs RAB.
    """
    with Session(engine) as session:
        # Check if project exists
        existing = session.exec(select(Project).where(Project.code == "CTR-2024-001")).first()
        if existing:
            logger.info("Project Audit data already exists. Skipping.")
            return
        # 1. Create Project
        project = Project(
            id=str(uuid.uuid4()),
            name="Project Alpha - High Rise Office",
            code="CTR-2024-001",
            contract_value=50_000_000_000.0,  # 50 Billion IDR
            start_date=datetime.utcnow() - timedelta(days=120),
            contractor_name="PT. Mega Konstruksi Utama",
            status="audit_mode",
        )
        session.add(project)
        # 2. Create Milestones (Termin)
        m1 = Milestone(
            project_id=project.id,
            name="Uang Muka (20%)",
            percentage=20.0,
            expected_amount=10_000_000_000.0,
            released_amount=10_000_000_000.0,
            status="paid",
            release_date=project.start_date + timedelta(days=10),
            is_premature=False,
        )
        m2 = Milestone(
            project_id=project.id,
            name="Termin 1 (Progress 20%)",  # Structural Foundation
            percentage=20.0,
            expected_amount=10_000_000_000.0,
            released_amount=10_000_000_000.0,
            status="paid",
            release_date=project.start_date + timedelta(days=60),
            is_premature=False,
        )
        m3 = Milestone(
            project_id=project.id,
            name="Termin 2 (Progress 40%)",  # Steel Framework
            percentage=20.0,
            expected_amount=10_000_000_000.0,
            released_amount=10_000_000_000.0,
            status="paid",
            release_date=project.start_date + timedelta(days=100),
            is_premature=True,  # AUDIT FINDING: Released but progress only 25%
        )
        session.add(m1)
        session.add(m2)
        session.add(m3)
        # 3. Create Budget Lines (RAB) vs Actuals
        # Item 1: Concrete (Massive Markup)
        b1 = BudgetLine(
            project_id=project.id,
            category="Material",
            item_name="Ready Mix Concrete K-350",
            unit="m3",
            unit_price_rab=850_000.0,
            qty_rab=5000.0,
            total_price_rab=4_250_000_000.0,  # 4.25 M
            # Actuals (Markup)
            avg_unit_price_actual=1_250_000.0,  # Inflated price
            qty_actual=2500.0,
            total_spend_actual=3_125_000_000.0,
            markup_percentage=((1_250_000 - 850_000) / 850_000) * 100,  # ~47%
            volume_discrepancy=0,
        )
        # Item 2: Steel Rebar (Ghost Quantity)
        b2 = BudgetLine(
            project_id=project.id,
            category="Material",
            item_name="Deformed Bar D16",
            unit="kg",
            unit_price_rab=12_000.0,
            qty_rab=100_000.0,
            total_price_rab=1_200_000_000.0,
            # Actuals (Volume Leakage)
            avg_unit_price_actual=12_500.0,  # Slight price bump
            qty_actual=120_000.0,  # PURCHASED 120k but site survey says only 80k needed
            total_spend_actual=1_500_000_000.0,
            markup_percentage=4.1,
            volume_discrepancy=20000.0,  # 20k kg missing/ghost
        )
        # Item 3: Labor (Clean)
        b3 = BudgetLine(
            project_id=project.id,
            category="Labor",
            item_name="Mandor Structural",
            unit="mandays",
            unit_price_rab=150_000.0,
            qty_rab=1000.0,
            total_price_rab=150_000_000.0,
            avg_unit_price_actual=150_000.0,
            qty_actual=800.0,
            total_spend_actual=120_000_000.0,
        )
        session.add(b1)
        session.add(b2)
        session.add(b3)
        logger.info("Seeding Transactions for S-Curve...")

        # Create transactions linked to these budget lines to simulate cash flow
        # This allows us to build the "Actual Cost" curve
        # Helper to spur random transactions
        def create_tx(amount, desc, date, category):
            return Transaction(
                amount=amount
                * -1,  # Spending is negative in ledger usually, but for project tracking we might treat cost as positive. Let's stick to ledger logic: Debit = Negative balance impact.
                # Actually, in generic ledger: Credit = Money In, Debit = Money Out.
                # Let's match the existing Transaction model.
                # proposed_amount/actual_amount are typically positive magnitudes in this system.
                proposed_amount=amount,
                actual_amount=amount,
                currency="IDR",
                sender="Project Alpha Account",
                receiver="PT. Mega Konstruksi",
                description=desc,
                category_code=category,
                timestamp=date,
                status="completed",
                verification_status="VERIFIED",
            )

        # Early spending
        t1 = create_tx(
            5_000_000_000,
            "Uang Muka Payment",
            project.start_date + timedelta(days=1),
            TransactionCategory.P,
        )
        # Concrete purchases over time
        t2 = create_tx(
            1_000_000_000,
            "Concrete Batch 1",
            project.start_date + timedelta(days=20),
            TransactionCategory.V,
        )
        t3 = create_tx(
            1_000_000_000,
            "Concrete Batch 2",
            project.start_date + timedelta(days=35),
            TransactionCategory.V,
        )
        t4 = create_tx(
            1_125_000_000,
            "Concrete Batch 3 (Inflated)",
            project.start_date + timedelta(days=50),
            TransactionCategory.V,
        )
        session.add(t1)
        session.add(t2)
        session.add(t3)
        session.add(t4)
        session.commit()
        logger.info("Project Audit Data Seeded Successfully.")


if __name__ == "__main__":
    init_db()
    seed_project_data()
