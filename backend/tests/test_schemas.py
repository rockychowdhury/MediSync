from app.schemas.user import UserCreate
from app.schemas.service import ServiceCreate
from pydantic import ValidationError

def run_tests():
    print("Running schema validation tests...")

    # Test 1: Whitespace is stripped
    print("\n--- Test 1: Whitespace Stripping ---")
    user_data_dirty = {
        "name": "   Dr. John Doe   ",
        "email": "  john.doe@example.com  ",
        "password": " securepassword123 ",
        "role_id": 2
    }
    
    user = UserCreate(**user_data_dirty)
    print(f"Original name: '{user_data_dirty['name']}' -> Cleaned name: '{user.name}'")
    print(f"Original email: '{user_data_dirty['email']}' -> Cleaned email: '{user.email}'")
    assert user.name == "Dr. John Doe"
    assert user.email == "john.doe@example.com"
    print("✅ Whitespace stripping works.")

    # Test 2: XSS rejection
    print("\n--- Test 2: Anti-XSS Validation ---")
    service_data_xss = {
        "name": "General Checkup",
        "description": "A basic checkup <script>alert('XSS')</script>",
        "duration_minutes": 30,
        "buffer_time_minutes": 5,
        "fee": 100.00
    }
    
    try:
        ServiceCreate(**service_data_xss)
        print("❌ FAILED: XSS payload was NOT rejected!")
    except ValidationError as e:
        print("✅ SUCCESS: XSS payload was rejected.")
        print("Error details:")
        print(e)
        
    print("\nAll tests finished.")

if __name__ == "__main__":
    run_tests()
