import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.service import Service
from app.models.specialization import Specialization
from app.schemas.service import ServiceCreate
from app.crud.crud_service import service as service_crud

SERVICES = [
    {
        "name": "General Consultation",
        "description": "Standard medical checkup and health assessment.",
        "category": "Consultation",
        "duration_minutes": 20,
        "buffer_time_minutes": 5,
        "fee": 50.00,
        "billing_code": "CONS-GEN",
        "specialization_name": "General Practice"
    },
    {
        "name": "Cardiology Consultation",
        "description": "Heart health assessment and specialist consultation.",
        "category": "Specialist",
        "duration_minutes": 30,
        "buffer_time_minutes": 10,
        "fee": 150.00,
        "billing_code": "CONS-CARD",
        "specialization_name": "Cardiology"
    },
    {
        "name": "Blood Pressure Monitoring",
        "description": "Continuous monitoring and analysis of BP levels.",
        "category": "Diagnostic",
        "duration_minutes": 15,
        "buffer_time_minutes": 0,
        "fee": 30.00,
        "billing_code": "DIAG-BP",
        "specialization_name": "Cardiology"
    },
    {
        "name": "Pediatric Checkup",
        "description": "General health check for children and infants.",
        "category": "Pediatrics",
        "duration_minutes": 25,
        "buffer_time_minutes": 5,
        "fee": 60.00,
        "billing_code": "PEDS-CHECK",
        "specialization_name": "Pediatrics"
    }
]

def seed_services(db: Session):
    print("Seeding clinical services...")
    count = 0
    for service_data in SERVICES:
        # Resolve specialization
        spec_name = service_data.pop("specialization_name", None)
        spec_id = None
        if spec_name:
            spec = db.query(Specialization).filter(Specialization.name == spec_name).first()
            if spec:
                spec_id = spec.id
            else:
                print(f"Warning: Specialization '{spec_name}' not found for service '{service_data['name']}'")

        service_data["required_specialization_id"] = spec_id
        
        # Check if exists
        existing = db.query(Service).filter(Service.name == service_data["name"]).first()
        if not existing:
            service_in = ServiceCreate(**service_data)
            service_crud.create(db, obj_in=service_in)
            print(f"Added: {service_data['name']}")
            count += 1
        else:
            print(f"Skipping (already exists): {service_data['name']}")
    
    print(f"Seeding complete. {count} services added.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_services(db)
    finally:
        db.close()
