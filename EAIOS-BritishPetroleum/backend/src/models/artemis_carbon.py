"""ARTEMIS carbon models: portfolio positions and buy/hold/sell recommendations."""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class ArtemisCarbonPosition(Base):
    """
    BP's carbon credit portfolio positions tracked by ARTEMIS-Carbon Agent.
    Covers EU ETS allowances, VCS voluntary credits, Gold Standard, and CORSIA.
    One row per credit type — updated daily from registry feeds.
    """
    __tablename__ = "artemis_carbon_positions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    # e.g. "EU ETS Dec-25" | "EU ETS Dec-26" | "VCS Forestry" | "Gold Standard"
    credit_type: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    # eu_ets | vcs | gold_standard | corsia
    credit_category: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    vintage_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Holdings in tonnes CO2e
    holdings_tonnes: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    holdings_display: Mapped[str] = mapped_column(String(30), nullable=False)  # e.g. "180,000t"
    # Regulatory obligation in tonnes (null for voluntary)
    obligation_tonnes: Mapped[float | None] = mapped_column(Float, nullable=True)
    obligation_display: Mapped[str] = mapped_column(String(30), nullable=False)
    # Net position = holdings - obligation (positive = surplus, negative = deficit)
    net_position_tonnes: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    net_position_display: Mapped[str] = mapped_column(String(30), nullable=False)
    # Current market price
    current_price: Mapped[float] = mapped_column(Float, nullable=False)
    price_display: Mapped[str] = mapped_column(String(20), nullable=False)   # e.g. "€48.20"
    price_currency: Mapped[str] = mapped_column(String(5), nullable=False, default="EUR")
    # Market value of current holdings
    market_value_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    position_date: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    def __repr__(self) -> str:
        return f"<ArtemisCarbonPosition {self.credit_type} {self.net_position_display}>"


class ArtemisCarbonRecommendation(Base):
    """
    ARTEMIS-Carbon Agent's buy/hold/sell/retire action recommendations.
    Generated daily; urgency drives notification priority.
    """
    __tablename__ = "artemis_carbon_recommendations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    credit_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    # buy | sell | hold | retire
    action: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    # high | medium | low
    urgency: Mapped[str] = mapped_column(String(10), nullable=False, default="medium")
    quantity_tonnes: Mapped[float | None] = mapped_column(Float, nullable=True)
    target_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    expected_cost_benefit_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    compliance_driver: Mapped[str | None] = mapped_column(String(200), nullable=True)
    # open | approved | overridden | executed | expired
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="open", index=True)
    approved_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    # TCFD/FCA sustainability reporting link
    tcfd_category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    def __repr__(self) -> str:
        return f"<ArtemisCarbonRecommendation {self.credit_type} {self.action} {self.urgency}>"
