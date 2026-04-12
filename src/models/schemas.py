"""Pydantic schemas for Cost Forecasting API."""

from pydantic import BaseModel


class CostForecast(BaseModel):
    entity_id: str
    cost_center: str
    manufacturing_cost: float
    logistics_cost: float
    workforce_cost: float
    forecast_cost: float
    budget: float
    variance: float
    variance_pct: float
    trend: str
    decision: str
    confidence: float
    reason: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
