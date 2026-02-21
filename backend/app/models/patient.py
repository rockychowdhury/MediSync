from datetime import date

from sqlalchemy import Boolean, Date, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base_model import BaseModel


class Patient(BaseModel):
    """Patient demographic and contact information. Managed by front-desk staff."""

    __tablename__ = "patients"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True, index=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    notification_opt_out: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # ── Relationships ──
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="patient")
    waitlist_entries: Mapped[list["Waitlist"]] = relationship(back_populates="patient")

    def __repr__(self) -> str:
        return f"<Patient {self.name}>"
