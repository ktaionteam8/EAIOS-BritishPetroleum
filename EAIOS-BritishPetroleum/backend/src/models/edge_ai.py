"""Edge AI: nodes, model deployments, latency benchmarks."""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class EdgeNode(Base):
    __tablename__ = "edge_nodes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    node_code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    site_id: Mapped[str] = mapped_column(String(36), ForeignKey("sites.id"), nullable=False, index=True)
    hardware_spec: Mapped[str] = mapped_column(String(120), nullable=False)
    # online | degraded | offline
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="online", index=True)
    inference_offload_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    avg_latency_ms: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    cpu_usage_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    memory_usage_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    disk_usage_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    installed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_sync_label: Mapped[str | None] = mapped_column(String(30), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    deployments: Mapped[list["EdgeModelDeployment"]] = relationship("EdgeModelDeployment", back_populates="node", cascade="all, delete-orphan")


class EdgeModelDeployment(Base):
    __tablename__ = "edge_model_deployments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    model_id: Mapped[str] = mapped_column(String(36), ForeignKey("ml_models.id"), nullable=False, index=True)
    node_id: Mapped[str] = mapped_column(String(36), ForeignKey("edge_nodes.id"), nullable=False, index=True)
    model_version: Mapped[str] = mapped_column(String(20), nullable=False)
    model_size_mb: Mapped[float] = mapped_column(Float, nullable=False)
    quantization_method: Mapped[str | None] = mapped_column(String(40), nullable=True)
    # deployed | updating | failed
    deployment_status: Mapped[str] = mapped_column(String(20), nullable=False, default="deployed")
    deployed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_now)
    last_inference_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    node: Mapped["EdgeNode"] = relationship("EdgeNode", back_populates="deployments")


class LatencyBenchmark(Base):
    __tablename__ = "latency_benchmarks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    scenario_description: Mapped[str] = mapped_column(String(120), nullable=False)
    edge_latency_ms: Mapped[float] = mapped_column(Float, nullable=False)
    cloud_latency_ms: Mapped[float] = mapped_column(Float, nullable=False)
    latency_saving_pct: Mapped[float] = mapped_column(Float, nullable=False)
    benchmark_date: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_now)
    node_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("edge_nodes.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
