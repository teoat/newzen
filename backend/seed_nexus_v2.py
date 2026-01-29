import sys
import os
from datetime import datetime, timedelta
from sqlmodel import Session, select, SQLModel
from app.models import (
    Entity,
    EntityType,
    Transaction,
    Project,
    CorporateRelationship,
    Asset,
    TransactionCategory,
    TransactionStatus,
)
from app.core.db import engine

# Add current dir to path
sys.path.append(os.getcwd())


def seed_nexus():
    print("Initiating Nexus & UBO Seeding...")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        # 0. Clean up existing test data to avoid duplication/schema mismatch
        test_names = [
            "Director X",
            "Ema (Relative)",
            "PT Mega Construction",
            "PT Global Supplies",
            "PT Nusantara Logistik",
            "Budi Santoso",
        ]
        for name in test_names:
            existing = session.exec(select(Entity).where(Entity.name == name)).all()
            for e in existing:
                session.delete(e)
        session.commit()
        # 1. Create Project
        project = session.exec(select(Project).where(Project.id == "PRJ-2024-NEXUS")).first()
        if not project:
            project = Project(
                id="PRJ-2024-NEXUS",
                name="Project Horizon - Stadium Complex",
                code="CTR-2024-HORIZON",
                contract_value=250_000_000_000,
                start_date=datetime.now() - timedelta(days=60),
                contractor_name="PT Mega Construction",
                status="active",
            )
            session.add(project)
        # 2. Create Entities
        # The Investigator
        # investigator = Entity(name="Budi Santoso", type=EntityType.PERSON)
        # The Suspect (Director)
        director = Entity(name="Director X", type=EntityType.PERSON)
        director_wife = Entity(name="Ema (Relative)", type=EntityType.PERSON)
        # Shell Companies
        shell_a = Entity(name="PT Mega Construction", type=EntityType.COMPANY)
        shell_b = Entity(name="PT Global Supplies", type=EntityType.COMPANY)  # Shell
        shell_c = Entity(name="PT Nusantara Logistik", type=EntityType.COMPANY)  # Shell
        session.add_all([director, director_wife, shell_a, shell_b, shell_c])
        session.commit()
        # 3. Create Ownership Relationships
        # Director X owns 60% of shell_a
        rel1 = CorporateRelationship(
            parent_entity_id=director.id,
            child_entity_id=shell_a.id,
            stake_percentage=60.0,
            relationship_type="SHAREHOLDER",
        )
        # Director X owns 100% of shell_b
        rel2 = CorporateRelationship(
            parent_entity_id=director.id,
            child_entity_id=shell_b.id,
            stake_percentage=100.0,
            relationship_type="SHAREHOLDER",
        )
        # Director Wife (Ema) owns 100% of shell_c
        rel3 = CorporateRelationship(
            parent_entity_id=director_wife.id,
            child_entity_id=shell_c.id,
            stake_percentage=100.0,
            relationship_type="SHAREHOLDER",
        )
        # shell_b owns 50% of shell_a (Indirect ownership)
        rel4 = CorporateRelationship(
            parent_entity_id=shell_b.id,
            child_entity_id=shell_a.id,
            stake_percentage=40.0,
            relationship_type="SHAREHOLDER",
        )
        session.add_all([rel1, rel2, rel3, rel4])
        # 4. Create Assets
        asset1 = Asset(
            name="Apartment - Sudirman Tower",
            type="Real Estate",
            estimated_value=12_000_000_000,
            owner_entity_id=director.id,
            purchase_date=datetime.now() - timedelta(days=5),
        )
        asset2 = Asset(
            name="Mercedes G63 AMG",
            type="Vehicle",
            estimated_value=5_500_000_000,
            owner_entity_id=director_wife.id,
            purchase_date=datetime.now() - timedelta(days=2),
        )
        session.add_all([asset1, asset2])
        # 5. Create Transactions (Fraudulent Flows)
        t1 = Transaction(
            project_id=project.id,
            sender=shell_a.name,
            receiver=shell_b.name,
            actual_amount=4_500_000_000,
            description="Consultancy Fee - Design Phase",
            category_code=TransactionCategory.P,
            risk_score=0.92,
            status=TransactionStatus.FLAGGED,
            mens_rea_description="Circular flow detected: Contract money moving to Director's shell company.",
            timestamp=datetime.now() - timedelta(days=10),
        )
        t2 = Transaction(
            project_id=project.id,
            sender=shell_a.name,
            receiver=shell_b.name,
            actual_amount=2_200_000_000,
            description="Procurement Markup - Steel Rebar",
            category_code=TransactionCategory.P,
            risk_score=0.85,
            status=TransactionStatus.FLAGGED,
            timestamp=datetime.now() - timedelta(days=8),
        )
        t3 = Transaction(
            project_id=project.id,
            sender=shell_b.name,
            receiver=director.name,
            actual_amount=3_000_000_000,
            description="Personal Dividend",
            category_code=TransactionCategory.P,
            risk_score=0.98,
            status=TransactionStatus.FLAGGED,
            timestamp=datetime.now() - timedelta(days=6),
        )
        session.add_all([t1, t2, t3])
        session.commit()
        print("Nexus & UBO Seeding Complete.")


if __name__ == "__main__":
    seed_nexus()
