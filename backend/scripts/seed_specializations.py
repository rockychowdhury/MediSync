import sys
from pathlib import Path

# Add the parent directory to the path so we can import 'app'
sys.path.append(str(Path(__file__).resolve().parent.parent))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.specialization import Specialization
from app import crud
from app.schemas.specialization import SpecializationCreate

SPECIALIZATIONS = [
    {"name": "Cardiology", "description": "Focuses on disorders of the heart and the circulatory system."},
    {"name": "Dermatology", "description": "Deals with the skin, nails, hair and its diseases."},
    {"name": "Emergency Medicine", "description": "Focuses on the immediate decision making and action necessary to prevent death or any further disability."},
    {"name": "Endocrinology", "description": "Deals with the endocrine system, its diseases, and its specific secretions known as hormones."},
    {"name": "Gastroenterology", "description": "Focuses on the digestive system and its disorders."},
    {"name": "General Surgery", "description": "Focuses on abdominal contents including esophagus, stomach, small intestine, large intestine, liver, pancreas, gallbladder, etc."},
    {"name": "Geriatrics", "description": "Focuses on health care of elderly people."},
    {"name": "Hematology", "description": "Deals with the cause, prognosis, treatment, and prevention of diseases related to blood."},
    {"name": "Infectious Disease", "description": "Deals with the diagnosis and management of infections."},
    {"name": "Internal Medicine", "description": "Deals with the prevention, diagnosis, and treatment of internal diseases."},
    {"name": "Nephrology", "description": "Focuses on the function and diseases of the kidney."},
    {"name": "Neurology", "description": "Deals with disorders of the nervous system."},
    {"name": "Obstetrics & Gynecology (OB/GYN)", "description": "Focuses on female reproductive systems and the care of women during pregnancy and childbirth."},
    {"name": "Oncology", "description": "Focuses on the prevention, diagnosis, and treatment of cancer."},
    {"name": "Ophthalmology", "description": "Deals with the diagnosis and treatment of eye disorders."},
    {"name": "Orthopedic Surgery", "description": "Focuses on conditions involving the musculoskeletal system."},
    {"name": "Otolaryngology (ENT)", "description": "Focuses on the ears, nose, and throat."},
    {"name": "Pediatrics", "description": "Focuses on the medical care of infants, children, and adolescents."},
    {"name": "Physical Medicine & Rehabilitation", "description": "Aims to enhance and restore functional ability and quality of life to people with physical impairments or disabilities."},
    {"name": "Psychiatry", "description": "Focuses on the diagnosis, treatment and prevention of mental, emotional and behavioral disorders."},
    {"name": "Pulmonology", "description": "Focuses on the health of the respiratory system."},
    {"name": "Radiology", "description": "Use medical imaging to diagnose and treat diseases seen within the body."},
    {"name": "Rheumatology", "description": "Deals with the diagnosis and therapy of rheumatic diseases."},
    {"name": "Urology", "description": "Focuses on surgical and medical diseases of the male and female urinary-tract system and the male reproductive organs."}
]

def seed_specializations(db: Session):
    import os
    print(f"DEBUG: SQLALCHEMY_DATABASE_URL: {os.getenv('SQLALCHEMY_DATABASE_URL')}")
    print("Seeding clinical specializations...")
    count = 0
    for spec_data in SPECIALIZATIONS:
        # Check if exists
        existing = db.query(Specialization).filter(Specialization.name == spec_data["name"]).first()
        if not existing:
            # Import crud here to avoid circular imports if any
            from app.crud.crud_specialization import specialization as spec_crud
            spec_create = SpecializationCreate(**spec_data)
            db_obj = spec_crud.create(db, obj_in=spec_create)
            print(f"Added successfully: {db_obj.name} (ID: {db_obj.id})")
            count += 1
        else:
            print(f"Skipping (already exists): {spec_data['name']}")
    
    print(f"Seeding complete. {count} specializations added.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_specializations(db)
    finally:
        db.close()
