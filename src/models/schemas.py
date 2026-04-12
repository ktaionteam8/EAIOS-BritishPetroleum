"""Pydantic schemas for Master Agent Orchestrator API."""

from typing import Any

from pydantic import BaseModel


class DomainInput(BaseModel):
    source: str  # "live" or "mock"
    top_decision: str
    actionable_count: int


class MasterDecision(BaseModel):
    final_decision: str
    confidence: float
    reason: str
    actions: list[str]
    triggered_rules: list[str]
    agent: str
    timestamp: str
    domain_inputs: dict[str, DomainInput]


class DecisionOnly(BaseModel):
    final_decision: str
    confidence: float
    reason: str
    actions: list[str]
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
