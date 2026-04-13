"""Pydantic schemas for the dashboard summary endpoint."""
from pydantic import BaseModel, ConfigDict


class SiteSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    code: str
    country: str
    status: str


class EquipmentSummary(BaseModel):
    id: str
    tag: str
    name: str
    site_name: str
    health_score: float
    rul_hours: float | None
    ai_status: str


class DashboardStats(BaseModel):
    total_equipment: int
    critical_count: int
    warning_count: int
    healthy_count: int
    active_alerts: int
    open_work_orders: int
    avoided_cost_usd: float
    fleet_oee_pct: float


class DashboardOut(BaseModel):
    stats: DashboardStats
    sites: list[SiteSummary]
    top_risks: list[EquipmentSummary]
