"""Pydantic schemas for Financial Close Automation API."""

from pydantic import BaseModel


class CloseDecision(BaseModel):
    entity_id: str
    business_unit: str
    period: str
    reconciled_pct: float
    pending_entries: int
    unreconciled_amount: float
    audit_flag: bool
    decision: str
    confidence: float
    reason: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
