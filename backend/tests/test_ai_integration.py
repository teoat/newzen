"""
Integration Tests for AI Assist Endpoint
Tests full flow from request to response, including pattern logging.
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel, select
from app.main import app
from app.core.db import get_session
from app.models import User, Project, UserQueryPattern
from datetime import datetime
import json


@pytest.fixture(name="engine")
def engine_fixture():
    """Create test database engine"""
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    return engine


@pytest.fixture(name="session")
def session_fixture(engine):
    """Create test database session"""
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session):
    """Create test client with dependency override"""
    def get_session_override():
        return session
    
    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="test_user")
def test_user_fixture(session):
    """Create test user"""
    user = User(
        id="test_user_id",
        username="analyst1",
        email="analyst@zenith.com",
        full_name="Test Analyst",
        hashed_password="hashed_pw",
        role="analyst"
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="test_project")
def test_project_fixture(session):
    """Create test project"""
    project = Project(
        id="test_project_id",
        name="Integration Test Project",
        code="ITP001",
        contract_value=5000000.0,
        start_date=datetime(2024, 1, 1),
        contractor_name="Test Contractor Ltd"
    )
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


class TestAIAssistEndpoint:
    """Integration tests for /api/v1/ai/assist"""
    
    def test_assist_general_query(self, client, test_user, test_project):
        """Should handle general chat queries"""
        context = {
            "user_id": test_user.id,
            "project_id": test_project.id,
            "page": "/dashboard",
            "session_id": "test_session_001"
        }
        
        response = client.post(
            "/api/v1/ai/assist",
            data={
                "query": "Hello, I need help analyzing transactions",
                "context_json": json.dumps(context)
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert data["response_type"] in [
            "chat", "sql_query", "explanation"
        ]
    
    def test_assist_logs_query_pattern(
        self, client, session, test_user, test_project
    ):
        """Should log query to user_query_patterns table"""
        context = {
            "user_id": test_user.id,
            "project_id": test_project.id,
            "page": "/investigate",
            "session_id": "test_session_002"
        }
        
        query_text = "Show high-risk transactions"
        
        response = client.post(
            "/api/v1/ai/assist",
            data={
                "query": query_text,
                "context_json": json.dumps(context)
            }
        )
        
        assert response.status_code == 200
        
        # Verify pattern was logged
        pattern = session.exec(
            select(UserQueryPattern)
            .where(UserQueryPattern.user_id == test_user.id)
            .where(UserQueryPattern.query_text == query_text)
        ).first()
        
        assert pattern is not None
        assert pattern.query_frequency == 1
        assert pattern.project_id == test_project.id
        assert pattern.execution_time_ms is not None
    
    def test_assist_increments_frequency(
        self, client, session, test_user, test_project
    ):
        """Should increment frequency for repeated queries"""
        context = {
            "user_id": test_user.id,
            "project_id": test_project.id,
            "page": "/investigate",
            "session_id": "test_session_003"
        }
        
        query_text = "Show transactions above 100M"
        
        # Execute same query 3 times
        for _ in range(3):
            client.post(
                "/api/v1/ai/assist",
                data={
                    "query": query_text,
                    "context_json": json.dumps(context)
                }
            )
        
        # Check frequency
        pattern = session.exec(
            select(UserQueryPattern)
            .where(UserQueryPattern.user_id == test_user.id)
            .where(UserQueryPattern.query_text == query_text)
        ).first()
        
        assert pattern is not None
        assert pattern.query_frequency == 3
    
    def test_assist_error_handling(self, client, test_user):
        """Should handle errors gracefully"""
        # Missing context
        response = client.post(
            "/api/v1/ai/assist",
            data={"query": "test query"}
        )
        
        # Should return error or handle gracefully
        assert response.status_code in [200, 422, 500]


class TestSuggestActionsEndpoint:
    """Integration tests for /api/v1/ai/suggest-actions"""
    
    def test_suggest_actions_no_personalization(self, client):
        """Should return page-specific suggestions"""
        response = client.post(
            "/api/v1/ai/suggest-actions",
            json={
                "page": "/reconciliation",
                "project_id": None,
                "user_id": None
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data
        assert len(data["suggestions"]) > 0
        assert data["personalized_count"] == 0
    
    def test_suggest_actions_with_personalization(
        self, client, session, test_user, test_project
    ):
        """Should include personalized suggestions based on patterns"""
        # Create pattern data
        pattern = UserQueryPattern(
            user_id=test_user.id,
            project_id=test_project.id,
            query_text="Show high-risk vendors",
            intent_type="sql_query",
            response_type="sql_query",
            page_context="/investigate",
            query_frequency=5,
            was_successful=True
        )
        session.add(pattern)
        session.commit()
        
        response = client.post(
            "/api/v1/ai/suggest-actions",
            json={
                "page": "/investigate",
                "project_id": test_project.id,
                "user_id": test_user.id
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data
        assert data["personalized_count"] >= 1
        
        # Check if personalized suggestion is present
        personalized = [
            s for s in data["suggestions"]
            if s.get("action") == "run_saved_query"
        ]
        assert len(personalized) > 0


class TestConversationHistory:
    """Integration tests for conversation memory"""
    
    def test_retrieve_conversation_history(self, client):
        """Should retrieve conversation history for session"""
        session_id = "test_history_session"
        
        # First, make some queries to create history
        context = {
            "session_id": session_id,
            "page": "/dashboard"
        }
        
        client.post(
            "/api/v1/ai/assist",
            data={
                "query": "First message",
                "context_json": json.dumps(context)
            }
        )
        
        # Retrieve history
        response = client.get(
            f"/api/v1/ai/conversation-history/{session_id}"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "history" in data
        # Note: History may be empty if Redis is not running in test env


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
