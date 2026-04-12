"""Pydantic schemas for Aviation Fuel Forecasting API."""

from pydantic import BaseModel


class ConfidenceInterval(BaseModel):
    lower: int
    upper: int


class AviationForecast(BaseModel):
    entity_id: str
    airport: str
    route: str
    forecast_volume_bbl: int
    forecast_horizon_days: int
    trend: str
    confidence: float
    confidence_interval: ConfidenceInterval
    rationale: str
    agent: str
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
