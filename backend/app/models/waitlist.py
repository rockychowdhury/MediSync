import uuid
from datetime import datetime, date

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Index,
    SmallInteger,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.utils.mixins import TimeStampMixin


class Waitlist(TimeStampMixin, Base):
    """
    Holds patients waiting for an available slot.
    Separate from appointments — a waitlist entry has no confirmed time yet.

    Queue ordering: priority DESC, queue_position ASC, created_at ASC
    """

    __tablename__ = "waitlist"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # ── Foreign keys ──
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id"), nullable=False
    )
    service_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("services.id"), nullable=False
    )
    provider_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("providers.id"), nullable=True
    )
    assigned_appointment_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("appointments.id"), nullable=True
    )

    # ── Queue fields ──
    requested_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    priority: Mapped[str] = mapped_column(
        String(20), default="standard", nullable=False, index=True
    )
    queue_position: Mapped[int | None] = mapped_column(
        SmallInteger, nullable=True, index=True
    )
    status: Mapped[str] = mapped_column(
        String(20), default="waiting", nullable=False, index=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Relationships ──
    patient: Mapped["Patient"] = relationship(back_populates="waitlist_entries")
    service: Mapped["Service"] = relationship(back_populates="waitlist_entries")
    provider: Mapped["Provider | None"] = relationship(back_populates="waitlist_entries")
    assigned_appointment: Mapped["Appointment | None"] = relationship(
        back_populates="waitlist_assignment",
        foreign_keys=[assigned_appointment_id],
    )
    notifications: Mapped[list["Notification"]] = relationship(
        back_populates="waitlist_entry"
    )

    # ── Indexes ──
    __table_args__ = (
        Index("ix_waitlist_queue_order", "status", "priority", "created_at"),
        Index("ix_waitlist_slot_match", "service_id", "provider_id"),
    )

    def __repr__(self) -> str:
        return f"<Waitlist {self.id} status={self.status}>"
