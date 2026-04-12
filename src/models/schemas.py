"""Pydantic schemas for Energy Transition Reskilling API."""

from pydantic import BaseModel


class ReskillingDecision(BaseModel):
    entity_id: str
    current_role: str
    target_role: str
    role_demand_trend: float
    transferable_skills_pct: float
    learning_agility: float
    action: str
    recommended_training_hours: int
    priority: str
    rationale: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
