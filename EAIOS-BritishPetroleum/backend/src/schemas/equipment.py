"""Pydantic schemas for equipment and sensor readings."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class EquipmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tag: str
    name: str
    equipment_type: str
    site_id: str
    manufacturer: Optional[str]
    model_number: Optional[str]
    health_score: float
    rul_hours: Optional[float]
    ai_status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class EquipmentUpdate(BaseModel):
    health_score: Optional[float] = None
    rul_hours: Optional[float] = None
    ai_status: Optional[str] = None


class SensorReadingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    equipment_id: str
    tag_name: str
    sensor_type: str
    value: float
    unit: str
    timestamp: datetime
    quality: str


class SensorReadingCreate(BaseModel):
    tag_name: str
    sensor_type: str
    value: float
    unit: str
    quality: str = "good"
