import asyncio
import sys
from sqlmodel import Session
from app.core.db import engine
from app.models import Transaction, TransactionCategory
from app.modules.fraud.reconciliation_router import detect_forensic_triggers
import uuid
from datetime import datetime

# Make sure we flush stdout
sys.stdout.reconfigure(line_buffering=True)


async def run_test():
    try:
        with Session(engine) as session:
            # 1. Create a near duplicate
            duplicate_tx = Transaction(
                id=str(uuid.uuid4()),
                # IMPORTANT: Use exact amounts for match logic (5.25M)
                proposed_amount=5250000,
                actual_amount=5250000,
                # Typos: "Bapa" -> "Bpa", "Tree" -> "Tre"
                description="Bpa Banda - Tre/Pikul Cost",
                category_code=TransactionCategory.P,
                status="pending",
                timestamp=datetime.utcnow(),
                sender="Field",
                receiver="Bapa Banda",
            )
            session.add(duplicate_tx)
            session.commit()
            session.refresh(duplicate_tx)
            # 2. Run detection
            triggers = detect_forensic_triggers(duplicate_tx, session)
            with open("fuzzy_result.txt", "w") as f:
                if triggers:
                    f.write(f"SUCCESS: {triggers}\n")
                else:
                    f.write("FAILURE: No triggers.\n")
    except Exception as e:
        with open("fuzzy_result.txt", "w") as f:
            f.write(f"Error: {e}\n")


if __name__ == "__main__":
    asyncio.run(run_test())
