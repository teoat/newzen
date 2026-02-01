
from sqlmodel import Session, create_engine
from app.models import Transaction
from app.core.config import settings
from datetime import datetime, timedelta

def seed_variance():
    engine = create_engine(settings.DATABASE_URL)
    with Session(engine) as session:
        project_id = "ZENITH-DEMO-001"
        
        # 1. Create a transaction for "Keselamatan dan Kesehatan Kerja"
        # RAB: Price 27,824,300, Qty 1.0
        # Scenario: Actual Price 85,000,000 (300% markup)
        
        tx = Transaction(
            project_id=project_id,
            amount=85000000.0,
            proposed_amount=85000000.0,
            actual_amount=85000000.0,
            description="Payment for Keselamatan dan Kesehatan Kerja - Q3",
            sender="Project Account",
            receiver="PT. Mega Konstruksi",
            category_code="P",
            risk_score=0.98,
            timestamp=datetime.now() - timedelta(days=5),
            status="completed",
            quantity=1.0
        )
        session.add(tx)
        
        # 2. Another one for "Pengujian Biological Oxygen Demand (BOD)"
        # RAB: Price 500,000, Qty 18.0
        # Scenario: Actual Qty 50.0 (Volume overrun)
        
        tx2 = Transaction(
            project_id=project_id,
            amount=25000000.0, # 50 * 500,000
            proposed_amount=25000000.0,
            actual_amount=25000000.0,
            description="Invoice for Pengujian Biological Oxygen Demand (BOD) - Site B",
            sender="Project Account",
            receiver="PT. Global Supplies",
            category_code="V",
            risk_score=0.88,
            timestamp=datetime.now() - timedelta(days=12),
            status="completed",
            quantity=50.0
        )
        session.add(tx2)
        
        session.commit()
        print("Seeded high-variance transactions linked to RAB lines.")

if __name__ == "__main__":
    seed_variance()
