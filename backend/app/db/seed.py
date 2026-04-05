import os
import logging
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from urllib.parse import urlparse, parse_qsl
from dotenv import load_dotenv

from app import models, crud, schemas
from app.core.security import get_password_hash

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in environment")

# Custom engine for seeding (handling Neon requirements if necessary)
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_data(db: Session) -> None:
    # 1. Seed Permissions
    permissions_data = [
        {"name": "users:read", "description": "View user profiles."},
        {"name": "users:manage", "description": "Create, update, or delete users."},
        {"name": "roles:read", "description": "View roles and their permissions."},
        {"name": "roles:manage", "description": "Modify role-permission assignments."},
        {"name": "patients:read", "description": "View patient records."},
        {"name": "patients:manage", "description": "Create or update patient records."},
        {"name": "appointments:read", "description": "View appointment schedules."},
        {"name": "appointments:manage", "description": "Book or modify appointments."},
        {"name": "providers:read", "description": "View healthcare provider details."},
        {"name": "providers:manage", "description": "Manage provider schedules and services."},
        {"name": "dashboard:read", "description": "View the administrative overview dashboard."},
    ]
    
    db_permissions = {}
    for perm_data in permissions_data:
        perm = db.query(models.Permission).filter(models.Permission.name == perm_data["name"]).first()
        if not perm:
            logger.info(f"Creating permission: {perm_data['name']}")
            perm = models.Permission(**perm_data)
            db.add(perm)
            db.commit()
            db.refresh(perm)
        db_permissions[perm_data["name"]] = perm

    # 2. Seed Roles and assign permissions
    roles_config = {
        "admin": {
            "description": "System administrator with full access.",
            "permissions": list(db_permissions.keys())
        },
        "receptionist": {
            "description": "Staff responsible for appointments and patients.",
            "permissions": ["users:read", "patients:read", "patients:manage", "appointments:read", "appointments:manage", "providers:read"]
        },
        "provider": {
            "description": "Healthcare providers (Doctors, Nurses).",
            "permissions": ["patients:read", "appointments:read", "appointments:manage", "providers:read"]
        },
    }
    
    for role_name, config in roles_config.items():
        role = db.query(models.Role).filter(models.Role.name == role_name).first()
        if not role:
            logger.info(f"Creating role: {role_name}")
            role = models.Role(name=role_name, description=config["description"])
            db.add(role)
            db.commit()
            db.refresh(role)
        
        # Sync permissions
        current_perms = {p.name for p in role.permissions}
        target_perms = set(config["permissions"])
        
        perms_to_add = target_perms - current_perms
        for p_name in perms_to_add:
            role.permissions.append(db_permissions[p_name])
            
        if perms_to_add:
            logger.info(f"Added {len(perms_to_add)} permissions to role {role_name}")
            db.add(role)
            db.commit()

    # 3. Create initial Admin User from Env or prompt (No hardcoding)
    admin_email = os.getenv("INIT_ADMIN_EMAIL")
    admin_password = os.getenv("INIT_ADMIN_PASSWORD")
    
    if not admin_email or not admin_password:
        logger.warning("INIT_ADMIN_EMAIL or INIT_ADMIN_PASSWORD not set. Skipping admin creation.")
        return

    admin_user = db.query(models.User).filter(models.User.email == admin_email).first()
    if not admin_user:
        logger.info(f"Creating initial admin user: {admin_email}")
        admin_role = db.query(models.Role).filter(models.Role.name == "admin").first()
        
        from app.crud.crud_user import user as user_crud
        user_in = schemas.UserCreate(
            name="System Admin",
            email=admin_email,
            password=admin_password,
            role_id=admin_role.id
        )
        user_crud.create(db, obj_in=user_in)
    else:
        logger.info(f"Admin user already exists: {admin_email}")

def main() -> None:
    logger.info("Initializing database seeding...")
    db = SessionLocal()
    try:
        seed_data(db)
        logger.info("Database seeding completed.")
    except Exception as e:
        logger.error(f"Error during seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
