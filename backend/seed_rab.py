
import csv
from sqlmodel import Session, create_engine
from app.models import BudgetLine, Project
from app.core.config import settings

def seed_rab():
    engine = create_engine(settings.DATABASE_URL)
    with Session(engine) as session:
        project_id = "ZENITH-DEMO-001"
        project = session.get(Project, project_id)
        if not project:
            print(f"Project {project_id} not found. Creating...")
            from datetime import datetime, timedelta
            project = Project(
                id=project_id, 
                name="Zenith Demo Project", 
                code="ZENITH-DEMO-001", 
                contract_value=25000000000.0,
                start_date=datetime.now(),
                end_date=datetime.now() + timedelta(days=365),
                contractor_name="PT Mega Konstruksi",
                site_location="Kalimantan, Indonesia",
                status="audit_mode"
            )
            session.add(project)
            session.commit()
            
        with open('simplified_rab_data.csv', mode='r') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                # Clean up category (material/labor/etc based on unit or description)
                desc = row['description'].upper()
                row['unit'].upper()
                
                category = "Material"
                if "UPAH" in desc or "WORK" in desc or "TENAGA" in desc:
                    category = "Labor"
                elif "ALAT" in desc or "EQUIPMENT" in desc or "SEWA" in desc:
                    category = "Equipment"
                
                bl = BudgetLine(
                    project_id=project_id,
                    item_name=row['description'],
                    category=category,
                    qty_rab=float(row['qty_rab']),
                    unit=row['unit'],
                    unit_price_rab=float(row['unit_price_rab']),
                    total_price_rab=float(row['total_rab']),
                    qty_actual=0.0,
                    avg_unit_price_actual=0.0,
                    markup_percentage=0.0,
                    volume_discrepancy=0.0,
                    requires_justification=False
                )
                session.add(bl)
                count += 1
            
            session.commit()
            print(f"Seeded {count} budget lines for project {project_id}.")

if __name__ == "__main__":
    seed_rab()
