"""Pydantic schemas for alerts, SHAP signals, analogues, decisions, audit log."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ShapSignalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    signal_name: str
    values: list
    contribution: float
    unit: str
    sort_order: int


class AnalogueOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    site_name: str
    event_date: str
    outcome: str
    days_to_failure: int
    match_score: int


class AlertListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    alert_code: str
    severity: str
    title: str
    equipment_id: str
    site_id: str
    failure_mode: str
    probability: float
    etf_days: float
    etf_min: float
    etf_max: float
    recommendation: str
    status: str
    created_at: datetime


class AlertDetail(AlertListItem):
    details: Optional[str]
    is_push_sent: bool
    updated_at: datetime
    shap_signals: list[ShapSignalOut] = []
    analogues: list[AnalogueOut] = []


class DecisionCreate(BaseModel):
    """POST body when an engineer accepts / modifies / overrides an alert."""
    user_id: str
    decision: str  # accepted | modified | overridden
    reason_code: Optional[str] = None
    modified_action: Optional[str] = None
    modified_timing: Optional[str] = None


class DecisionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    alert_id: str
    user_id: str
    decision: str
    reason_code: Optional[str]
    modified_action: Optional[str]
    modified_timing: Optional[str]
    wo_number: Optional[str]
    decided_at: datetime


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    alert_id: str
    alert_title: str
    decision: str
    user_id: str
    user_name: str
    reason_code: Optional[str]
    wo_number: Optional[str]
    timestamp: datetime
