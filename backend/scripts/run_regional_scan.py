import sys
import os

# Ensure backend root is in path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(current_dir)
if backend_root not in sys.path:
    sys.path.append(backend_root)

from sqlmodel import Session  # noqa: E402
from app.core.db import engine  # noqa: E402
from app.modules.fraud.geo_link_service import GeoLinkService  # noqa: E402

def run_regional_scan():
    project_id = "1cc13677-8a9b-43cd-9e10-8b08796cffb1"
    print(f"🕵️ Initiating Regional Risk Scan for Project ID: {project_id}...")
    
    with Session(engine) as session:
        service = GeoLinkService(session)
        
        # Scan for distant vendors (> 100km)
        alerts = service.get_distance_alerts(max_distance_km=100.0, limit=100, project_id=project_id)
        
        print("\n" + "="*80)
        print(f"{'ENTITY':<30} | {'LOCATION':<15} | {'DISTANCE':<10} | {'AMOUNT'}")
        print("-" * 80)
        
        for alert in alerts:
            # We need to find the entity location to show it in report
            from app.models import Entity
            from sqlmodel import select
            session.exec(select(Entity).where(Entity.name == alert['receiver'])).first()
            loc = "OFFSHORE" if alert['distance_km'] > 1000 else "REGIONAL"
            
            print(f"{alert['receiver']:<30} | {loc:<15} | {alert['distance_km']:>7} KM | Rp {alert['amount']:,.2f}")
            
        print("="*80)
        print(f"🔎 Scan Complete: {len(alerts)} anomalies detected across Indonesia.")

if __name__ == "__main__":
    run_regional_scan()
