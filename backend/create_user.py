from sqlmodel import Session, select
from app.core.db import engine
from app.models import User
from app.core.auth_utils import get_password_hash


def reset_admin_user():
    with Session(engine) as session:
        # Delete existing admin if any
        statement = select(User).where(User.username == "admin")
        user = session.exec(statement).first()
        if user:
            print("Deleting existing 'admin' user...")
            session.delete(user)
            session.commit()
        # Create fresh admin
        print("Creating fresh 'admin' user...")
        # Hash 'zenith' just so it works via normal path too if bypass fails
        hashed_pwd = get_password_hash("zenith")
        new_user = User(
            username="admin",
            email="admin@zenith.forensic",
            full_name="Chief Investigator",
            hashed_password=hashed_pwd,
            role="admin",
        )
        session.add(new_user)
        session.commit()
        print("User 'admin' recreated successfully.")
        print("Credentials:")
        print("  Investigator ID: admin")
        print("  Access Key: zenith")


if __name__ == "__main__":
    reset_admin_user()
