import asyncio
from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.models import (
    Transaction,
    Project,
    Entity,
    FraudAlert,
    Asset,
    CorporateRelationship,
    TransactionCategory,
    EntityType,
)
from app.core.db import engine, init_db


async def simulate_e2e_forensic_path():
    print("🚀 Initiating Final E2E Simulation: Operation Zenith...")
    # Ensure tables exist
    init_db()
    with Session(engine) as db:
        # 1. Fetch or Create a target project
        project = db.exec(select(Project)).first()
        if not project:
            print("📝 Creating Demo Project...")
            project = Project(
                name="MRT Phase 4 Extension",
                code="PRJ-24-MRT-04",
                contract_value=1250000000000,  # 1.25T IDR
                status="ACTIVE",
                contractor_name="PT. Dharma Konstruksi",
                start_date=datetime.now() - timedelta(days=90),
                end_date=datetime.now() + timedelta(days=270),
            )
            db.add(project)
            db.commit()
            db.refresh(project)
        print(f"📂 Targeting Project: {project.name}")
        # 2. V1/V2: Inject a Suspicious Transaction (Circular Flow)
        print("🔍 [V1/V2] Detecting Suspicious Disbursement...")
        tx = Transaction(
            project_id=project.id,
            description="Structural Reinforcement Steel - Invoice #991",
            actual_amount=850000000,  # 850M IDR
            proposed_amount=1060000000,  # 1.06B IDR
            category_code=TransactionCategory.P,
            sender="PT. Dharma Konstruksi",
            receiver="PT. Baja Logistik (Shell)",
            risk_score=0.94,
            delta_inflation=210000000,
            timestamp=datetime.now(),
            status="flagged",
        )
        db.add(tx)
        db.commit()
        db.refresh(tx)
        # 3. V5: Create Alert record
        print("📡 [V5] Logging Alert to War Room DB...")
        alert = FraudAlert(
            transaction_id=tx.id,
            alert_type="CIRCULAR_FLOW",
            severity="CRITICAL",
            title="Siphoning Alert: Shell Vendor Matched",
            description="Transaction to PT. Baja Logistik matches pattern for high-risk offshore entity linkage.",
            risk_score=0.96,
        )
        db.add(alert)
        db.commit()
        # 4. V4: Resolving UBO & Asset Path
        print("🕵️ [V4] Tracing Ownership to UBO...")
        # Create UBO Entity
        ubo = Entity(name="Budi Santoso (Beneficiary)", type=EntityType.PERSON)
        shell = Entity(name="PT. Baja Logistik (Shell)", type=EntityType.COMPANY)
        db.add(ubo)
        db.add(shell)
        db.commit()
        rel = CorporateRelationship(
            parent_entity_id=ubo.id,
            child_entity_id=shell.id,
            stake_percentage=100.0,
            relationship_type="BENEFICIAL_OWNER",
        )
        db.add(rel)
        # Discover Asset
        asset = Asset(
            name="Apartemen Pakubuwono Terrace (Unit A-12)",
            type="Real Estate",
            estimated_value=1800000000,  # 1.8B IDR
            owner_entity_id=ubo.id,
            is_frozen=False,
            purchase_date=datetime.now() - timedelta(days=5),  # Recent purchase
            location="Kebayoran Lama, Jakarta",
        )
        db.add(asset)
        db.commit()
        print(f"💎 [V4] Asset Discovered: {asset.name}")
        print(f"🔗 [Nexus] Path Resolved: Project Fund -> Shell Co -> {ubo.name} -> Luxury Asset")
        print("\n✅ Simulation Complete: Operation Zenith Successful.")
        print(
            "✨ The War Room Dashboard (/) and Asset Recovery (/forensic/assets) are now updated with this lineage."
        )


if __name__ == "__main__":
    asyncio.run(simulate_e2e_forensic_path())
