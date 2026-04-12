"""Pydantic schemas for Contractor Management API."""

from pydantic import BaseModel


class ContractorDecision(BaseModel):
    entity_id: str
    contractor_name: str
    scope: str
    efficiency_score: float
    compliance_score: float
    cost_variance_pct: float
    safety_incidents_12m: int
    composite_score: float
    action: str
    priority: str
    rationale: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
