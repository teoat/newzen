
from sqlmodel import Session, select
from app.core.db import engine
from app.models import Entity, Transaction, CorporateRelationship, Asset

def scan_ghost_entities():
    """
    Scans the database for 'Ghost Entities' - entities with no connections 
    to transactions, assets, or other corporate structures.
    These clutter the graph and should be archived.
    """
    with Session(engine) as session:
        # Fetch all entities
        entities = session.exec(select(Entity)).all()
        ghosts = []

        print(f"Scanning {len(entities)} entities for isolation...")

        for entity in entities:
            # Check 1: Transactions (Sender or Receiver)
            tx_count = session.exec(
                select(Transaction).where(
                    (Transaction.sender_entity_id == entity.id) | 
                    (Transaction.receiver_entity_id == entity.id)
                )
            ).first()
            
            if tx_count:
            
                continue

            # Check 2: Assets
            asset_count = session.exec(
                select(Asset).where(Asset.owner_entity_id == entity.id)
            ).first()

            if asset_count:

                continue

            # Check 3: Corporate Relationships (Parent or Child)
            rel_count = session.exec(
                select(CorporateRelationship).where(
                    (CorporateRelationship.parent_entity_id == entity.id) | 
                    (CorporateRelationship.child_entity_id == entity.id)
                )
            ).first()

            if rel_count:

                continue

            # If we reach here, it's a ghost
            ghosts.append(entity)

        if ghosts:

            print(f"[WARN] Found {len(ghosts)} Ghost Entities:")
            for g in ghosts:
                print(f" - {g.name} ({g.type}) ID: {g.id}")
        else:
            print("[PASS] No Ghost Entities found. Integrity high.")

if __name__ == "__main__":

    scan_ghost_entities()
