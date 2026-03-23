import sys
import os
from datetime import datetime, timedelta, date

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.scheduling_service import scheduling_service, SchedulingException
from app.models.provider import Provider
from app.models.service import Service
from app.models.availability import Availability
from app.models.appointment import Appointment
from app.models.provider_time_off import ProviderTimeOff
from app.models.patient import Patient


# A mock session with custom query returns for testing
class MockQuery:
    def __init__(self, data):
        self.data = data
        self._filter = None
    
    def filter(self, *args, **kwargs):
        return self
        
    def first(self):
        return self.data[0] if self.data else None
        
    def scalar(self):
        return len(self.data)
        
    def all(self):
        return self.data
        
    def with_for_update(self):
        return self


class MockSession:
    def __init__(self, db_state):
        self.db_state = db_state

    def query(self, model):
        if model == Provider:
            return MockQuery(self.db_state.get('providers', []))
        elif model == Service:
            return MockQuery(self.db_state.get('services', []))
        elif model == Availability:
            return MockQuery(self.db_state.get('availability', []))
        elif model == Appointment:
            return MockQuery(self.db_state.get('appointments', []))
        elif model == ProviderTimeOff:
            return MockQuery(self.db_state.get('time_offs', []))
        elif hasattr(model, '__name__') and model.__name__ == 'count':
            # func.count
            return MockQuery(self.db_state.get('appointments', []))
        return MockQuery([])

def test_conflict_detection():
    print("Running scheduling conflict tests...")
    
    provider = Provider(id="prov-1", max_daily_appointments=8, status="available")
    
    # 1. Test Capacity Exceeded
    db_state = {
        'providers': [provider],
        'appointments': [Appointment() for _ in range(8)], # 8 active appointments
        'availability': [Availability(start_time=datetime.strptime("09:00", "%H:%M").time(), end_time=datetime.strptime("17:00", "%H:%M").time())],
        'time_offs': []
    }
    
    db = MockSession(db_state)
    target_start = datetime(2026, 3, 24, 10, 0)
    target_end = datetime(2026, 3, 24, 10, 30)
    
    try:
        scheduling_service.check_conflicts(db, provider_id="prov-1", target_start=target_start, target_end=target_end)
        assert False, "Should have raised capacity exceeded"
    except SchedulingException as e:
        assert e.conflict_type == "capacity_exceeded"
        
    # 2. Test Time Overlap
    apt = Appointment(appointment_start=datetime(2026, 3, 24, 9, 45), appointment_end=datetime(2026, 3, 24, 10, 15), status="scheduled")
    db_state['appointments'] = [apt]
    db = MockSession(db_state)
    try:
        scheduling_service.check_conflicts(db, provider_id="prov-1", target_start=target_start, target_end=target_end)
        assert False, "Should have raised time overlap"
    except SchedulingException as e:
        assert e.conflict_type == "time_overlap"

    print("Scheduling logic tests passed!")

if __name__ == "__main__":
    test_conflict_detection()
