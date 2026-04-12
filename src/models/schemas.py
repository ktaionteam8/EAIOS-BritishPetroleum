"""Pydantic schemas for JV Accounting API."""

from pydantic import BaseModel


class JVDecision(BaseModel):
    entity_id: str
    jv_name: str
    partner: str
    bp_share_pct: float
    expected_bp_share: float
    reported_bp_share: float
    variance: float
    variance_pct: float
    decision: str
    confidence: float
    reason: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
