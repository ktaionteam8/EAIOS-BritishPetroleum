"""Alert domain models: alerts, SHAP signals, analogues, decisions, audit log."""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    alert_code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    # critical | warning | advisory
    severity: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    equipment_id: Mapped[str] = mapped_column(String(36), ForeignKey("equipment.id"), nullable=False, index=True)
    site_id: Mapped[str] = mapped_column(String(36), ForeignKey("sites.id"), nullable=False, index=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    failure_mode: Mapped[str] = mapped_column(String(255), nullable=False)
    probability: Mapped[float] = mapped_column(Float, nullable=False)
    etf_days: Mapped[float] = mapped_column(Float, nullable=False)
    etf_min: Mapped[float] = mapped_column(Float, nullable=False)
    etf_max: Mapped[float] = mapped_column(Float, nullable=False)
    # replace | inspect | monitor
    recommendation: Mapped[str] = mapped_column(String(20), nullable=False)
    # active | accepted | modified | overridden | closed
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", index=True)
    is_push_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    shap_signals: Mapped[list["AlertShapSignal"]] = relationship("AlertShapSignal", back_populates="alert", cascade="all, delete-orphan")
    analogues: Mapped[list["AlertAnalogue"]] = relationship("AlertAnalogue", back_populates="alert", cascade="all, delete-orphan")
    decision: Mapped["AlertDecision | None"] = relationship("AlertDecision", back_populates="alert", uselist=False)

    def __repr__(self) -> str:
        return f"<Alert {self.alert_code} {self.severity}>"


class AlertShapSignal(Base):
    __tablename__ = "alert_shap_signals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    alert_id: Mapped[str] = mapped_column(String(36), ForeignKey("alerts.id"), nullable=False, index=True)
    signal_name: Mapped[str] = mapped_column(String(120), nullable=False)
    values: Mapped[list] = mapped_column(JSON, nullable=False)  # list of floats (time series)
    contribution: Mapped[float] = mapped_column(Float, nullable=False)  # 0.0–1.0
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    alert: Mapped["Alert"] = relationship("Alert", back_populates="shap_signals")


class AlertAnalogue(Base):
    __tablename__ = "alert_analogues"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    alert_id: Mapped[str] = mapped_column(String(36), ForeignKey("alerts.id"), nullable=False, index=True)
    site_name: Mapped[str] = mapped_column(String(120), nullable=False)
    event_date: Mapped[str] = mapped_column(String(20), nullable=False)  # "Mar 2024"
    outcome: Mapped[str] = mapped_column(Text, nullable=False)
    days_to_failure: Mapped[int] = mapped_column(Integer, nullable=False)
    match_score: Mapped[int] = mapped_column(Integer, nullable=False)  # 0–100

    alert: Mapped["Alert"] = relationship("Alert", back_populates="analogues")


class AlertDecision(Base):
    __tablename__ = "alert_decisions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    alert_id: Mapped[str] = mapped_column(String(36), ForeignKey("alerts.id"), nullable=False, unique=True, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    # accepted | modified | overridden
    decision: Mapped[str] = mapped_column(String(20), nullable=False)
    reason_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    modified_action: Mapped[str | None] = mapped_column(String(40), nullable=True)
    modified_timing: Mapped[str | None] = mapped_column(String(80), nullable=True)
    work_order_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    wo_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    decided_at: Mapped[datetime] = mapped_column(DateTime, default=_now, index=True)

    alert: Mapped["Alert"] = relationship("Alert", back_populates="decision")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    alert_id: Mapped[str] = mapped_column(String(36), ForeignKey("alerts.id"), nullable=False, index=True)
    alert_title: Mapped[str] = mapped_column(String(255), nullable=False)
    # accepted | modified | overridden
    decision: Mapped[str] = mapped_column(String(20), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    user_name: Mapped[str] = mapped_column(String(255), nullable=False)
    reason_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    wo_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=_now, index=True)

    def __repr__(self) -> str:
        return f"<AuditLog {self.alert_id} {self.decision}>"
