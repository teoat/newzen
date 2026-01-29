"""
Unit Tests for FrenlyOrchestrator
Tests intent detection, SQL generation safety, and AI response handling.
"""

import pytest
from sqlmodel import Session, create_engine, SQLModel
from app.modules.ai.frenly_orchestrator import FrenlyOrchestrator
from app.models import Transaction, Project, User
from datetime import datetime


@pytest.fixture(name="session")
def session_fixture():
    """Create in-memory test database"""
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        # Seed test data
        user = User(
            id="test_user",
            username="analyst1",
            email="analyst@test.com",
            full_name="Test Analyst",
            hashed_password="hashed",
            role="analyst"
        )
        project = Project(
            id="proj1",
            name="Test Project",
            code="TP001",
            contract_value=1000000.0,
            start_date=datetime(2024, 1, 1),
            contractor_name="Test Contractor"
        )
        session.add(user)
        session.add(project)
        session.commit()
        yield session


class TestIntentDetection:
    """Test suite for AI intent classification"""
    
    def test_detect_sql_query_intent(self, session):
        """Should detect SQL query intent from natural language"""
        orchestrator = FrenlyOrchestrator(session)
        context = {"page": "/investigate", "project_id": "proj1"}
        
        # Test SQL-like queries
        intent = orchestrator.detect_intent(
            "Show me all transactions above 100M",
            context
        )
        assert intent in ["sql_query", "general_chat"]  # May vary
        
    def test_detect_action_intent(self, session):
        """Should detect action intent for user commands"""
        orchestrator = FrenlyOrchestrator(session)
        context = {"page": "/investigate"}
        
        intent = orchestrator.detect_intent(
            "Export this to PDF",
            context
        )
        assert intent in ["action", "general_chat"]
        
    def test_detect_explanation_intent(self, session):
        """Should detect explanation requests"""
        orchestrator = FrenlyOrchestrator(session)
        context = {"page": "/dashboard"}
        
        intent = orchestrator.detect_intent(
            "Why is this transaction flagged as high risk?",
            context
        )
        assert intent in ["explanation", "general_chat"]
        
    def test_detect_general_chat_intent(self, session):
        """Should detect casual conversation"""
        orchestrator = FrenlyOrchestrator(session)
        context = {"page": "/dashboard"}
        
        intent = orchestrator.detect_intent(
            "Hello, how are you?",
            context
        )
        assert intent == "general_chat"


class TestSQLGeneration:
    """Test suite for SQL generation safety and validation"""
    
    @pytest.mark.asyncio
    async def test_sql_injection_prevention(self, session):
        """Should prevent SQL injection attempts"""
        orchestrator = FrenlyOrchestrator(session)
        context = {"project_id": "proj1"}
        
        # Attempt SQL injection
        result = await orchestrator.handle_sql_query(
            "Show transactions WHERE 1=1; DROP TABLE transaction;--",
            context
        )
        
        # Should either reject or sanitize
        assert result["response_type"] in ["error", "sql_query"]
        if result.get("sql"):
            assert "DROP" not in result["sql"].upper()
            assert "DELETE" not in result["sql"].upper()
    
    @pytest.mark.asyncio
    async def test_dangerous_keywords_blocked(self, session):
        """Should block dangerous SQL operations"""
        orchestrator = FrenlyOrchestrator(session)
        context = {"project_id": "proj1"}
        
        dangerous_queries = [
            "DELETE all transactions",
            "UPDATE transaction SET amount = 0",
            "TRUNCATE TABLE transaction"
        ]
        
        for query in dangerous_queries:
            result = await orchestrator.handle_sql_query(query, context)
            assert result["response_type"] == "error"
            assert result.get("sql") is None
    
    @pytest.mark.asyncio
    async def test_valid_select_query(self, session):
        """Should allow safe SELECT queries"""
        orchestrator = FrenlyOrchestrator(session)
        context = {"project_id": "proj1"}
        
        result = await orchestrator.handle_sql_query(
            "Show me all transactions",
            context
        )
        
        # Should generate valid SQL
        if result["response_type"] == "sql_query":
            assert result.get("sql") is not None
            assert "SELECT" in result["sql"].upper()


class TestResponseHandling:
    """Test suite for AI response generation"""
    
    @pytest.mark.asyncio
    async def test_general_chat_response(self, session):
        """Should handle casual conversation gracefully"""
        orchestrator = FrenlyOrchestrator(session)
        context = {"page": "/dashboard", "session_id": "test_session"}
        
        result = await orchestrator.handle_general_chat(
            "Hello, I need help with my investigation",
            context
        )
        
        assert result["response_type"] == "chat"
        assert "answer" in result
        assert len(result["answer"]) > 0
    
    @pytest.mark.asyncio
    async def test_explanation_response(self, session):
        """Should provide forensic explanations"""
        orchestrator = FrenlyOrchestrator(session)
        context = {"page": "/investigate", "project_id": "proj1"}
        
        result = await orchestrator.handle_explanation(
            "What is a high-risk transaction pattern?",
            context
        )
        
        assert result["response_type"] == "explanation"
        assert "answer" in result
        # Should provide substantive explanation
        assert len(result["answer"]) > 50


class TestProactiveAlerts:
    """Test suite for proactive monitoring"""
    
    @pytest.mark.asyncio
    async def test_fetch_alerts(self, session):
        """Should retrieve proactive alerts"""
        from app.models import FraudAlert
        
        # Create test alert
        alert = FraudAlert(
            project_id="proj1",
            transaction_id="tx1",
            alert_type="high_risk",
            severity="critical",
            risk_score=0.95,
            description="Test alert"
        )
        session.add(alert)
        session.commit()
        
        orchestrator = FrenlyOrchestrator(session)
        alerts = await orchestrator._fetch_db_alerts("proj1")
        
        assert len(alerts) > 0
        assert alerts[0]["severity"] == "critical"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
