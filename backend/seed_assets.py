from sqlmodel import Session, select
from app.models import Asset, Entity, CorporateRelationship, Project, Transaction
from app.core.db import engine
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()


def seed_assets():
    with Session(engine) as session:
        print("Seeding Assets...")
        # 1. Find or Create the Project
        project = session.exec(select(Project).where(Project.code == "ZENITH-DEMO-001")).first()
        if not project:
            print("Project ZENITH-DEMO-001 not found. Creating it.")
            project = Project(
                name="Zenith Demo Project",
                code="ZENITH-DEMO-001",
                contract_value=75_000_000_000.0,
                start_date=datetime.utcnow() - timedelta(days=120),
                contractor_name="PT. Mega Konstruksi",
                site_location="Jakarta, Indonesia",
                latitude=-6.2088,
                longitude=106.8456,
                status="audit_mode",
            )
            session.add(project)
            session.commit()
            session.refresh(project)
        # 2. Find Suspect Entity (PT. Mega Konstruksi)
        mega = session.exec(select(Entity).where(Entity.name == "PT. Mega Konstruksi")).first()
        if not mega:
            # Create if missing (it should be there from transactions)
            mega = Entity(name="PT. Mega Konstruksi", type="company", risk_score=0.9)
            session.add(mega)
            session.commit()
            session.refresh(mega)
        # 3. Create UBO Structure (The Puppet Master)
        # Director X -> PT. Global -> PT. Mega
        director_x = Entity(name="Bpk. Hartono (Director X)", type="person", risk_score=0.95)
        pt_global = Entity(name="PT. Global Supplies", type="company", risk_score=0.8)
        session.add(director_x)
        session.add(pt_global)
        session.commit()
        session.refresh(director_x)
        session.refresh(pt_global)
        # Relationships
        rel1 = CorporateRelationship(
            parent_entity_id=director_x.id,
            child_entity_id=pt_global.id,
            relationship_type="SHAREHOLDER",
            stake_percentage=90.0,
        )
        rel2 = CorporateRelationship(
            parent_entity_id=pt_global.id,
            child_entity_id=mega.id,
            relationship_type="SHAREHOLDER",
            stake_percentage=65.0,
        )
        session.add(rel1)
        session.add(rel2)
        # 4. Create Assets
        assets = [
            Asset(
                name="Gudang Marunda Center",
                type="Real Estate",
                estimated_value=12_000_000_000,
                owner_entity_id=pt_global.id,  # Hidden in parent company
                location="Bekasi, West Java",
                purchase_date=datetime.now() - timedelta(days=45),
                is_frozen=False,
            ),
            Asset(
                name="Alphard 2024 Black",
                type="Vehicle",
                estimated_value=1_500_000_000,
                owner_entity_id=mega.id,
                location="Project Site Parking",
                purchase_date=datetime.now() - timedelta(days=10),
                is_frozen=False,
            ),
            Asset(
                name="Account BCA Prioritas",
                type="Bank Account",
                estimated_value=3_200_000_000,
                owner_entity_id=director_x.id,
                location="BCA KCU Sudirman",
                purchase_date=datetime.now() - timedelta(days=100),
                is_frozen=True,  # Already frozen
            ),
        ]
        for a in assets:
            session.add(a)
        # 5. Create Suspicious Transactions to Trigger Detection logic
        # Must have risk_score > 0.7 to be picked up by AssetRecoveryService
        print("Seeding Suspicious Transactions...")
        txs = [
            Transaction(
                project_id=project.id,
                amount=-2_500_000_000.0,
                proposed_amount=2_500_000_000.0,
                actual_amount=2_500_000_000.0,
                description="Termin 1 Payment (Diverted)",
                sender="Project Account",
                receiver="PT. Mega Konstruksi",
                category_code="V",
                risk_score=0.95,  # HIGH RISK TRIGGER
                timestamp=datetime.now() - timedelta(days=60),
                status="completed",
            ),
            Transaction(
                project_id=project.id,
                amount=-1_200_000_000.0,
                proposed_amount=1_200_000_000.0,
                actual_amount=1_200_000_000.0,
                description="Material Procurement - Concrete",
                sender="Project Account",
                receiver="PT. Mega Konstruksi",
                category_code="MAT",
                risk_score=0.85,  # HIGH RISK TRIGGER
                timestamp=datetime.now() - timedelta(days=40),
                status="completed",
            ),
        ]
        for t in txs:
            session.add(t)
        session.commit()
        print(f"Seeded {len(assets)} assets, UBO structure, and {len(txs)} risk transactions.")


if __name__ == "__main__":
    seed_assets()
