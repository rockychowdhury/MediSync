import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.utils.mixins import TimeStampMixin


class Appointment(TimeStampMixin, Base):
    """
    Core transactional table. Each row is a confirmed or historical appointment slot.

    Status lifecycle: scheduled → checked_in → in_progress → completed
                      └─→ cancelled
                      └─→ no_show
    """

    __tablename__ = "appointments"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    appointment_number: Mapped[str] = mapped_column(
        String(30), unique=True, nullable=False, index=True
    )

    # ── Foreign keys ──
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id"), nullable=False
    )
    provider_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("providers.id"), nullable=False
    )
    service_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("services.id"), nullable=False
    )
    created_by: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False
    )

    # ── Time fields ──
    appointment_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    appointment_end: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    # ── Status & priority ──
    status: Mapped[str] = mapped_column(
        String(20), default="scheduled", nullable=False, index=True
    )
    priority: Mapped[str] = mapped_column(
        String(20), default="standard", nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Status timestamps ──
    checked_in_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Reminder tracking ──
    reminder_24h_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    reminder_2h_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Waitlist promotion ──
    assigned_from_waitlist: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # ── Relationships ──
    patient: Mapped["Patient"] = relationship(back_populates="appointments")
    provider: Mapped["Provider"] = relationship(back_populates="appointments")
    service: Mapped["Service"] = relationship(back_populates="appointments")
    created_by_user: Mapped["User"] = relationship(
        back_populates="created_appointments",
        foreign_keys=[created_by],
    )
    waitlist_assignment: Mapped["Waitlist | None"] = relationship(
        back_populates="assigned_appointment",
        foreign_keys="[Waitlist.assigned_appointment_id]",
        uselist=False,
    )
    notifications: Mapped[list["Notification"]] = relationship(
        back_populates="appointment"
    )

    # ── Composite Indexes ──
    __table_args__ = (
        Index(
            "ix_appointments_conflict",
            "provider_id",
            "appointment_start",
            "appointment_end",
        ),
        Index("ix_appointments_patient", "patient_id"),
        Index("ix_appointments_status_start", "status", "appointment_start"),
    )

    def __repr__(self) -> str:
        return f"<Appointment {self.appointment_number}>"
