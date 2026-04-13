"""ARTEMIS Castrol models: base oil prices and B2B pricing recommendations."""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class ArtemisBaseOilPrice(Base):
    """
    Daily (and intraday) base oil spot prices used by ARTEMIS-Castrol Agent.
    Grades: Group I SN 150, Group II 100N, Group III 4cSt etc.
    """
    __tablename__ = "artemis_base_oil_prices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    # e.g. "Group I SN 150" | "Group II 100N" | "Group III 4cSt"
    grade: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    price_per_mt: Mapped[float] = mapped_column(Float, nullable=False)
    price_display: Mapped[str] = mapped_column(String(30), nullable=False)   # e.g. "$862/MT"
    change_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    change_display: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g. "+0.4%"
    # normal | alert (>0.5% move triggers intraday pricing run)
    alert_status: Mapped[str] = mapped_column(String(20), nullable=False, default="normal")
    source: Mapped[str] = mapped_column(String(50), nullable=False, default="platts")
    price_date: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    def __repr__(self) -> str:
        return f"<ArtemisBaseOilPrice {self.grade} {self.price_display}>"


class ArtemisCastrolPricingRec(Base):
    """
    AI pricing recommendation for a Castrol B2B SKU/geography/segment combination.
    Generated daily at 07:00 UTC; updated intraday on base oil alert.
    """
    __tablename__ = "artemis_castrol_pricing_recs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    sku_code: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    sku_name: Mapped[str] = mapped_column(String(200), nullable=False)
    segment: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    geography: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    current_price_per_litre: Mapped[float] = mapped_column(Float, nullable=False)
    recommended_price_per_litre: Mapped[float] = mapped_column(Float, nullable=False)
    current_display: Mapped[str] = mapped_column(String(20), nullable=False)     # e.g. "$3.42/L"
    recommended_display: Mapped[str] = mapped_column(String(20), nullable=False) # e.g. "$3.49/L"
    margin_impact_pct: Mapped[float] = mapped_column(Float, nullable=False)
    margin_impact_display: Mapped[str] = mapped_column(String(20), nullable=False)
    # update_available | at_recommended | overpriced | approved | overridden
    rec_status: Mapped[str] = mapped_column(String(30), nullable=False, default="update_available", index=True)
    confidence_pct: Mapped[float] = mapped_column(Float, nullable=False, default=85.0)
    base_oil_grade: Mapped[str | None] = mapped_column(String(100), nullable=True)
    competitor_benchmark: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # Salesforce integration
    salesforce_opportunity_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    approved_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    override_rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_intraday_update: Mapped[bool] = mapped_column(Boolean, default=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, index=True)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    def __repr__(self) -> str:
        return f"<ArtemisCastrolPricingRec {self.sku_code} {self.geography} {self.rec_status}>"
