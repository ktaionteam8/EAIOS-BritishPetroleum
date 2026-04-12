"""Pydantic schemas for Cross-Commodity Arbitrage API."""

from pydantic import BaseModel


class ArbitrageOpportunity(BaseModel):
    entity_id: str
    leg_a: str
    leg_b: str
    observed_spread: float
    mean_spread: float
    z_score: float
    net_margin: float
    status: str
    direction: str
    confidence: float
    rationale: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
