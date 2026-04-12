"""Pydantic schemas for Workforce Planning API."""

from pydantic import BaseModel


class WorkforceDecision(BaseModel):
    entity_id: str
    business_unit: str
    region: str
    headcount: int
    utilization: float
    gap_fte: float
    action: str
    hires_needed: int
    rationale: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
