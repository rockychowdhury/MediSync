from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric, SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base_model import BaseModel


class Service(BaseModel):
    """Catalog of billable clinical services offered by the facility."""

    __tablename__ = "services"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    duration_minutes: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    buffer_time_minutes: Mapped[int] = mapped_column(
        SmallInteger, default=0, nullable=False
    )
    required_specialization_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("specializations.id"), nullable=True
    )
    fee: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    billing_code: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # ── Relationships ──
    required_specialization: Mapped["Specialization | None"] = relationship(
        back_populates="services"
    )
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="service")
    providers: Mapped[list["Provider"]] = relationship(
        secondary="provider_services",
        back_populates="services",
        lazy="selectin",
    )
    waitlist_entries: Mapped[list["Waitlist"]] = relationship(back_populates="service")

    def __repr__(self) -> str:
        return f"<Service {self.name}>"
