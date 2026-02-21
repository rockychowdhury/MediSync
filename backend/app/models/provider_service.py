from sqlalchemy import Column, ForeignKey, String, Table

from app.db.base import Base

# ── Many-to-Many Join Table: Which services each provider can deliver ──
provider_services = Table(
    "provider_services",
    Base.metadata,
    Column(
        "provider_id",
        String(36),
        ForeignKey("providers.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "service_id",
        String(36),
        ForeignKey("services.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
