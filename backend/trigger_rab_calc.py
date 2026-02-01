
from sqlmodel import Session, create_engine
from app.modules.forensic.rab_service import RABService
from app.core.config import settings
import asyncio

async def run_calc():
    engine = create_engine(settings.DATABASE_URL)
    with Session(engine) as session:
        service = RABService(session)
        result = await service.recalculate_variance("ZENITH-DEMO-001")
        print(f"Recalculation Result: {result}")

if __name__ == "__main__":
    asyncio.run(run_calc())
