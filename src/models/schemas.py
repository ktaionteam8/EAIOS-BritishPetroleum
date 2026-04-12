"""Pydantic schemas for LNG Trading Platform API."""

from pydantic import BaseModel


class LNGDecision(BaseModel):
    entity_id: str
    origin: str
    volume_mmbtu: int
    spot_price: float
    ttf_price: float
    jkm_price: float
    shipping_cost: float
    recommendation: str
    best_route: str
    arbitrage_margin: float
    expected_pnl: float
    rationale: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
