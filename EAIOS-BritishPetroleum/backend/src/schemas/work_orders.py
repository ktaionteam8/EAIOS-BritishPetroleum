"""Pydantic schemas for work orders and spare parts."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class WorkOrderCreate(BaseModel):
    title: str
    equipment_id: str
    site_id: str
    priority: str = "medium"
    description: Optional[str] = None
    estimated_duration_hours: Optional[float] = None
    cost_estimate: Optional[float] = None
    alert_id: Optional[str] = None
    ai_generated: bool = False


class WorkOrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    wo_number: str
    title: str
    equipment_id: str
    site_id: str
    priority: str
    status: str
    ai_generated: bool
    s4hana_ready: bool
    estimated_duration_hours: Optional[float]
    cost_estimate: Optional[float]
    cost_actual: Optional[float]
    scheduled_start: Optional[datetime]
    due_date: Optional[datetime]
    completed_at: Optional[datetime]
    description: Optional[str]
    created_at: datetime


class WorkOrderStatusUpdate(BaseModel):
    status: str  # open | in-progress | scheduled | completed | cancelled
    cost_actual: Optional[float] = None


class SparePartOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    part_number: str
    description: str
    equipment_types: Optional[list]
    unit_cost: float
    supplier: Optional[str]
    lead_time_days: int
    criticality_score: int


class SparePartStockOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    part_id: str
    site_id: str
    on_hand_qty: int
    min_qty: int
    on_order_qty: int


class ProcurementOrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    po_number: str
    part_id: str
    site_id: str
    quantity: int
    unit_cost: float
    total_cost: float
    status: str
    ordered_date: datetime
    expected_delivery: Optional[datetime]
    urgency_days: Optional[int]


class ProcurementOrderCreate(BaseModel):
    part_id: str
    site_id: str
    quantity: int
    urgency_days: Optional[int] = None
