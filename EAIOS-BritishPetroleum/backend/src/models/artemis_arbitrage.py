"""ARTEMIS arbitrage models: cross-commodity spread opportunities and approvals."""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class ArtemisArbitrageOpportunity(Base):
    """
    Live cross-commodity arbitrage opportunity detected by ARTEMIS-Trade Agent.
    Represents one scored spread signal above the alert threshold.
    """
    __tablename__ = "artemis_arbitrage_opportunities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    # e.g. "TTF Gas <-> UK Power (NBP spark)"
    spread_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    # e.g. "crude_gas" | "gas_power" | "lng_pipeline" | "carbon_margin" | "crude_quality"
    spread_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    # Commodity legs
    leg_a: Mapped[str] = mapped_column(String(100), nullable=False)
    leg_b: Mapped[str] = mapped_column(String(100), nullable=False)
    # Current spread level as display string (e.g. "£38.4/MWh")
    current_level: Mapped[str] = mapped_column(String(50), nullable=False)
    current_level_numeric: Mapped[float] = mapped_column(Float, nullable=False)
    # Historical percentile rank (0-100)
    percentile_rank: Mapped[int] = mapped_column(Integer, nullable=False)
    # Estimated P&L in USD
    estimated_pnl_usd: Mapped[float] = mapped_column(Float, nullable=False)
    # Execution window description (e.g. "2-6h")
    execution_window: Mapped[str] = mapped_column(String(50), nullable=False)
    # Model confidence 0-100
    confidence_pct: Mapped[float] = mapped_column(Float, nullable=False)
    # open | approved | overridden | rejected | expired
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="open", index=True)
    # FCA Tier classification
    regulatory_tier: Mapped[str] = mapped_column(String(10), nullable=False, default="tier_2")
    # Human approval tracking
    approved_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    override_rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Realised P&L after execution (populated post-trade)
    realised_pnl_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    def __repr__(self) -> str:
        return f"<ArtemisArbitrageOpportunity {self.spread_name} {self.status}>"


class ArtemisArbitrageMetric(Base):
    """
    Daily aggregate metrics for the arbitrage intelligence pipeline.
    One row per day — used for trend charts and ROI attribution.
    """
    __tablename__ = "artemis_arbitrage_metrics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    metric_date: Mapped[datetime] = mapped_column(DateTime, nullable=False, unique=True, index=True)
    spreads_monitored: Mapped[int] = mapped_column(Integer, nullable=False, default=180)
    opportunities_detected: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    opportunities_approved: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    opportunities_overridden: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_pnl_identified_usd: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_pnl_realised_usd: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    avg_signal_latency_seconds: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    def __repr__(self) -> str:
        return f"<ArtemisArbitrageMetric {self.metric_date.date()}>"
