import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from app.main import app
from app.core.db import get_session
from app.models import User, Project, UserProjectAccess, ProjectRole
from app.core.security import create_access_token

# Setup test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

@pytest.fixture
def session():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)

@pytest.fixture
def client(session):
    def get_session_override():
        return session
    app.dependency_overrides[get_session] = get_session_override
    yield TestClient(app)
    app.dependency_overrides.clear()

def test_unauthorized_project_access(client, session):
    # 1. Create two users and a project
    user1 = User(id="u1", username="user1", email="u1@test.com", full_name="User One", hashed_password="pw", role="analyst")
    user2 = User(id="u2", username="user2", email="u2@test.com", full_name="User Two", hashed_password="pw", role="analyst")
    project1 = Project(
        id="p1", 
        name="Project 1", 
        code="P1", 
        contractor_name="C1", 
        contract_value=100.0, 
        start_date=datetime(2024, 1, 1),
        status="audit_mode"
    )
    
    session.add(user1)
    session.add(user2)
    session.add(project1)
    session.commit()
    session.refresh(user1)
    session.refresh(user2)
    session.refresh(project1)

    # 2. Grant user1 access to project1
    access = UserProjectAccess(user_id=user1.id, project_id=project1.id, role=ProjectRole.VIEWER)
    session.add(access)
    session.commit()

    # 3. Try to access project1 using user1's token (Should work)
    token1 = create_access_token(subject=user1.id)
    response = client.get(f"/api/v1/project/{project1.id}/dashboard", headers={"Authorization": f"Bearer {token1}"})
    assert response.status_code == 200

    # 4. Try to access project1 using user2's token (Should BE 403)
    token2 = create_access_token(subject=user2.id)
    response = client.get(f"/api/v1/project/{project1.id}/dashboard", headers={"Authorization": f"Bearer {token2}"})
    assert response.status_code == 403
    assert "access" in response.json()["detail"].lower()
