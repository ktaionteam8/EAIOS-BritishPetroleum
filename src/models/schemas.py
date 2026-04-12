"""Pydantic schemas for Treasury Management API."""

from pydantic import BaseModel


class TreasuryDecision(BaseModel):
    entity_id: str
    entity_name: str
    currency: str
    cash_balance: float
    net_inflow_30d: float
    obligations_30d: float
    projected_cash_30d: float
    liquidity_coverage_ratio: float
    fx_exposure: float
    decision: str
    confidence: float
    reason: str
    suggested_action: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
