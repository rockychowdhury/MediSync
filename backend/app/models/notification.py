import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    SmallInteger,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Notification(Base):
    """
    Tracks every outbound notification (email / SMS).
    Powers delivery status, retry logic, and opt-out enforcement.
    """

    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # ── Recipient ──
    recipient_type: Mapped[str] = mapped_column(String(20), nullable=False)
    recipient_id: Mapped[str] = mapped_column(String(36), nullable=False)

    # ── Related entities ──
    appointment_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("appointments.id"), nullable=True
    )
    waitlist_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("waitlist.id"), nullable=True
    )

    # ── Notification details ──
    channel: Mapped[str] = mapped_column(String(10), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False, index=True
    )
    subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
    body_preview: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Delivery tracking ──
    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    retry_count: Mapped[int] = mapped_column(SmallInteger, default=0, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # ── Relationships ──
    appointment: Mapped["Appointment | None"] = relationship(
        back_populates="notifications"
    )
    waitlist_entry: Mapped["Waitlist | None"] = relationship(
        back_populates="notifications"
    )

    # ── Indexes ──
    __table_args__ = (
        Index("ix_notifications_appointment_type", "appointment_id", "type"),
        Index("ix_notifications_status_created", "status", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Notification {self.id} type={self.type} status={self.status}>"
