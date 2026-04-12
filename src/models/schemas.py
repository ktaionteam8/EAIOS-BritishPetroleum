"""Pydantic schemas for Shadow IT Rationalization API."""

from pydantic import BaseModel


class ShadowITDecision(BaseModel):
    entity_id: str
    app_name: str
    category: str
    active_users: int
    data_sensitivity: float
    compliance_risk: float
    action: str
    priority: str
    rationale: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
