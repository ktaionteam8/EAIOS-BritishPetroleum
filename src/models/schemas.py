"""Pydantic schemas for Talent Analytics API."""

from pydantic import BaseModel


class TalentDecision(BaseModel):
    entity_id: str
    department: str
    role: str
    performance_score: float
    tenure_years: float
    attrition_risk: float
    action: str
    priority: str
    rationale: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
