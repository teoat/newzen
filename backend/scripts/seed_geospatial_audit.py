import sys
import os
import uuid
from datetime import datetime, UTC, timedelta

# Ensure backend root is in path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(current_dir)
if backend_root not in sys.path:
    sys.path.append(backend_root)

from sqlmodel import Session, select  # noqa: E402
from app.core.db import engine  # noqa: E402
from app.models import User, Project, Entity, Transaction, UserProjectAccess, ProjectRole, EntityType  # noqa: E402

def seed_geospatial_audit():
    print("🚀 Seeding Tactical Geospatial Audit Data...")
    
    with Session(engine) as session:
        # 1. Get or Create Admin
        admin = session.exec(select(User).where(User.username == "admin")).first()
        if not admin:
            print("❌ Admin user not found. Please run seed_initial.py first.")
            return

        # 2. Create high-stakes Project in Surabaya Port
        project_code = "PRJ-SURABAYA-2026"
        project = session.exec(select(Project).where(Project.code == project_code)).first()
        if not project:
            project = Project(
                id=str(uuid.uuid4()),
                name="Surabaya Tanjung Perak Modernization",
                code=project_code,
                contract_value=4500000000.0, # 4.5B
                start_date=datetime.now(UTC) - timedelta(days=60),
                contractor_name="PT Utama Maritime Construction",
                status="audit_mode",
                site_location="Surabaya Tanjung Perak, Port Zone",
                latitude=-7.2023,
                longitude=112.7297,
            )
            session.add(project)
            session.commit()
            session.refresh(project)
            print(f"✅ Created Project: {project.name}")
        else:
            print(f"ℹ️ Project {project_code} already exists.")

        # 3. Ensure Admin access
        access = session.exec(
            select(UserProjectAccess)
            .where(UserProjectAccess.user_id == admin.id)
            .where(UserProjectAccess.project_id == project.id)
        ).first()
        if not access:
            access = UserProjectAccess(
                user_id=admin.id,
                project_id=project.id,
                role=ProjectRole.ADMIN
            )
            session.add(access)
            session.commit()

        # 4. Create Entities with Varying Proximity
        print("📍 Seeding Entities with Tactical Locations...")
        
        entities_data = [
            {
                "name": "PT Surabaya Cement Supplies",
                "type": EntityType.COMPANY,
                "lat": -7.2100, # Very Local (~1km)
                "lng": 112.7300,
                "risk": 0.05
            },
            {
                "name": "Jakarta Logistics Hub Corp",
                "type": EntityType.COMPANY,
                "lat": -6.2088, # Regional (~670km)
                "lng": 106.8456,
                "risk": 0.25
            },
            {
                "name": "Singa-Port Offshore Holdings",
                "type": EntityType.COMPANY,
                "lat": 1.3521,  # International (~1100km)
                "lng": 103.8198,
                "risk": 0.65
            },
            {
                "name": "Medan Palm Logistics",
                "type": EntityType.COMPANY,
                "lat": 3.5952,
                "lng": 98.6722,
                "risk": 0.45
            },
            {
                "name": "Makassar Shipping Hub",
                "type": EntityType.COMPANY,
                "lat": -5.1476,
                "lng": 119.4327,
                "risk": 0.35
            },
            {
                "name": "Bali Capital Layering",
                "type": EntityType.COMPANY,
                "lat": -8.4095,
                "lng": 115.1889,
                "risk": 0.75
            },
            {
                "name": "Masohi Logistics Hub",
                "type": EntityType.COMPANY,
                "lat": -3.3100,
                "lng": 128.9500,
                "risk": 0.38
            },
            {
                "name": "Kobisonta Frontier Supply",
                "type": EntityType.COMPANY,
                "lat": -3.0076,
                "lng": 129.8456,
                "risk": 0.52
            },
            {
                "name": "Ghost Entity - Dubai Branch",
                "type": EntityType.COMPANY,
                "lat": 25.2048, # Very Distant (~7400km)
                "lng": 55.2708,
                "risk": 0.85
            }
        ]

        entity_objs = {}
        for e_data in entities_data:
            ent = session.exec(select(Entity).where(Entity.name == e_data["name"]).where(Entity.project_id == project.id)).first()
            if not ent:
                ent = Entity(
                    id=str(uuid.uuid4()),
                    project_id=project.id,
                    name=e_data["name"],
                    type=e_data["type"],
                    risk_score=e_data["risk"],
                    metadata_json={"lat": e_data["lat"], "lng": e_data["lng"]}
                )
                session.add(ent)
            entity_objs[e_data["name"]] = ent
        
        session.commit()

        # 5. Seed Transactions (The Flow)
        print("💸 Seeding Audit Flows...")
        
        flows = [
            # Normal Local Flow
            (project.contractor_name, "PT Surabaya Cement Supplies", 120000000.0, "Monthly Cement Allocation"),
            # Suspicious Distant Flow
            (project.contractor_name, "Jakarta Logistics Hub Corp", 450000000.0, "Specialized Logistics Fee - RUSH"),
            # High-Risk Offshore Tunneling
            ("Jakarta Logistics Hub Corp", "Singa-Port Offshore Holdings", 380000000.0, "Consulting Disbursement #4"),
            ("Singa-Port Offshore Holdings", "Ghost Entity - Dubai Branch", 300000000.0, "International Licensing Fee")
        ]

        for sender, receiver, amount, desc in flows:
            tx = Transaction(
                id=str(uuid.uuid4()),
                project_id=project.id,
                amount=amount,
                actual_amount=amount,
                proposed_amount=amount,
                sender=sender,
                receiver=receiver,
                description=desc,
                category_code="V", # Verification Needed
                timestamp=datetime.now(UTC) - timedelta(days=10),
                status="pending"
            )
            session.add(tx)
        
        session.commit()
    
    print("🎯 Forensic Seeding Complete. Nexus Graph is now primed for Geospatial Audit.")

if __name__ == "__main__":
    seed_geospatial_audit()
