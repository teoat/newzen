import sys
import os

# Ensure backend root is in path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(current_dir)
if backend_root not in sys.path:
    sys.path.append(backend_root)

from datetime import datetime  # noqa: E402
from sqlmodel import Session, select  # noqa: E402
from app.core.db import engine  # noqa: E402
from app.models import User, Project, UserProjectAccess, ProjectRole  # noqa: E402
from app.core.auth_utils import get_password_hash  # noqa: E402

def seed_initial():
    print("Seeding core user and project...")
    with Session(engine) as session:
        # 1. Create User 'admin'
        admin = session.exec(select(User).where(User.username == "admin")).first()
        if not admin:
            print("Creating 'admin' user...")
            admin = User(
                username="admin",
                full_name="Chief Investigator",
                email="admin@zenith.ai",
                hashed_password=get_password_hash("zenith"),
                role="admin",
            )
            session.add(admin)
            session.commit()
            session.refresh(admin)
        else:
            print("'admin' user already exists.")

        # 2. Create Project 'Horizon'
        project = session.exec(select(Project).where(Project.code == "PRJ-HZN-001")).first()
        if not project:
            print("Creating 'Project Horizon'...")
            project = Project(
                name="Project Horizon Lab",
                code="PRJ-HZN-001",
                contract_value=1250000000.0, # 1.25B
                start_date=datetime(2024, 1, 1),
                contractor_name="PT Global Infrastructure",
                status="audit_mode",
                site_location="Jakarta, ID"
            )
            session.add(project)
            session.commit()
            session.refresh(project)
        else:
            print("'Project Horizon' already exists.")

        # 3. Associate Admin with Project
        access = session.exec(
            select(UserProjectAccess)
            .where(UserProjectAccess.user_id == admin.id)
            .where(UserProjectAccess.project_id == project.id)
        ).first()
        if not access:
            print(f"Granting 'admin' access to '{project.name}'...")
            access = UserProjectAccess(
                user_id=admin.id,
                project_id=project.id,
                role=ProjectRole.ADMIN
            )
            session.add(access)
            session.commit()
        else:
            print("'admin' already has access to Project Horizon.")

    print("Initial seed complete.")

if __name__ == "__main__":
    seed_initial()
