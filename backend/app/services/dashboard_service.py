from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional
from sqlalchemy import func, case, extract, and_, or_
from sqlalchemy.orm import Session

from app.models.appointment import Appointment
from app.models.waitlist import Waitlist
from app.models.provider import Provider
from app.models.service import Service
from app.models.user import User
from app.models.notification import Notification
from app.models.provider_time_off import ProviderTimeOff

class DashboardService:
    def get_summary(self, db: Session) -> Dict[str, Any]:
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        # 1. Appointment KPIs
        appt_counts_today = db.query(
            Appointment.status, func.count(Appointment.id)
        ).filter(func.date(Appointment.appointment_start) == today).group_by(Appointment.status).all()
        
        counts = {status: count for status, count in appt_counts_today}
        total_today = sum(counts.values())
        
        # Trends
        total_yesterday = db.query(func.count(Appointment.id)).filter(
            func.date(Appointment.appointment_start) == yesterday
        ).scalar() or 0
        
        completed_yesterday = db.query(func.count(Appointment.id)).filter(
            func.date(Appointment.appointment_start) == yesterday,
            Appointment.status == "completed"
        ).scalar() or 0
        
        no_show_yesterday = db.query(func.count(Appointment.id)).filter(
            func.date(Appointment.appointment_start) == yesterday,
            Appointment.status == "no_show"
        ).scalar() or 0
        
        no_show_rate_today = (counts.get("no_show", 0) / total_today * 100) if total_today > 0 else 0
        no_show_rate_yesterday = (no_show_yesterday / total_yesterday * 100) if total_yesterday > 0 else 0
        
        progress_percent = ((counts.get("completed", 0) + counts.get("in_progress", 0)) / total_today * 100) if total_today > 0 else 0
        
        # 2. Waitlist Snapshot
        waitlist_counts = db.query(
            Waitlist.priority, func.count(Waitlist.id)
        ).filter(Waitlist.status == "waiting").group_by(Waitlist.priority).all()
        
        w_counts = {p: c for p, c in waitlist_counts}
        total_waiting = sum(w_counts.values())
        
        waitlist_24h_ago = db.query(func.count(Waitlist.id)).filter(
            Waitlist.status == "waiting",
            Waitlist.created_at <= datetime.now() - timedelta(days=1)
        ).scalar() or 0
        
        # 3. Provider Summary
        provider_statuses = db.query(
            Provider.status, func.count(Provider.id)
        ).filter(Provider.is_active == True).group_by(Provider.status).all()
        
        p_counts = {s: c for s, c in provider_statuses}
        
        # 4. Alerts (derived clinical rules)
        alerts = []
        
        # Emergency Waitlist Alert
        emergency_count = w_counts.get("emergency", 0)
        if emergency_count > 0:
            alerts.append({
                "type": "emergency_waitlist",
                "severity": "high",
                "title": "Emergency Waitlist Alert",
                "message": f"{emergency_count} emergency patient(s) waiting without a slot.",
                "action_label": "View Waitlist",
                "action_url": "/dashboard/admin/waitlist"
            })
            
        # Pending Time-Off Alert
        pending_time_off = db.query(func.count(ProviderTimeOff.id)).filter(
            ProviderTimeOff.status == "pending"
        ).scalar() or 0
        if pending_time_off > 0:
            alerts.append({
                "type": "pending_time_off",
                "severity": "medium",
                "title": "Time-Off Requests",
                "message": f"{pending_time_off} pending time-off request(s) awaiting approval.",
                "action_label": "Review Requests",
                "action_url": "/dashboard/admin/providers"
            })
            
        # Failed Notifications Alert
        failed_notifs = db.query(func.count(Notification.id)).filter(
            Notification.status == "failed",
            Notification.created_at >= datetime.now() - timedelta(hours=2)
        ).scalar() or 0
        if failed_notifs >= 3:
            alerts.append({
                "type": "failed_notifications",
                "severity": "medium",
                "title": "Notification Errors",
                "message": f"{failed_notifs} appointment reminders failed in the last 2 hours.",
                "action_label": "View Logs",
                "action_url": "/dashboard/admin/audit"
            })

        return {
            "date": today,
            "appointments": {
                "total_today": total_today,
                "scheduled": counts.get("scheduled", 0),
                "checked_in": counts.get("checked_in", 0),
                "in_progress": counts.get("in_progress", 0),
                "completed": counts.get("completed", 0),
                "cancelled": counts.get("cancelled", 0),
                "no_show": counts.get("no_show", 0),
                "no_show_rate_today": round(no_show_rate_today, 1),
                "no_show_rate_yesterday": round(no_show_rate_yesterday, 1),
                "progress_percent": round(progress_percent, 1)
            },
            "waitlist": {
                "total_waiting": total_waiting,
                "emergency_waiting": w_counts.get("emergency", 0),
                "urgent_waiting": w_counts.get("urgent", 0),
                "standard_waiting": w_counts.get("standard", 0),
                "avg_wait_minutes": 23 # Placeholder until calculation logic is added
            },
            "providers": {
                "total_active": sum(p_counts.values()),
                "available": p_counts.get("available", 0),
                "busy": p_counts.get("busy", 0),
                "on_leave": p_counts.get("on_leave", 0)
            },
            "alerts": alerts,
            "trends": {
                "bookings_vs_yesterday_pct": round(((total_today - total_yesterday) / total_yesterday * 100) if total_yesterday > 0 else 0, 1),
                "completed_vs_yesterday_pct": round(((counts.get("completed", 0) - completed_yesterday) / completed_yesterday * 100) if completed_yesterday > 0 else 0, 1),
                "waitlist_vs_24h_ago": total_waiting - waitlist_24h_ago
            }
        }

    def get_provider_utilisation(self, db: Session) -> Dict[str, Any]:
        today = date.today()
        providers = db.query(Provider).filter(Provider.is_active == True).all()
        
        res = []
        for p in providers:
            booked = db.query(func.count(Appointment.id)).filter(
                Appointment.provider_id == p.id,
                func.date(Appointment.appointment_start) == today,
                Appointment.status != "cancelled"
            ).scalar() or 0
            
            max_appts = p.max_daily_appointments or 8
            util_pct = (booked / max_appts * 100)
            
            res.append({
                "id": p.id,
                "name": p.user.full_name or p.user.name,
                "specialization": p.specialization.name if p.specialization else "General",
                "status": p.status,
                "booked_today": booked,
                "max_daily_appointments": max_appts,
                "utilisation_percent": round(util_pct, 1),
                "remaining_slots": max(0, max_appts - booked)
            })
            
        # Sort by utilisation descending
        res.sort(key=lambda x: x["utilisation_percent"], reverse=True)
        return {"providers": res}

    def get_appointments_by_hour(self, db: Session, date_from: date, date_to: date) -> Dict[str, Any]:
        results = db.query(
            extract('dow', Appointment.appointment_start).label('dow'),
            extract('hour', Appointment.appointment_start).label('hour'),
            func.count(Appointment.id)
        ).filter(
            func.date(Appointment.appointment_start) >= date_from,
            func.date(Appointment.appointment_start) <= date_to,
            Appointment.status != "cancelled"
        ).group_by('dow', 'hour').all()
        
        return {
            "data": [
                {"day_of_week": int(r[0]), "hour": int(r[1]), "count": r[2]}
                for r in results
            ]
        }

    def get_service_demand(self, db: Session, date_from: date, date_to: date, limit: int = 5) -> Dict[str, Any]:
        total_period = db.query(func.count(Appointment.id)).filter(
            func.date(Appointment.appointment_start) >= date_from,
            func.date(Appointment.appointment_start) <= date_to,
            Appointment.status != "cancelled"
        ).scalar() or 0
        
        results = db.query(
            Service.id, Service.name, func.count(Appointment.id)
        ).join(Appointment).filter(
            func.date(Appointment.appointment_start) >= date_from,
            func.date(Appointment.appointment_start) <= date_to,
            Appointment.status != "cancelled"
        ).group_by(Service.id, Service.name).order_by(func.count(Appointment.id).desc()).limit(limit).all()
        
        return {
            "services": [
                {
                    "service_id": str(r[0]),
                    "service_name": r[1],
                    "count": r[2],
                    "percent": round(r[2] / total_period * 100, 1) if total_period > 0 else 0
                }
                for r in results
            ]
        }

    def get_no_show_trend(self, db: Session, date_from: date, date_to: date) -> Dict[str, Any]:
        days_diff = (date_to - date_from).days + 1
        
        # Stats per day
        results = db.query(
            func.date(Appointment.appointment_start).label('date'),
            func.count(Appointment.id).label('total'),
            func.count(case((Appointment.status == "no_show", 1))).label('no_show'),
            func.count(case((Appointment.status == "cancelled", 1))).label('cancelled')
        ).filter(
            func.date(Appointment.appointment_start) >= date_from,
            func.date(Appointment.appointment_start) <= date_to
        ).group_by('date').order_by('date').all()
        
        formatted_days = []
        total_booked = 0
        total_no_show = 0
        total_cancelled = 0
        
        for r in results:
            total_booked += r.total
            total_no_show += r.no_show
            total_cancelled += r.cancelled
            
            formatted_days.append({
                "date": r.date,
                "total": r.total,
                "no_show": r.no_show,
                "cancelled": r.cancelled,
                "no_show_rate": round(r.no_show / r.total * 100, 1) if r.total > 0 else 0,
                "cancellation_rate": round(r.cancelled / r.total * 100, 1) if r.total > 0 else 0
            })
            
        no_show_rate_avg = (total_no_show / total_booked * 100) if total_booked > 0 else 0
        cancellation_rate_avg = (total_cancelled / total_booked * 100) if total_booked > 0 else 0
        
        return {
            "days": formatted_days,
            "averages": {
                "no_show_rate": round(no_show_rate_avg, 1),
                "cancellation_rate": round(cancellation_rate_avg, 1),
                "no_show_vs_prior_period": 0, # Complex to calc without full prior period fetch
                "cancellation_vs_prior_period": 0
            }
        }

dashboard_service = DashboardService()
