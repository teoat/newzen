
"""
Nurse Agent (Micro-Agent).
Polls the Data Hospital for 'new' patients and attempts to heal them.
"""
import asyncio
from sqlmodel import Session, select
from app.core.db import engine
from app.models import QuarantineRow
from app.modules.ingestion.data_hospital import DataHospital

class NurseAgent:
    def __init__(self, check_interval: int = 60):
        self.check_interval = check_interval

    async def run_forever(self):
        print("🚑 Nurse Agent started. Patrolling the wards...")
        while True:
            try:
                with Session(engine) as db:
                    # Find 'new' patients
                    patients = db.exec(
                        select(QuarantineRow)
                        .where(QuarantineRow.status == "new")
                        .limit(10)
                    ).all()
                    
                    if not patients:
                        # No emergencies, check again later
                        pass
                    else:
                        print(f"   🚑 Found {len(patients)} injured rows. Beginning triage...")
                        hospital = DataHospital(db)
                        for p in patients:
                            await hospital.shift_rounds(p)
                            
            except Exception as e:
                print(f"   ❌ Nurse Agent Error: {e}")
            
            await asyncio.sleep(self.check_interval)

if __name__ == "__main__":
    nurse = NurseAgent(check_interval=5)
    asyncio.run(nurse.run_forever())
