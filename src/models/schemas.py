"""Pydantic schemas for Infrastructure Monitoring API."""

from pydantic import BaseModel


class InfraDecision(BaseModel):
    entity_id: str
    service_name: str
    environment: str
    cpu_pct: float
    mem_pct: float
    disk_pct: float
    latency_p95_ms: float
    error_rate: float
    action: str
    priority: str
    rationale: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
