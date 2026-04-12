"""Pydantic schemas for Tax Compliance API."""

from pydantic import BaseModel


class TaxDecision(BaseModel):
    entity_id: str
    region: str
    tax_type: str
    transaction_amount: float
    expected_tax_rate: float
    applied_tax_rate: float
    rate_diff: float
    estimated_tax_gap: float
    documentation_complete: bool
    decision: str
    confidence: float
    reason: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
