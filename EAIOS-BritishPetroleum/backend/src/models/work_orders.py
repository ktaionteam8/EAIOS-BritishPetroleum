"""Work orders, SAP BAPI records, crew assignments."""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    wo_number: Mapped[str] = mapped_column(String(30), nullable=False, unique=True, index=True)
    equipment_id: Mapped[str] = mapped_column(String(36), ForeignKey("equipment.id"), nullable=False, index=True)
    site_id: Mapped[str] = mapped_column(String(36), ForeignKey("sites.id"), nullable=False, index=True)
    alert_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("alerts.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # emergency | high | medium | low
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="medium", index=True)
    # open | in-progress | scheduled | completed | cancelled
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="open", index=True)
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    cost_estimate: Mapped[float | None] = mapped_column(Float, nullable=True)
    cost_actual: Mapped[float | None] = mapped_column(Float, nullable=True)
    failure_cost_avoided: Mapped[float | None] = mapped_column(Float, nullable=True)
    due_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    scheduled_start: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    oem_instructions: Mapped[list | None] = mapped_column(JSON, nullable=True)
    required_resources: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    estimated_duration_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_by_user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    approved_by_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    s4hana_ready: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    sap_records: Mapped[list["SapBapiRecord"]] = relationship("SapBapiRecord", back_populates="work_order", cascade="all, delete-orphan")
    parts: Mapped[list["WoPart"]] = relationship("WoPart", back_populates="work_order", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<WorkOrder {self.wo_number} {self.status}>"


class SapBapiRecord(Base):
    __tablename__ = "sap_bapi_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    work_order_id: Mapped[str] = mapped_column(String(36), ForeignKey("work_orders.id"), nullable=False, index=True)
    # IW21 | IW31 | MMMR
    record_type: Mapped[str] = mapped_column(String(10), nullable=False)
    sap_reference_id: Mapped[str] = mapped_column(String(60), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    asset_tag: Mapped[str | None] = mapped_column(String(40), nullable=True)
    s4hana_ready: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    work_order: Mapped["WorkOrder"] = relationship("WorkOrder", back_populates="sap_records")


class WoPart(Base):
    __tablename__ = "wo_parts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    work_order_id: Mapped[str] = mapped_column(String(36), ForeignKey("work_orders.id"), nullable=False, index=True)
    part_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("spare_parts.id"), nullable=True)
    part_number: Mapped[str] = mapped_column(String(60), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    unit_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    # pending | reserved | delivered
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    required_by: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    work_order: Mapped["WorkOrder"] = relationship("WorkOrder", back_populates="parts")


class CrewMember(Base):
    __tablename__ = "crew_members"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(80), nullable=False)
    site_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("sites.id"), nullable=True)
    # available | on-duty | leave | training
    availability: Mapped[str] = mapped_column(String(20), nullable=False, default="available")
    skills: Mapped[list | None] = mapped_column(JSON, nullable=True)
    contractor_company: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    assignments: Mapped[list["CrewAssignment"]] = relationship("CrewAssignment", back_populates="crew_member")


class CrewAssignment(Base):
    __tablename__ = "crew_assignments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    crew_member_id: Mapped[str] = mapped_column(String(36), ForeignKey("crew_members.id"), nullable=False, index=True)
    work_order_id: Mapped[str] = mapped_column(String(36), ForeignKey("work_orders.id"), nullable=False, index=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    start_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    # assigned | in-progress | completed
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="assigned")

    crew_member: Mapped["CrewMember"] = relationship("CrewMember", back_populates="assignments")
