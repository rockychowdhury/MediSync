from datetime import date, datetime, timezone
from datetime import time as time_type

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ProviderTimeOff(Base):
    """
    Ad-hoc leave periods that override the recurring availability schedule.
    Supports full-day and partial-day leave with an approval workflow.
    """

    __tablename__ = "provider_time_off"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    provider_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("providers.id", ondelete="CASCADE"), nullable=False
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time_type | None] = mapped_column(Time, nullable=True)
    end_time: Mapped[time_type | None] = mapped_column(Time, nullable=True)
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    approved_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    is_approved: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # ── Relationships ──
    provider: Mapped["Provider"] = relationship(back_populates="time_offs")
    approver: Mapped["User | None"] = relationship(
        back_populates="approved_time_offs",
        foreign_keys=[approved_by],
    )

    def __repr__(self) -> str:
        return f"<ProviderTimeOff provider={self.provider_id} {self.start_date}-{self.end_date}>"
