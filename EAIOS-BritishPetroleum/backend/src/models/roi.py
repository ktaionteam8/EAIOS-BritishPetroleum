"""ROI snapshots, KPI history, cost savings, budget vs actuals."""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class KpiSnapshot(Base):
    __tablename__ = "kpi_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    site_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("sites.id"), nullable=True, index=True)
    # fleet | site
    scope: Mapped[str] = mapped_column(String(10), nullable=False, default="fleet")
    snapshot_date: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    mtbf_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    mttr_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    oee_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    availability_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    performance_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    quality_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    alerts_actioned: Mapped[int | None] = mapped_column(Integer, nullable=True)
    model_accuracy_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class RoiContribution(Base):
    __tablename__ = "roi_contributions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    # LSTM | XGBoost | Prophet | AI Advisor | Parts | Energy | Other
    source: Mapped[str] = mapped_column(String(80), nullable=False)
    value_usd: Mapped[float] = mapped_column(Float, nullable=False)
    valuation_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    methodology_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class BudgetActual(Base):
    __tablename__ = "budget_actuals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    site_id: Mapped[str] = mapped_column(String(36), ForeignKey("sites.id"), nullable=False, index=True)
    # YYYY-MM
    period_month: Mapped[str] = mapped_column(String(7), nullable=False)
    budgeted_usd: Mapped[float] = mapped_column(Float, nullable=False)
    actual_usd: Mapped[float] = mapped_column(Float, nullable=False)
    variance_usd: Mapped[float] = mapped_column(Float, nullable=False)
    cost_category: Mapped[str] = mapped_column(String(60), nullable=False, default="maintenance")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class CostSavingEvent(Base):
    __tablename__ = "cost_saving_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    equipment_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("equipment.id"), nullable=True)
    site_id: Mapped[str] = mapped_column(String(36), ForeignKey("sites.id"), nullable=False, index=True)
    alert_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("alerts.id"), nullable=True)
    event_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    cost_avoided_usd: Mapped[float] = mapped_column(Float, nullable=False)
    # failure_prevention | energy | parts | downtime | other
    category: Mapped[str] = mapped_column(String(40), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
