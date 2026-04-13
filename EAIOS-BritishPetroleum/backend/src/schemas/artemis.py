"""Pydantic response schemas for all ARTEMIS API endpoints."""
from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AgentStatusOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    agent_key: str
    agent_name: str
    scope: str
    status: str
    signals_today: int
    last_signal_at: datetime | None
    primary_metric_value: str | None
    primary_metric_label: str | None
    updated_at: datetime


class ModelRegistryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    model_name: str
    version: str
    status: str
    accuracy_pct: float
    drift_status: str
    next_review_days: int
    agent_key: str
    last_validated_at: datetime


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    action_type: str
    agent_key: str
    recommendation_summary: str | None
    estimated_pnl_usd: float | None
    confidence_pct: float | None
    regulatory_tier: str
    approver_id: str | None
    created_at: datetime


class ComplianceEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    framework: str
    status: str
    detail: str
    jurisdiction: str | None
    agent_key: str | None
    created_at: datetime


# ── Arbitrage ─────────────────────────────────────────────────────────────────
class ArbitrageOpportunityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    spread_name: str
    spread_type: str
    leg_a: str
    leg_b: str
    current_level: str
    current_level_numeric: float
    percentile_rank: int
    estimated_pnl_usd: float
    execution_window: str
    confidence_pct: float
    status: str
    regulatory_tier: str
    approved_by: str | None
    approved_at: datetime | None
    created_at: datetime


class ArbitrageMetricOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    metric_date: datetime
    spreads_monitored: int
    opportunities_detected: int
    opportunities_approved: int
    total_pnl_identified_usd: float
    total_pnl_realised_usd: float
    avg_signal_latency_seconds: float


# ── Castrol ───────────────────────────────────────────────────────────────────
class BaseOilPriceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    grade: str
    price_per_mt: float
    price_display: str
    change_pct: float
    change_display: str
    alert_status: str
    price_date: datetime


class CastrolPricingRecOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    sku_code: str
    sku_name: str
    segment: str
    geography: str
    current_display: str
    recommended_display: str
    margin_impact_pct: float
    margin_impact_display: str
    rec_status: str
    confidence_pct: float
    competitor_benchmark: str | None
    is_intraday_update: bool
    generated_at: datetime


# ── Aviation ──────────────────────────────────────────────────────────────────
class AviationAirportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    iata_code: str
    airport_name: str
    city: str
    country: str
    region: str
    primary_airlines: str | None


class AviationForecastOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    iata_code: str
    airport_name: str | None = None   # joined from airport
    d30_display: str
    d90_display: str
    d90_delta_pct: float
    d90_delta_display: str
    confidence_interval_pct: float
    model_mape_pct: float
    forecast_date: datetime


class AviationContractOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    iata_code: str
    airline: str
    contract_type: str
    status: str
    days_to_renewal: int
    contract_value_usd: float | None
    recommended_structure: str | None
    scenario_baseline_usd: float | None
    pack_generated_at: datetime | None


# ── Carbon ────────────────────────────────────────────────────────────────────
class CarbonPositionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    credit_type: str
    credit_category: str
    holdings_display: str
    obligation_display: str
    net_position_tonnes: float
    net_position_display: str
    price_display: str
    market_value_usd: float | None
    position_date: datetime


class CarbonRecommendationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    credit_type: str
    action: str
    urgency: str
    quantity_tonnes: float | None
    expected_cost_benefit_usd: float | None
    rationale: str
    status: str
    created_at: datetime
