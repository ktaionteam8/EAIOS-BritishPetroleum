"""Pydantic schemas for Safety Incident Prediction API."""

from pydantic import BaseModel


class SafetyDecision(BaseModel):
    entity_id: str
    site_name: str
    facility_type: str
    hazard_score: float
    near_miss_90d: int
    risk_score: float
    status: str
    priority: str
    rationale: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
