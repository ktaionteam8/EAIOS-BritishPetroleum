"""Pydantic schemas for Crude Trading Analytics API."""

from pydantic import BaseModel


class TradingDecision(BaseModel):
    entity_id: str
    grade: str
    spot_price: float
    ma_20: float
    recommendation: str
    confidence: float
    expected_pnl: float
    rationale: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
