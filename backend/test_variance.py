
from sqlmodel import Session, create_engine
from app.modules.forensic.rab_service import RABService
from app.core.config import settings

def test_variance():
    engine = create_engine(settings.DATABASE_URL)
    with Session(engine) as session:
        service = RABService(session)
        try:
            result = service.get_variance_analysis("ZENITH-DEMO-001")
            print(result)
        except Exception:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_variance()
