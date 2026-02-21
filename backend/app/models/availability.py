from datetime import time as time_type

from sqlalchemy import Boolean, ForeignKey, Integer, SmallInteger, String, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Availability(Base):
    """
    Recurring weekly schedule for each provider. Drives slot generation.

    day_of_week: 0 = Sunday … 6 = Saturday
    """

    __tablename__ = "availability"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    provider_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("providers.id", ondelete="CASCADE"), nullable=False
    )
    day_of_week: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    start_time: Mapped[time_type] = mapped_column(Time, nullable=False)
    end_time: Mapped[time_type] = mapped_column(Time, nullable=False)
    break_start: Mapped[time_type | None] = mapped_column(Time, nullable=True)
    break_end: Mapped[time_type | None] = mapped_column(Time, nullable=True)
    is_working_day: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    notes: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # ── Relationships ──
    provider: Mapped["Provider"] = relationship(back_populates="availability_slots")

    def __repr__(self) -> str:
        return f"<Availability provider={self.provider_id} day={self.day_of_week}>"
