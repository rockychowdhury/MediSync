from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, SmallInteger, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base_model import BaseModel


class User(BaseModel):
    """
    All authenticated system users (admins, receptionists, providers).
    Created via admin dashboard only.
    """

    __tablename__ = "users"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[int] = mapped_column(Integer, ForeignKey("roles.id"), nullable=False)

    # ── Security fields ──
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    failed_login_attempts: Mapped[int] = mapped_column(
        SmallInteger, default=0, nullable=False
    )
    locked_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    password_reset_token: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    password_reset_expires: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relationships ──
    role: Mapped["Role"] = relationship(back_populates="users", lazy="selectin")
    provider: Mapped["Provider | None"] = relationship(
        back_populates="user", uselist=False
    )
    created_appointments: Mapped[list["Appointment"]] = relationship(
        back_populates="created_by_user",
        foreign_keys="[Appointment.created_by]",
    )
    activity_logs: Mapped[list["ActivityLog"]] = relationship(back_populates="user")
    approved_time_offs: Mapped[list["ProviderTimeOff"]] = relationship(
        back_populates="approver",
        foreign_keys="[ProviderTimeOff.approved_by]",
    )

    def __repr__(self) -> str:
        return f"<User {self.email}>"
