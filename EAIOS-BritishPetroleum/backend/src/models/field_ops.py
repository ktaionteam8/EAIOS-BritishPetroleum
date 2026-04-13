"""Field operations: inspection routes, checklists, contractors."""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class InspectionRoute(Base):
    __tablename__ = "inspection_routes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    route_code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    # critical | high | medium | low
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")
    site_id: Mapped[str] = mapped_column(String(36), ForeignKey("sites.id"), nullable=False, index=True)
    asset_sequence: Mapped[list | None] = mapped_column(JSON, nullable=True)  # list of equipment tags
    distance_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    estimated_duration_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    inspector_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    inspector_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    # scheduled | in-progress | completed | cancelled
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="scheduled", index=True)
    scheduled_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    items: Mapped[list["InspectionItem"]] = relationship("InspectionItem", back_populates="route", cascade="all, delete-orphan")


class InspectionItem(Base):
    __tablename__ = "inspection_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    route_id: Mapped[str] = mapped_column(String(36), ForeignKey("inspection_routes.id"), nullable=False, index=True)
    equipment_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("equipment.id"), nullable=True)
    asset_tag: Mapped[str] = mapped_column(String(40), nullable=False)
    check_description: Mapped[str] = mapped_column(Text, nullable=False)
    iso_standard: Mapped[str | None] = mapped_column(String(60), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_by_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    observation_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    # pass | fail | n/a
    pass_fail: Mapped[str | None] = mapped_column(String(10), nullable=True)

    route: Mapped["InspectionRoute"] = relationship("InspectionRoute", back_populates="items")


class Contractor(Base):
    __tablename__ = "contractors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    company_name: Mapped[str] = mapped_column(String(120), nullable=False)
    specialty: Mapped[str] = mapped_column(String(80), nullable=False)
    site_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("sites.id"), nullable=True)
    crew_size: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    # available | on-site | mobilising | demobilising
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="available")
    availability_from: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    availability_to: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    contact_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
