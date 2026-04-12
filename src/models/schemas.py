"""Pydantic schemas for IT Service Desk AI API."""

from pydantic import BaseModel


class TicketDecision(BaseModel):
    entity_id: str
    category: str
    severity: str
    team: str
    vip_user: bool
    action: str
    assignee: str
    eta_minutes: int
    rationale: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
