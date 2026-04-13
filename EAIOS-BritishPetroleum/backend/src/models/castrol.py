"""Castrol blending: blend runs, sensor data, LIMS results, dosing."""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class BlendSpecification(Base):
    __tablename__ = "blend_specifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    grade_name: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)
    viscosity_target: Mapped[float] = mapped_column(Float, nullable=False)
    viscosity_tol_low: Mapped[float] = mapped_column(Float, nullable=False)
    viscosity_tol_high: Mapped[float] = mapped_column(Float, nullable=False)
    pour_point_target: Mapped[float] = mapped_column(Float, nullable=False)
    tbn_target: Mapped[float] = mapped_column(Float, nullable=False)
    density_target: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class BlendRun(Base):
    __tablename__ = "blend_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    batch_code: Mapped[str] = mapped_column(String(30), nullable=False, unique=True, index=True)
    grade_name: Mapped[str] = mapped_column(String(80), nullable=False)
    site_id: Mapped[str] = mapped_column(String(36), ForeignKey("sites.id"), nullable=False, index=True)
    tank_id: Mapped[str | None] = mapped_column(String(30), nullable=True)
    target_volume_liters: Mapped[float] = mapped_column(Float, nullable=False)
    progress_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    # in-progress | complete | rework | cancelled
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="in-progress", index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    sensor_readings: Mapped[list["BlendSensorReading"]] = relationship("BlendSensorReading", back_populates="blend", cascade="all, delete-orphan")
    quality_predictions: Mapped[list["BlendQualityPrediction"]] = relationship("BlendQualityPrediction", back_populates="blend", cascade="all, delete-orphan")
    lims_result: Mapped["LimsResult | None"] = relationship("LimsResult", back_populates="blend", uselist=False)


class BlendSensorReading(Base):
    __tablename__ = "blend_sensor_readings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    blend_id: Mapped[str] = mapped_column(String(36), ForeignKey("blend_runs.id"), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_now)
    temperature_c: Mapped[float] = mapped_column(Float, nullable=False)
    viscosity_cst: Mapped[float] = mapped_column(Float, nullable=False)
    density_kg_m3: Mapped[float | None] = mapped_column(Float, nullable=True)
    dosing_rate_kg_min: Mapped[float | None] = mapped_column(Float, nullable=True)

    blend: Mapped["BlendRun"] = relationship("BlendRun", back_populates="sensor_readings")


class BlendQualityPrediction(Base):
    __tablename__ = "blend_quality_predictions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    blend_id: Mapped[str] = mapped_column(String(36), ForeignKey("blend_runs.id"), nullable=False, index=True)
    predicted_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_now)
    viscosity_predicted: Mapped[float] = mapped_column(Float, nullable=False)
    pour_point_predicted: Mapped[float] = mapped_column(Float, nullable=False)
    tbn_predicted: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_low: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence_high: Mapped[float | None] = mapped_column(Float, nullable=True)
    # on-spec | off-spec | borderline
    prediction_status: Mapped[str] = mapped_column(String(20), nullable=False, default="on-spec")

    blend: Mapped["BlendRun"] = relationship("BlendRun", back_populates="quality_predictions")


class LimsResult(Base):
    __tablename__ = "lims_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    blend_id: Mapped[str] = mapped_column(String(36), ForeignKey("blend_runs.id"), nullable=False, unique=True, index=True)
    test_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    viscosity_measured: Mapped[float] = mapped_column(Float, nullable=False)
    pour_point_measured: Mapped[float] = mapped_column(Float, nullable=False)
    tbn_measured: Mapped[float] = mapped_column(Float, nullable=False)
    water_content_ppm: Mapped[float | None] = mapped_column(Float, nullable=True)
    particle_count: Mapped[float | None] = mapped_column(Float, nullable=True)
    # PASS | FAIL
    result_status: Mapped[str] = mapped_column(String(10), nullable=False)
    rework_required: Mapped[bool] = mapped_column(Boolean, default=False)
    lab_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    blend: Mapped["BlendRun"] = relationship("BlendRun", back_populates="lims_result")
