
from sqlmodel import Session, create_engine, select
from app.modules.ai.frenly_orchestrator import FrenlyOrchestrator
from app.models import Transaction
import asyncio
import os

# Mock settings for local run
os.environ["SECRET_KEY"] = "test"
os.environ["ENCRYPTION_SECRET"] = "a" * 32

async def test_reasoning():
    from app.core.config import settings
    engine = create_engine(settings.DATABASE_URL)
    with Session(engine) as session:
        # Get transactions for Demo project
        project_id = "ZENITH-DEMO-001"
        txs = session.exec(select(Transaction).where(Transaction.project_id == project_id)).all()
        tx_ids = [tx.id for tx in txs]
        
        print(f"Found {len(tx_ids)} transactions for project {project_id}")
        
        orchestrator = FrenlyOrchestrator(session)
        result = await orchestrator.generate_hypotheses_from_transactions(tx_ids)
        
        import json
        print(json.dumps(result, indent=2))

if __name__ == "__main__":
    asyncio.run(test_reasoning())
