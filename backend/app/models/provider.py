from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.utils.mixins import TimeStampMixin


class Provider(TimeStampMixin, Base):
    """
    Extends the users table with clinical attributes.
    PK is also a FK → users.id (one-to-one extension).
    """

    __tablename__ = "providers"

    id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), primary_key=True
    )
    specialization_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("specializations.id"), nullable=False
    )
    consultation_fee: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    emergency_enabled: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    max_daily_appointments: Mapped[int] = mapped_column(
        SmallInteger, default=8, nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), default="available", nullable=False, index=True
    )

    # ── Relationships ──
    user: Mapped["User"] = relationship(back_populates="provider")
    specialization: Mapped["Specialization"] = relationship(back_populates="providers")
    services: Mapped[list["Service"]] = relationship(
        secondary="provider_services",
        back_populates="providers",
        lazy="selectin",
    )
    availability_slots: Mapped[list["Availability"]] = relationship(
        back_populates="provider", cascade="all, delete-orphan"
    )
    time_offs: Mapped[list["ProviderTimeOff"]] = relationship(
        back_populates="provider", cascade="all, delete-orphan"
    )
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="provider")
    waitlist_entries: Mapped[list["Waitlist"]] = relationship(back_populates="provider")

    def __repr__(self) -> str:
        return f"<Provider {self.id}>"
