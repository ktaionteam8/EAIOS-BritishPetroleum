"""Pydantic schemas for Compliance Management API."""

from pydantic import BaseModel


class ComplianceDecision(BaseModel):
    entity_id: str
    framework: str
    control_name: str
    required_by_regulator: bool
    control_coverage: float
    evidence_age_days: int
    finding_severity: int
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
