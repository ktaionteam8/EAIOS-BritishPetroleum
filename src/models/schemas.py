"""Pydantic schemas for Castrol Pricing Engine API."""

from pydantic import BaseModel


class PricingDecision(BaseModel):
    entity_id: str
    sku: str
    region: str
    current_price: float
    recommended_price: float
    delta: float
    action: str
    rationale: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
