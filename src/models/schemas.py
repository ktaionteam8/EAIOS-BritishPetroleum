"""Pydantic schemas for Carbon Credit Trading API."""

from pydantic import BaseModel


class CarbonDecision(BaseModel):
    entity_id: str
    scheme: str
    price_eur: float
    fair_value: float
    target_price: float
    recommendation: str
    confidence: float
    rationale: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
