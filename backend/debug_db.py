import sys
import os

sys.path.append(os.getcwd())
try:
    from app.core.db import engine
    from sqlmodel import SQLModel

    print("Imports OK")
    SQLModel.metadata.drop_all(engine)
    print("Dropped OK")
    SQLModel.metadata.create_all(engine)
    print("Created OK")
except Exception as e:
    print(f"Error: {e}")
