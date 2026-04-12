"""Pydantic schemas for Threat Detection API."""

from pydantic import BaseModel


class ThreatEvent(BaseModel):
    entity_id: str
    event_type: str
    source_ip: str
    user: str
    anomaly_score: float
    ioc_matches: int
    threat_score: float
    classification: str
    action: str
    priority: str
    rationale: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
