"""Pydantic schemas for Skills Gap Analysis API."""

from pydantic import BaseModel


class SkillsGapDecision(BaseModel):
    entity_id: str
    role: str
    skill: str
    required_level: float
    current_level: float
    gap: float
    action: str
    priority: str
    rationale: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
