"""ML model registry, drift, feedback, SHAP, active learning."""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class MLModel(Base):
    __tablename__ = "ml_models"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    model_code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)  # MDL-001
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    model_type: Mapped[str] = mapped_column(String(60), nullable=False)  # LSTM | XGBoost | CNN | etc
    version: Mapped[str] = mapped_column(String(20), nullable=False)
    # production | staging | retired
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="staging", index=True)
    trained_on: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    accuracy: Mapped[float] = mapped_column(Float, nullable=False)
    precision: Mapped[float] = mapped_column(Float, nullable=True)
    recall: Mapped[float] = mapped_column(Float, nullable=True)
    f1_score: Mapped[float] = mapped_column(Float, nullable=True)
    training_samples: Mapped[int] = mapped_column(Integer, nullable=True)
    assets_monitored: Mapped[int] = mapped_column(Integer, nullable=True)
    # OK | WARNING | CRITICAL
    drift_status: Mapped[str] = mapped_column(String(20), nullable=False, default="OK")
    # approved | pending | revoked
    approval_status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    is_champion: Mapped[bool] = mapped_column(Boolean, default=False)
    approved_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    drift_metrics: Mapped[list["ModelDriftMetric"]] = relationship("ModelDriftMetric", back_populates="model", cascade="all, delete-orphan")
    shap_features: Mapped[list["ShapFeatureImportance"]] = relationship("ShapFeatureImportance", back_populates="model", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<MLModel {self.model_code} {self.version}>"


class ModelDriftMetric(Base):
    __tablename__ = "model_drift_metrics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    model_id: Mapped[str] = mapped_column(String(36), ForeignKey("ml_models.id"), nullable=False, index=True)
    measured_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_now)
    feature_drift_score: Mapped[float] = mapped_column(Float, nullable=False)
    concept_drift_score: Mapped[float] = mapped_column(Float, nullable=False)
    psi_score: Mapped[float] = mapped_column(Float, nullable=False)
    # OK | WARNING | CRITICAL
    alert_level: Mapped[str] = mapped_column(String(20), nullable=False, default="OK")

    model: Mapped["MLModel"] = relationship("MLModel", back_populates="drift_metrics")


class ShapFeatureImportance(Base):
    __tablename__ = "shap_feature_importance"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    model_id: Mapped[str] = mapped_column(String(36), ForeignKey("ml_models.id"), nullable=False, index=True)
    feature_name: Mapped[str] = mapped_column(String(120), nullable=False)
    importance_score: Mapped[float] = mapped_column(Float, nullable=False)
    # positive | negative
    direction: Mapped[str] = mapped_column(String(20), nullable=False, default="positive")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    model: Mapped["MLModel"] = relationship("MLModel", back_populates="shap_features")


class ModelFeedback(Base):
    __tablename__ = "model_feedback"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    model_id: Mapped[str] = mapped_column(String(36), ForeignKey("ml_models.id"), nullable=False, index=True)
    alert_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("alerts.id"), nullable=True)
    # confirmed | false_positive | missed_failure
    feedback_type: Mapped[str] = mapped_column(String(30), nullable=False)
    provided_by_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class ActiveLearningQueue(Base):
    __tablename__ = "active_learning_queue"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    model_id: Mapped[str] = mapped_column(String(36), ForeignKey("ml_models.id"), nullable=False, index=True)
    equipment_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("equipment.id"), nullable=True)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    sensor_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # pending | reviewed | labelled | rejected
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    reviewer_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    label: Mapped[str | None] = mapped_column(String(40), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class RetrainingRun(Base):
    __tablename__ = "retraining_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    model_id: Mapped[str] = mapped_column(String(36), ForeignKey("ml_models.id"), nullable=False, index=True)
    trigger: Mapped[str] = mapped_column(String(80), nullable=False)  # drift | scheduled | manual
    started_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    new_accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)
    new_f1: Mapped[float | None] = mapped_column(Float, nullable=True)
    # running | success | failed
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="running")
    changelog: Mapped[str | None] = mapped_column(Text, nullable=True)
    training_samples_used: Mapped[int | None] = mapped_column(Integer, nullable=True)
