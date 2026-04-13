"""Pydantic schemas for ML model registry."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ShapFeatureOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    feature_name: str
    importance_score: float
    direction: str
    sort_order: int


class MLModelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    model_code: str
    name: str
    model_type: str
    version: str
    status: str
    trained_on: datetime
    accuracy: float
    precision: Optional[float]
    recall: Optional[float]
    f1_score: Optional[float]
    training_samples: Optional[int]
    assets_monitored: Optional[int]
    drift_status: str
    approval_status: str
    is_champion: bool
    created_at: datetime


class MLModelDetail(MLModelOut):
    shap_features: list[ShapFeatureOut] = []


class ModelFeedbackCreate(BaseModel):
    """Operator labelling a prediction as confirmed/false_positive/missed_failure."""
    alert_id: Optional[str] = None
    feedback_type: str  # confirmed | false_positive | missed_failure
    provided_by_user_id: Optional[str] = None
    notes: Optional[str] = None


class ModelFeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    model_id: str
    alert_id: Optional[str]
    feedback_type: str
    provided_by_user_id: Optional[str]
    notes: Optional[str]
