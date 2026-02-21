from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Specialization(Base):
    """Lookup table for clinical specializations. Referenced by providers and services."""

    __tablename__ = "specializations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Relationships ──
    providers: Mapped[list["Provider"]] = relationship(back_populates="specialization")
    services: Mapped[list["Service"]] = relationship(back_populates="required_specialization")

    def __repr__(self) -> str:
        return f"<Specialization {self.name}>"
