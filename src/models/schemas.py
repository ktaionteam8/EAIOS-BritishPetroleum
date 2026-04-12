"""Pydantic schemas for Revenue Analytics API."""

from pydantic import BaseModel


class RevenueInsight(BaseModel):
    entity_id: str
    revenue_stream: str
    region: str
    trading_revenue: float
    retail_sales: float
    demand_index: float
    current_revenue: float
    prev_quarter_revenue: float
    growth_rate: float
    revenue_trend: str
    decision: str
    confidence: float
    reason: str
    insight: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
