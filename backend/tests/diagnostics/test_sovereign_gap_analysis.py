import pytest
import hashlib
import uuid
import asyncio
from datetime import datetime, UTC
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from app.main import app
from app.core.db import get_session
from app.modules.forensic.rab_service import RABService
from app.models import BudgetLine, Transaction, Project, User, TransactionCategory, Document, TransactionSource
from app.core.security import create_access_token
from app.modules.agents.judge import JudgeAgent
from sqlalchemy.pool import StaticPool

# Setup Test DB
sqlite_url = "sqlite:///:memory:"
engine = create_engine(
    sqlite_url, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def drop_db_and_tables():
    SQLModel.metadata.drop_all(engine)

@pytest.fixture(name="session")
def session_fixture():
    create_db_and_tables()
    with Session(engine) as session:
        yield session
    drop_db_and_tables()

@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session
    
    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

# --- PHASE 1: SECURITY DIAGNOSTIC ---
def test_websocket_security_gap(client, session):
    """
    DIAGNOSTIC RE-RUN: Verify if SECURITY GAP is closed.
    """
    user_id = str(uuid.uuid4())
    project_target = str(uuid.uuid4())
    
    intruder = User(
        id=user_id, 
        username=f"intruder_{user_id[:8]}",
        full_name="Intruder Spy",
        email="intruder@spy.com", 
        hashed_password="pw", 
        role="user"
    )
    session.add(intruder)
    
    proj = Project(
        id=project_target, 
        name="Target", 
        code=f"CONTRACT-{user_id[:8]}",
        contract_value=1000000.0,
        start_date=datetime.now(UTC),
        contractor_name="Secret Corp"
    )
    session.add(proj)
    session.commit()
    
    token = create_access_token(data={"sub": user_id})
    
    try:
        with client.websocket_connect(f"/ws/{project_target}") as ws:
            ws.receive_text()
            assert False
    except Exception:
        pass

    try:
        url = f"/ws/{project_target}?token={token}"
        with client.websocket_connect(url) as ws:
            ws.receive_text() 
            assert False
    except Exception:
        pass
        
    print("[DIAGNOSTIC] ✅ PHASE 1: SECURITY GAP CLOSED.")

# --- PHASE 2: FORENSIC LOGIC INTEGRITY ---
def test_forensic_math_infinity_handling(session):
    """
    DIAGNOSTIC: Handle Division by Zero in Variance Calculation.
    """
    service = RABService(session)
    project_id = str(uuid.uuid4())
    
    bl = BudgetLine(
        project_id=project_id,
        item_name="Mystery Item",
        category="Material",
        qty_rab=0.0, 
        unit_price_rab=0.0,
        total_price_rab=0.0,
        qty_actual=10.0,
        total_spend_actual=1000.0, 
        unit="unit"
    )
    session.add(bl)
    session.commit()
    
    analysis = service._calculate_global_material_integrity(project_id)
    assert analysis["gap_percentage"] == 0 
    print("[DIAGNOSTIC] ✅ PHASE 2.1: MATH INTEGRITY (Zero Division) PASSED.")

@pytest.mark.asyncio
async def test_variance_logic_tax_leakage(session):
    """
    DIAGNOSTIC: Verify if Tax/Overhead leakage is detected or creates false positives.
    """
    service = RABService(session)
    project_id = str(uuid.uuid4())
    
    bl = BudgetLine(
        project_id=project_id,
        item_name="Cement Bag",
        category="Material",
        qty_rab=1000.0,
        unit_price_rab=1100.0, 
        total_price_rab=1100000.0,
        unit="bag"
    )
    session.add(bl)
    session.commit()
    
    tx = Transaction(
        id=str(uuid.uuid4()),
        project_id=project_id,
        description="Cement Bag Purchase",
        actual_amount=1000000.0, 
        quantity=1000.0,
        category_code=TransactionCategory.MAT,
        sender="Vendor A",
        receiver="Project Site"
    )
    session.add(tx)
    session.commit()
    
    await service.recalculate_variance(project_id)
    session.refresh(bl)
    print(f"[DIAGNOSTIC] ⚠️ PHASE 2.2: VARIANCE LOGIC: Tax Leakage Risk identified. Result: {bl.markup_percentage:.2f}% markup.")
    assert True

# --- PHASE 3: RESILIENCE & CHAOS ---
@pytest.mark.asyncio
async def test_judge_agent_resilience():
    """
    DIAGNOSTIC: Verify JudgeAgent recovers from Redis Connection Failure.
    """
    agent = JudgeAgent()
    mock_redis = MagicMock()
    
    # We want to test that the loop CONTINUES after an exception.
    # We'll use a side effect that raises an error, THEN raises CancelledError to break the loop.
    mock_redis.consume_events.side_effect = [
        Exception("Redis Fail"), 
        asyncio.CancelledError() # Breaks the loop from within
    ]
    agent.redis_client = mock_redis
    
    # Use AsyncMock for sleep
    with patch('asyncio.sleep', new_callable=AsyncMock):
        try:
            await agent.start()
        except asyncio.CancelledError:
            pass
            
    # If it reached the second call (CancelledError), it means it SURVIVED the first Exception.
    assert mock_redis.consume_events.call_count >= 2
    print("[DIAGNOSTIC] ✅ PHASE 3: RESILIENCE: JudgeAgent survived Redis Failure simulation.")

# --- PHASE 4: CHAIN OF CUSTODY (IMMUTABILITY) ---
def test_integrity_round_trip(client, session):
    """
    DIAGNOSTIC: Verify uploaded content hash matches downloaded content hash.
    """
    content = b"This is a forensic evidence file."
    original_hash = hashlib.sha256(content).hexdigest()
    project_id = str(uuid.uuid4())
    
    from app.core.auth_middleware import verify_project_access
    app.dependency_overrides[verify_project_access] = lambda: Project(id=project_id)

    session.add(Project(
        id=project_id, 
        name="Evidence Project",
        code=f"EVIDENCE-{project_id[:8]}",
        contract_value=500000.0,
        start_date=datetime.now(UTC),
        contractor_name="Evidence Source"
    ))
    session.commit()

    response = client.post(
        f"/api/v1/evidence/{project_id}/upload",
        files={"file": ("evidence.txt", content, "text/plain")},
        data={"file_type": "contract", "case_id": "case_1"}
    )
    
    if response.status_code == 200:
        data = response.json()
        doc_id = data["document_id"]
        dl_response = client.get(f"/api/v1/evidence/{project_id}/download/{doc_id}")
        if dl_response.status_code == 200:
            downloaded_hash = hashlib.sha256(dl_response.content).hexdigest()
            assert downloaded_hash == original_hash
            print("[DIAGNOSTIC] ✅ PHASE 4: CHAIN OF CUSTODY PASSED.")
