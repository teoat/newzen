import pytest
from sqlmodel import Session, select, create_engine, SQLModel
from fastapi.testclient import TestClient
from app.main import app
from app.core.db import get_session
from app.core.security import get_current_user
from app.models import Project, BudgetLine, AuditLog, User
from sqlalchemy.pool import StaticPool

def override_get_session():
    from app.core.db import engine
    with Session(engine) as session:
        yield session

def override_get_current_user():
    return User(id="test_user_id", role="ADMIN", username="test_bot")

app.dependency_overrides[get_session] = override_get_session
app.dependency_overrides[get_current_user] = override_get_current_user
client = TestClient(app)

@pytest.fixture(name="db")
def db_fixture():
    from app.core.db import engine
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)

def test_asset_discovery_and_flagging(db: Session):
    # 1. Create Project
    from datetime import datetime
    project = Project(
        name="Asset Verification Test",
        code="PROJ-TEST-001",
        contractor_name="PT Test Contractor",
        contract_value=10000000000,
        start_date=datetime(2024, 1, 1)
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    
    # 2. Add Budget Lines
    # Asset 1: FOUND (has actuals)
    b1 = BudgetLine(
        project_id=project.id,
        item_name="Excavator Komatsu PC200",
        category="EQUIPMENT",
        qty_rab=1,
        qty_actual=1,
        unit="UNIT",
        unit_price_rab=1500000000,
        total_price_rab=1500000000,
        total_spend_actual=1500000000,
        status="LOCATED"
    )
    # Asset 2: MISSING (no actuals) - High Value
    b2 = BudgetLine(
        project_id=project.id,
        item_name="Genset Perkins 60kVA",
        category="TOOLS",
        qty_rab=2,
        qty_actual=0,
        unit="UNIT",
        unit_price_rab=50000000,
        total_price_rab=100000000,
        total_spend_actual=0,
        status="MISSING"  # Implicitly managed by service
    )
    # Non-Asset: Material
    b3 = BudgetLine(
        project_id=project.id,
        item_name="Semen Portland",
        category="MATERIAL",
        qty_rab=1000,
        qty_actual=500,
        unit="SAK",
        unit_price_rab=50000,
        total_price_rab=50000000,
        total_spend_actual=25000000
    )
    db.add(b1)
    db.add(b2)
    db.add(b3)
    db.commit()

    # 3. Test API: Get Non-Perishable Assets
    # Allow authentication bypass for tests if needed, or assume no auth on this endpoint for local dev
    # The routers use verify_project_access which might check headers.
    # We might need to override verify_project_access if strictly enforced.
    # Trying direct call first.
    
    # Simulating overrides for auth if necessary
    # app.dependency_overrides[verify_project_access] = lambda: project
    
    # Note: The dependency 'verify_project_access' usually checks DB.
    # Since we use the same DB session override, it should work if we pass valid project_id.
    
    # Calling V2 Endpoint
    response = client.get(f"/api/v2/forensic-v2/rab/non-perishable-assets/{project.id}")
    
    # If 403/401, we might need to mock auth.
    if response.status_code in [401, 403]:
        # Simple hack: assume test env bypasses or we need to fix test setup
        print(f"Auth Blocked: {response.text}")
        
    assert response.status_code == 200, f"Failed with {response.status_code}: {response.text}"
    data = response.json()
    
    # Verify Discovery
    assets = data["assets"]
    assert len(assets) == 2, "Should find Excavator and Genset"
    
    excavator = next(a for a in assets if "Excavator" in a["item_name"])
    genset = next(a for a in assets if "Genset" in a["item_name"])
    
    assert excavator["status"] == "LOCATED"
    assert genset["status"] == "MISSING"

    # 4. Test Trigger Logic (via Recalculate)
    # Extract CSRF token from previous GET response cookies
    csrf_token = client.cookies.get("csrf_token")
    headers = {"X-CSRF-Token": csrf_token} if csrf_token else {}
    
    # Call recalculate endpoint which triggers the scan
    rec_response = client.post(
        f"/api/v2/forensic-v2/rab/recalculate/{project.id}",
        headers=headers
    )
    if rec_response.status_code == 403:
         print(f"POST Blocked: {rec_response.text}")
         
    assert rec_response.status_code == 200
    
    # 5. Verify AuditLog Creation
    logs = db.exec(
        select(AuditLog)
        .where(AuditLog.entity_type == "BudgetLine")
        .where(AuditLog.action == "RISK_FLAG")
    ).all()
    
    assert len(logs) > 0, "Should have created RISK_FLAGs for missing assets"
    # Verify at least one refers to the Genset
    assert any("Genset" in log.change_reason for log in logs)
    
    # Verify verification status
    for log in logs:
        assert log.new_value == "UNVERIFIED_CAPEX_ASSET"

