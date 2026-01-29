import requests
from datetime import datetime
from sqlmodel import Session, create_engine
from app.models import Project

API_URL = "http://localhost:8200/api/v1/ingestion/consolidate"
# Create a project first?
# The consolidate endpoint requires a project_id.
# But in 'lite' mode, maybe we can use a fixed ID or stub it.
# Check router.py:
# project = db.exec(select(Project).where(Project.id == payload.projectId)).first()
# if not project: raise 404
# So I need a project.
# Let's create a project via API or directly in DB.
# There is a project router. POST /api/v1/project/ might exist?
# Or I can just insert into DB via SQLModel in this script if I import app.models.
# But better to use API if possible to test end-to-end.
# Let's check project router again. It has GET methods only in Step 595 view.
# So I probably need to seed the DB.
# Use SQLModel to seed a project.

# Setup DB connection
DATABASE_URL = "sqlite:///./zenith_lite.db"
engine = create_engine(DATABASE_URL)


def seed_project():
    with Session(engine) as session:
        # Check if project exists
        project = session.get(Project, "PRJ-2024-ALPHA")
        if not project:
            print("Seeding project PRJ-2024-ALPHA...")
            project = Project(
                id="PRJ-2024-ALPHA",
                name="Project Alpha",
                code="CTR-2024-001",
                contract_value=1000000000.0,
                start_date=datetime.now(),
                contractor_name="PT. Alpha Build",
            )
            session.add(project)
            session.commit()
            print("Project seeded.")
        else:
            print("Project already exists.")


if __name__ == "__main__":
    # Create tables if not exist (in case backend hasn't started yet or failed)
    # But backend startup does this. Assuming backend is running.
    # Actually, if backend is running, the DB file is locked? No, sqlite handles concurrent reads.
    # But writes might lock. I need to be careful.
    # Let's try to verify via API first. If 404 on project, then seed.
    # Try to seed (assuming valid file path context)
    try:
        seed_project()
    except Exception as e:
        print(f"Seeding failed (maybe DB locked or path wrong): {e}")
    payload = {
        "projectId": "PRJ-2024-ALPHA",
        "fileName": "test_bank_statement.csv",
        "fileType": "bank_statement",
        "fileHash": "SHA256:1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
        "mappings": [
            {
                "systemField": "date",
                "label": "Date",
                "fileColumn": "Date",
                "required": True,
            },
            {
                "systemField": "description",
                "label": "Desc",
                "fileColumn": "Description",
                "required": True,
            },
            {
                "systemField": "amount",
                "label": "Amount",
                "fileColumn": "Amount",
                "required": True,
            },
            {
                "systemField": "geolocation",
                "label": "Geo",
                "fileColumn": "Location",
                "required": False,
            },
        ],
        "previewData": [
            {
                "Date": "2024-01-01",
                "Description": "Payment to Vendor A",
                "Amount": "5000000",
                "Location": "-6.2088, 106.8456",
            },
            {
                "Date": "2024-01-02",
                "Description": "Material Purchase",
                "Amount": "1200000",
                "Location": "Unknown",
            },
        ],
        "totalRows": 2,
    }
    try:
        response = requests.post(API_URL, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")
