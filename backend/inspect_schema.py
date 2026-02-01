
from sqlalchemy import inspect
from app.core.db import engine
from app.models import Transaction

def inspect_schema():
    print("🔎 INSPECTING DB SCHEMA vs MODEL")
    
    inspector = inspect(engine)
    db_columns = [c['name'] for c in inspector.get_columns("transaction")]
    print(f"DB Columns ({len(db_columns)}): {db_columns}")
    
    model_fields = Transaction.__fields__.keys()
    print(f"Model Fields: {list(model_fields)}")
    
    missing = [f for f in model_fields if f not in db_columns]
    print(f"⚠️ MISSING IN DB: {missing}")
    
    # Also check if there are columns in DB but not in model (less critical usually)
    extra = [c for c in db_columns if c not in model_fields]
    print(f"ℹ️ EXTRA IN DB: {extra}")

if __name__ == "__main__":
    inspect_schema()
