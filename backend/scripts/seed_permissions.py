import sys
import os

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.role import Role, Permission, role_permissions

def seed_permissions():
    db: Session = SessionLocal()
    try:
        # 1. Define all permissions
        permissions_data = [
            # Patient Management
            {"name": "patient:create", "description": "Can register new patients"},
            {"name": "patient:read", "description": "Can view patient profiles by ID"},
            {"name": "patient:list", "description": "Can search and list all patients"},
            {"name": "patient:update", "description": "Can edit patient information"},
            {"name": "patient:delete", "description": "Can soft-delete patient records"},
            {"name": "patient:activate", "description": "Can restore deactivated patients"},
            # Appointment Management
            {"name": "appointment:create", "description": "Can book new appointments"},
            {"name": "appointment:read", "description": "Can view a specific appointment"},
            {"name": "appointment:list", "description": "Can list and filter appointments"},
            {"name": "appointment:status_update", "description": "Can transition appointment status (check-in, complete, cancel)"},
            # Waitlist Management
            {"name": "waitlist:create", "description": "Can add patients to the waitlist"},
            {"name": "waitlist:list", "description": "Can view the ordered waitlist"},
            {"name": "waitlist:delete", "description": "Can remove patients from the waitlist"},
        ]

        # 2. Bulk create permissions if they don't exist
        for p_data in permissions_data:
            existing = db.query(Permission).filter(Permission.name == p_data["name"]).first()
            if not existing:
                p = Permission(**p_data)
                db.add(p)
        db.commit()

        # 3. Get roles
        admin = db.query(Role).filter(Role.name == "admin").first()
        receptionist = db.query(Role).filter(Role.name == "receptionist").first()
        provider = db.query(Role).filter(Role.name == "provider").first()

        # 4. Map permissions to roles
        all_perms = db.query(Permission).all()
        perm_map = {p.name: p for p in all_perms}

        # Admin gets everything
        admin.permissions = all_perms
        
        # Receptionist permissions
        receptionist_perms = [
            # Full patient management
            "patient:create", "patient:read", "patient:list",
            "patient:update", "patient:delete", "patient:activate",
            # Full appointment management
            "appointment:create", "appointment:read", "appointment:list", "appointment:status_update",
            # Full waitlist management
            "waitlist:create", "waitlist:list", "waitlist:delete",
        ]
        receptionist.permissions = [perm_map[p] for p in receptionist_perms if p in perm_map]
        
        # Provider permissions (read-only + status updates on their own appointments)
        provider_perms = [
            "patient:read",
            "appointment:read", "appointment:list", "appointment:status_update",
            "waitlist:list",
        ]
        provider.permissions = [perm_map[p] for p in provider_perms if p in perm_map]

        db.commit()
        print("Successfully seeded permissions and role mappings!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding permissions: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_permissions()
