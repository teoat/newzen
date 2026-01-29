import sys
import os

# Ensure backend root is in path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(current_dir)
if backend_root not in sys.path:
    sys.path.append(backend_root)

from sqlmodel import Session, select  # noqa: E402
from app.core.db import engine  # noqa: E402
from app.models import User, Project, UserProjectAccess, ProjectRole  # noqa: E402


def seed_access():
    print("Seeding initial project access...")
    with Session(engine) as session:
        users = session.exec(select(User)).all()
        projects = session.exec(select(Project)).all()
        print(f"Found {len(users)} users and {len(projects)} projects.")
        count = 0
        for user in users:
            for project in projects:
                # Check if exists
                existing = session.exec(
                    select(UserProjectAccess)
                    .where(UserProjectAccess.user_id == user.id)
                    .where(UserProjectAccess.project_id == project.id)
                ).first()
                if not existing:
                    access = UserProjectAccess(
                        user_id=user.id,
                        project_id=project.id,
                        role=ProjectRole.ADMIN,  # Grant Admin to all existing
                    )
                    session.add(access)
                    count += 1
        session.commit()
        print(f"Granted access for {count} user-project pairs.")


if __name__ == "__main__":
    seed_access()
