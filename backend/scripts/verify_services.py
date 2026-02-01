import asyncio
import sys
import os
from datetime import datetime, UTC
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.pool import StaticPool

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models import Transaction, Entity, EntityType, TransactionCategory
from app.services.network_service import NetworkService
from app.services.geocoding_service import GeocodingService

def setup_db():
    engine = create_engine(
        "sqlite:///:memory:", 
        connect_args={"check_same_thread": False}, 
        poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    return engine

def create_test_data(session: Session, project_id: str):
    # Entities
    alice = Entity(name="Alice", type=EntityType.PERSON, project_id=project_id, metadata_json={"address": "Jakarta, Indonesia"})
    bob = Entity(name="Bob", type=EntityType.COMPANY, project_id=project_id, metadata_json={"address": "Bandung, Indonesia"})
    charlie = Entity(name="Charlie", type=EntityType.PERSON, project_id=project_id, metadata_json={"address": "Surabaya, Indonesia"})
    
    session.add(alice)
    session.add(bob)
    session.add(charlie)
    session.commit() 
    
    # Transactions (Circular: Alice -> Bob -> Charlie -> Alice)
    t1 = Transaction(
        sender="Alice", receiver="Bob", amount=1000.0, 
        project_id=project_id, transaction_date=datetime.now(UTC),
        category_code=TransactionCategory.P
    )
    t2 = Transaction(
        sender="Bob", receiver="Charlie", amount=800.0, 
        project_id=project_id, transaction_date=datetime.now(UTC),
        category_code=TransactionCategory.V
    )
    t3 = Transaction(
        sender="Charlie", receiver="Alice", amount=500.0, 
        project_id=project_id, transaction_date=datetime.now(UTC),
        category_code=TransactionCategory.XP
    )
    
    session.add(t1)
    session.add(t2)
    session.add(t3)
    session.commit()

async def verify_network_service(session: Session, project_id: str):
    print("Testing NetworkService...")
    service = NetworkService(session) 
    
    # Build Network
    network = await service.build_network(project_id)
    print(f"  Nodes: {len(network['nodes'])}, Links: {len(network['links'])}")
    assert len(network['nodes']) == 3
    assert len(network['links']) == 3
    
    # Detect Cycles
    cycles = await service.detect_cycles(project_id)
    print(f"  Cycles found: {cycles['total_cycles']}")
    assert cycles['total_cycles'] > 0
    
    # Shortest Path
    path = await service.find_shortest_path(project_id, "Alice", "Charlie")
    print(f"  Shortest path Alice->Charlie: {path.get('path')}")
    assert path['path'] == ['Alice', 'Bob', 'Charlie']
    
    print("NetworkService Verified ✅")

async def verify_geocoding_service(session: Session, project_id: str):
    print("\nTesting GeocodingService...")
    service = GeocodingService(session)
    
    # Mocking external API calls would be ideal, but for now we rely on fallback or handling None
    # We can check if it runs without error
    
    geocoded = await service.geocode_entities(project_id)
    print(f"  Entities processed: {geocoded['stats']['total_entities']}")
    # Note: geocoding_rate might be 0 if no API key and Nominatim fails/rate-limits
    
    # Heatmap
    heatmap = await service.generate_heatmap_data(project_id)
    print(f"  Heatmap points: {len(heatmap['heatmap_points'])}")
    
    print("GeocodingService Verified ✅")

async def main():
    engine = setup_db()
    project_id = "test_project_123"
    
    with Session(engine) as session:
        create_test_data(session, project_id)
        
        await verify_network_service(session, project_id)
        await verify_geocoding_service(session, project_id)

if __name__ == "__main__":
    asyncio.run(main())
