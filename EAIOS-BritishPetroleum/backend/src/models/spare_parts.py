"""Spare parts catalog, stock levels, procurement orders."""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class SparePart(Base):
    __tablename__ = "spare_parts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    part_number: Mapped[str] = mapped_column(String(60), nullable=False, unique=True, index=True)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    # equipment types this part applies to (JSON array of strings)
    equipment_types: Mapped[list | None] = mapped_column(JSON, nullable=True)
    unit_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    supplier: Mapped[str | None] = mapped_column(String(120), nullable=True)
    lead_time_days: Mapped[int] = mapped_column(Integer, nullable=False, default=7)
    # 1 (low) – 5 (critical)
    criticality_score: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    stock_levels: Mapped[list["SparePartStock"]] = relationship("SparePartStock", back_populates="part", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<SparePart {self.part_number}>"


class SparePartStock(Base):
    __tablename__ = "spare_parts_stock"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    part_id: Mapped[str] = mapped_column(String(36), ForeignKey("spare_parts.id"), nullable=False, index=True)
    site_id: Mapped[str] = mapped_column(String(36), ForeignKey("sites.id"), nullable=False, index=True)
    on_hand_qty: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    min_qty: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    on_order_qty: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reorder_qty: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    last_updated: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    part: Mapped["SparePart"] = relationship("SparePart", back_populates="stock_levels")


class ProcurementOrder(Base):
    __tablename__ = "procurement_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    po_number: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    part_id: Mapped[str] = mapped_column(String(36), ForeignKey("spare_parts.id"), nullable=False, index=True)
    site_id: Mapped[str] = mapped_column(String(36), ForeignKey("sites.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_cost: Mapped[float] = mapped_column(Float, nullable=False)
    total_cost: Mapped[float] = mapped_column(Float, nullable=False)
    ordered_date: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_now)
    expected_delivery: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    # ordered | confirmed | in-transit | delivered | cancelled
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="ordered")
    urgency_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
