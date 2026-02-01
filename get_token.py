
import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path('/Users/Arief/Newzen/zenith-lite/backend')
sys.path.insert(0, str(backend_path))

from sqlmodel import Session, select
from app.core.db import engine
from app.models import User
from app.core.security import create_access_token

def get_admin_token():
    with Session(engine) as db:
        user = db.exec(select(User).where(User.username == "admin")).first()
        if not user:
            print("Admin user not found")
            return
        
        token = create_access_token({"sub": user.id})
        print(token)

if __name__ == "__main__":
    get_admin_token()
