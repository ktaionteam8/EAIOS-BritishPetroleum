"""Pydantic schemas for Aviation Fuel Logistics API."""

from pydantic import BaseModel


class AgentResult(BaseModel):
    entity_id: str
    entity_type: str
    status: str
    risk_score: float
    reason: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
