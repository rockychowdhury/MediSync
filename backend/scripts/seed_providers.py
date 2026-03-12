import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.models.provider import Provider
from app.models.role import Role
from app.models.specialization import Specialization
from app.core.security import get_password_hash

def seed_providers(db: Session):
    print("Seeding initial clinical providers...")
    
    # 1. Ensure Provider Role exists
    role = db.query(Role).filter(Role.name == "provider").first()
    if not role:
        print("Error: 'provider' role not found. Please run seed_permissions.py first.")
        return
    
    # 2. Test Provider Data
    providers_to_seed = [
        {
            "name": "Dr. Heart",
            "email": "dr.heart@medisync.com",
            "specialization_name": "Cardiology",
            "fee": 100.00
        },
        {
            "name": "Dr. Kidney",
            "email": "dr.kidney@medisync.com",
            "specialization_name": "Nephrology",
            "fee": 120.00
        }
    ]

    for p_data in providers_to_seed:
        # Resolve Specialization
        spec = db.query(Specialization).filter(Specialization.name == p_data["specialization_name"]).first()
        if not spec:
            print(f"Warning: Specialization '{p_data['specialization_name']}' not found for {p_data['name']}")
            continue

        # Create User if not exists
        user = db.query(User).filter(User.email == p_data["email"]).first()
        if not user:
            user = User(
                name=p_data["name"],
                email=p_data["email"],
                password_hash=get_password_hash("password123"),
                role_id=role.id,
                is_active=True
            )
            db.add(user)
            db.flush()
            print(f"User created: {p_data['email']}")
        
        # Create Provider profile if not exists
        provider = db.query(Provider).filter(Provider.id == user.id).first()
        if not provider:
            provider = Provider(
                id=user.id,
                specialization_id=spec.id,
                consultation_fee=p_data["fee"],
                status="available"
            )
            db.add(provider)
            print(f"Provider profile created for: {p_data['email']}")
        else:
            print(f"Provider profile already exists for: {p_data['email']}")
            
    db.commit()
    print("Provider seeding complete.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_providers(db)
    finally:
        db.close()
