
import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path('/Users/Arief/Newzen/zenith-lite/backend')
sys.path.insert(0, str(backend_path))

from sqlmodel import Session, select
from app.core.db import engine
from app.models import Project, User, UserProjectAccess
from sqlalchemy import func

def debug_project_list():
    print("--- Debugging Project List ---")
    with Session(engine) as db:
        # 1. Get a user
        user = db.exec(select(User)).first()
        if not user:
            print("No users found in database.")
            return
        print(f"Testing for user: {user.username} (ID: {user.id})")

        # 2. Check UserProjectAccess
        access_query = select(UserProjectAccess).where(UserProjectAccess.user_id == user.id)
        access_records = db.exec(access_query).all()
        print(f"Found {len(access_records)} access records for user {user.id}")
        
        project_ids = []
        for access in access_records:
            print(f" Checking project_id: {access.project_id}")
            p_check = db.get(Project, access.project_id)
            if p_check:
                print(f"  ✅ Project exists: {p_check.name}")
                project_ids.append(access.project_id)
            else:
                print(f"  ❌ Project ID {access.project_id} NOT FOUND in Project table!")

        print(f"Valid authorized project IDs: {project_ids}")


        if not project_ids:
            print("User has no projects.")
            return

        # 3. Check ALL Projects (Health Check)
        print("Fetching ALL projects from table (count only)...")
        try:
            count = db.exec(select(func.count(Project.id))).one()
            print(f"Total projects: {count}")
            
            print("Fetching projects (ID and Name only)...")
            from sqlalchemy import text
            result = db.execute(text("SELECT id, name FROM project")).all()
            print(f"Successfully fetched {len(result)} project IDs and Names.")
            
            print("Fetching full Project objects (SQLModel)...")
            all_projects = db.exec(select(Project)).all()
            print(f"Successfully fetched {len(all_projects)} full project objects.")
        except Exception as e:
            print(f"CRITICAL: Error reading Project table: {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    debug_project_list()
