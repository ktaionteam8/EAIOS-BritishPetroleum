"""Pydantic schemas for OT Security Monitoring API."""

from pydantic import BaseModel


class OTSecurityDecision(BaseModel):
    entity_id: str
    asset_type: str
    site: str
    purdue_level: int
    risk_score: float
    status: str
    action: str
    priority: str
    rationale: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
