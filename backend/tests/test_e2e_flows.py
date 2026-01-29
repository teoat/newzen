"""
E2E Tests for Critical User Flows
Tests complete user journeys from login to data analysis.
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from app.main import app
from app.core.db import get_session
from app.core.security import create_access_token
from app.models import User, Project, Transaction, UserProjectAccess, ProjectRole
from datetime import datetime


@pytest.fixture(name="engine")
def engine_fixture():
    """Create test database"""
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    return engine


@pytest.fixture(name="session")
def session_fixture(engine):
    """Create test session"""
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session):
    """Create test client"""
    def get_session_override():
        return session
    
    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


class TestAuthenticationFlow:
    """E2E test for user authentication"""
    
    def test_login_flow(self, client, session):
        """Should authenticate user and return JWT token"""
        from app.core.security import hash_password
        
        # Create user
        user = User(
            id="e2e_user",
            username="e2e_analyst",
            email="e2e@zenith.com",
            full_name="E2E Test User",
            hashed_password=hash_password("test_password"),
            role="analyst"
        )
        session.add(user)
        session.commit()
        
        # Login
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "e2e_analyst",
                "password": "test_password"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"


class TestProjectAccessFlow:
    """E2E test for project access control"""
    
    def test_project_gate_flow(self, client, session):
        """
        Complete flow:
        1. User logs in
        2. Creates project
        3. Accesses project dashboard
        4. Verifies data isolation
        """
        from app.core.security import hash_password
        
        # Step 1: Create and authenticate user
        user = User(
            id="gate_user",
            username="gate_analyst",
            email="gate@zenith.com",
            full_name="Gate Test User",
            hashed_password=hash_password("password"),
            role="analyst"
        )
        session.add(user)
        session.commit()
        
        token = create_access_token(subject=user.id)
        headers = {"Authorization": f"Bearer {token}"}
        
        # Step 2: Create project
        response = client.post(
            "/api/v1/project",
            headers=headers,
            json={
                "name": "E2E Test Project",
                "code": "E2E001",
                "contractor_name": "Test Contractor",
                "contract_value": 1000000.0,
                "start_date": "2024-01-01T00:00:00"
            }
        )
        
        assert response.status_code == 200
        project_data = response.json()
        project_id = project_data["id"]
        
        # Step 3: Access project dashboard
        response = client.get(
            f"/api/v1/project/{project_id}/dashboard",
            headers=headers
        )
        
        assert response.status_code == 200
        
        # Step 4: Verify data isolation
        # Create another user
        user2 = User(
            id="gate_user2",
            username="gate_analyst2",
            email="gate2@zenith.com",
            full_name="Gate Test User 2",
            hashed_password=hash_password("password"),
            role="analyst"
        )
        session.add(user2)
        session.commit()
        
        token2 = create_access_token(subject=user2.id)
        headers2 = {"Authorization": f"Bearer {token2}"}
        
        # User 2 should NOT have access
        response = client.get(
            f"/api/v1/project/{project_id}/dashboard",
            headers=headers2
        )
        
        assert response.status_code == 403  # Forbidden


class TestAIQueryFlow:
    """E2E test for AI-powered data analysis"""
    
    def test_ai_query_to_results_flow(self, client, session):
        """
        Complete flow:
        1. User authenticates
        2. Selects project
        3. Sends AI query
        4. Receives SQL results
        5. Sees suggested actions
        """
        from app.core.security import hash_password
        
        # Setup user and project
        user = User(
            id="ai_user",
            username="ai_analyst",
            email="ai@zenith.com",
            full_name="AI Test User",
            hashed_password=hash_password("password"),
            role="analyst"
        )
        project = Project(
            id="ai_project",
            name="AI Test Project",
            code="AI001",
            contract_value=2000000.0,
            start_date=datetime(2024, 1, 1),
            contractor_name="AI Contractor"
        )
        access = UserProjectAccess(
            user_id=user.id,
            project_id=project.id,
            role=ProjectRole.ADMIN,
            granted_by_id=user.id
        )
        
        # Add test transaction
        transaction = Transaction(
            id="tx_001",
            project_id=project.id,
            amount=150000000.0,
            currency="IDR",
            sender="Test Vendor",
            receiver="Project Account",
            risk_score=0.85,
            description="High-value test transaction"
        )
        
        session.add(user)
        session.add(project)
        session.add(access)
        session.add(transaction)
        session.commit()
        
        token = create_access_token(subject=user.id)
        headers = {"Authorization": f"Bearer {token}"}
        
        # Send AI query
        import json
        context = {
            "user_id": user.id,
            "project_id": project.id,
            "page": "/investigate",
            "session_id": "e2e_session"
        }
        
        response = client.post(
            "/api/v1/ai/assist",
            headers=headers,
            data={
                "query": "Show me high-risk transactions",
                "context_json": json.dumps(context)
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "answer" in data
        assert "response_type" in data
        
        # Check if SQL was generated
        if data["response_type"] == "sql_query":
            assert "sql" in data or "data" in data


class TestProjectSwitchingFlow:
    """E2E test for switching between projects and data isolation"""
    
    def test_project_switch_data_isolation(self, client, session):
        """
        Verify data isolation when switching projects:
        1. User has access to two projects
        2. Each project has different transactions
        3. Switching projects shows only relevant data
        """
        from app.core.security import hash_password
        
        # Create user
        user = User(
            id="switch_user",
            username="switch_analyst",
            email="switch@zenith.com",
            full_name="Switch Test User",
            hashed_password=hash_password("password"),
            role="analyst"
        )
        
        # Create two projects
        project1 = Project(
            id="proj_a",
            name="Project A",
            code="PA001",
            contract_value=1000000.0,
            start_date=datetime(2024, 1, 1),
            contractor_name="Contractor A"
        )
        project2 = Project(
            id="proj_b",
            name="Project B",
            code="PB001",
            contract_value=2000000.0,
            start_date=datetime(2024, 1, 1),
            contractor_name="Contractor B"
        )
        
        # Grant access to both
        access1 = UserProjectAccess(
            user_id=user.id,
            project_id=project1.id,
            role=ProjectRole.VIEWER,
            granted_by_id=user.id
        )
        access2 = UserProjectAccess(
            user_id=user.id,
            project_id=project2.id,
            role=ProjectRole.VIEWER,
            granted_by_id=user.id
        )
        
        # Add transactions to each project
        tx_a = Transaction(
            id="tx_a1",
            project_id=project1.id,
            amount=50000000.0,
            currency="IDR",
            sender="Vendor A",
            receiver="Project A Account"
        )
        tx_b = Transaction(
            id="tx_b1",
            project_id=project2.id,
            amount=75000000.0,
            currency="IDR",
            sender="Vendor B",
            receiver="Project B Account"
        )
        
        session.add_all([user, project1, project2, access1, access2, tx_a, tx_b])
        session.commit()
        
        token = create_access_token(subject=user.id)
        headers = {"Authorization": f"Bearer {token}"}
        
        # Access Project A dashboard
        response_a = client.get(
            f"/api/v1/project/{project1.id}/dashboard",
            headers=headers
        )
        assert response_a.status_code == 200
        
        # Access Project B dashboard
        response_b = client.get(
            f"/api/v1/project/{project2.id}/dashboard",
            headers=headers
        )
        assert response_b.status_code == 200
        
        # Data should be different
        data_a = response_a.json()
        data_b = response_b.json()
        
        # Basic verification that we got different project data
        assert data_a != data_b


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
