from datetime import date, datetime
from typing import List, Optional
from pydantic import Field
from app.schemas.core import CoreModel

# ── Summary KPIs ──

class AppointmentSummary(CoreModel):
    total_today: int
    scheduled: int
    checked_in: int
    in_progress: int
    completed: int
    cancelled: int
    no_show: int
    no_show_rate_today: float
    no_show_rate_yesterday: float
    progress_percent: float

class WaitlistSnapshot(CoreModel):
    total_waiting: int
    emergency_waiting: int
    urgent_waiting: int
    standard_waiting: int
    avg_wait_minutes: float

class ProviderSummary(CoreModel):
    total_active: int
    available: int
    busy: int
    on_leave: int

class DashboardAlert(CoreModel):
    type: str # 'emergency_waitlist', 'pending_time_off', 'capacity_conflict', 'failed_notifications'
    severity: str # 'high', 'medium', 'low'
    title: str
    message: str
    action_label: Optional[str] = None
    action_url: Optional[str] = None

class DashboardTrends(CoreModel):
    bookings_vs_yesterday_pct: float
    completed_vs_yesterday_pct: float
    waitlist_vs_24h_ago: int

class DashboardSummaryResponse(CoreModel):
    date: date
    appointments: AppointmentSummary
    waitlist: WaitlistSnapshot
    providers: ProviderSummary
    alerts: List[DashboardAlert]
    trends: DashboardTrends

# ── Provider Utilisation ──

class ProviderUtilisation(CoreModel):
    id: str
    name: str
    specialization: str
    status: str
    booked_today: int
    max_daily_appointments: int
    utilisation_percent: float
    remaining_slots: int

class ProviderUtilisationResponse(CoreModel):
    providers: List[ProviderUtilisation]

# ── Analytics & Charts ──

class HourlyHeatmapData(CoreModel):
    day_of_week: int # 0=Mon, 6=Sun
    hour: int # 0-23
    count: int

class HourlyHeatmapResponse(CoreModel):
    data: List[HourlyHeatmapData]

class ServiceDemand(CoreModel):
    service_id: str
    service_name: str
    count: int
    percent: float

class ServiceDemandResponse(CoreModel):
    services: List[ServiceDemand]

class DailyTrend(CoreModel):
    date: date
    total: int
    no_show: int
    cancelled: int
    no_show_rate: float
    cancellation_rate: float

class NoShowTrendResponse(CoreModel):
    days: List[DailyTrend]
    averages: dict # {no_show_rate: float, cancellation_rate: float, ...}
