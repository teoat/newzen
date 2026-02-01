#!/usr/bin/env python3
"""
Admin User Seeding Script for Zenith Platform
Creates default admin user if it doesn't exist
"""

import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from dotenv import load_dotenv
from app.core.db import get_session
from app.models import User
from app.core.security import get_password_hash as hash_password

load_dotenv()

def create_admin_user():
    """Create default admin user if not exists"""
    
    # Default admin credentials
    DEFAULT_ADMIN = {
        "username": "admin",
        "email": "admin@zenith.local",
        "password": "admin123",  # Change this in production!
        "full_name": "System Administrator",
        "is_active": True,
        "is_superuser": True
    }
    
    try:
        db = next(get_session())
        
        # Check if admin user already exists
        existing_admin = db.query(User).filter(
            (User.username == DEFAULT_ADMIN["username"]) | 
            (User.email == DEFAULT_ADMIN["email"])
        ).first()
        
        if existing_admin:
            print(f"✅ Admin user already exists: {existing_admin.username} ({existing_admin.email})")
            return True
        
        # Create new admin user
        admin_user = User(
            username=DEFAULT_ADMIN["username"],
            email=DEFAULT_ADMIN["email"],
            hashed_password=hash_password(DEFAULT_ADMIN["password"]),
            full_name=DEFAULT_ADMIN["full_name"],
            is_active=DEFAULT_ADMIN["is_active"],
            is_superuser=DEFAULT_ADMIN["is_superuser"]
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("✅ Successfully created admin user:")
        print(f"   Username: {admin_user.username}")
        print(f"   Email: {admin_user.email}")
        print(f"   ID: {admin_user.id}")
        print(f"   Superuser: {admin_user.is_superuser}")
        print("\n⚠️  IMPORTANT: Change the default password immediately!")
        print("   Current password: admin123")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        return False
    finally:
        if 'db' in locals():
            db.close()

def create_test_users():
    """Create additional test users for development"""
    
    TEST_USERS = [
        {
            "username": "analyst1",
            "email": "analyst1@zenith.local", 
            "password": "test123",
            "full_name": "Financial Analyst 1",
            "is_active": True,
            "is_superuser": False
        },
        {
            "username": "investigator1", 
            "email": "investigator1@zenith.local",
            "password": "test123",
            "full_name": "Lead Investigator",
            "is_active": True, 
            "is_superuser": False
        }
    ]
    
    try:
        db = next(get_session())
        created_count = 0
        
        for user_data in TEST_USERS:
            # Check if user already exists
            existing = db.query(User).filter(
                (User.username == user_data["username"]) |
                (User.email == user_data["email"])
            ).first()
            
            if existing:
                print(f"✅ Test user already exists: {existing.username}")
                continue
            
            # Create new user
            test_user = User(
                username=user_data["username"],
                email=user_data["email"], 
                hashed_password=hash_password(user_data["password"]),
                full_name=user_data["full_name"],
                is_active=user_data["is_active"],
                is_superuser=user_data["is_superuser"]
            )
            
            db.add(test_user)
            created_count += 1
            print(f"✅ Created test user: {test_user.username}")
        
        if created_count > 0:
            db.commit()
            print(f"\n✅ Created {created_count} test users")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating test users: {e}")
        return False
    finally:
        if 'db' in locals():
            db.close()

def list_users():
    """List all users in the database"""
    
    try:
        db = next(get_session())
        users = db.query(User).all()
        
        print(f"\n📋 Total Users: {len(users)}")
        print("-" * 60)
        print(f"{'ID':<5} {'Username':<15} {'Email':<25} {'Role':<12} {'Active':<7}")
        print("-" * 65)
        
        for user in users:
            print(f"{user.id[:5]:<5} {user.username:<15} {user.email:<25} {user.role:<12} {str(user.is_active):<7}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error listing users: {e}")
        return False
    finally:
        if 'db' in locals():
            db.close()

def reset_admin_password():
    """Reset admin password to default"""
    
    try:
        db = next(get_session())
        
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            print("❌ Admin user not found")
            return False
        
        admin.hashed_password = hash_password("admin123")
        db.commit()
        
        print("✅ Admin password reset to: admin123")
        print("⚠️  Change this password immediately!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error resetting password: {e}")
        return False
    finally:
        if 'db' in locals():
            db.close()

def main():
    """Main function"""
    
    if len(sys.argv) < 2:
        print("Usage: python seed_admin.py [command]")
        print("\nCommands:")
        print("  admin     - Create admin user")
        print("  test      - Create test users") 
        print("  all       - Create admin and test users")
        print("  list      - List all users")
        print("  reset     - Reset admin password")
        print("\nExamples:")
        print("  python seed_admin.py admin")
        print("  python seed_admin.py all")
        return
    
    command = sys.argv[1].lower()
    
    print("🔐 Zenith User Management Script")
    print("=" * 40)
    
    # Check database connection
    try:
        db = next(get_session())
        print("✅ Database connection established")
        db.close()
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return
    
    match command:
        case "admin":
            create_admin_user()
        case "test": 
            create_test_users()
        case "all":
            create_admin_user()
            create_test_users()
        case "list":
            list_users()
        case "reset":
            reset_admin_password()
        case _:
            print(f"❌ Unknown command: {command}")

if __name__ == "__main__":
    main()