"""ML Model registry model."""

import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from .database import Base


class MLModel(Base):
    __tablename__ = "refiner_ai_ml_models"

    id: Mapped[uuid.UUID]            = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str]                = mapped_column(String(255), nullable=False)
    model_type: Mapped[str]          = mapped_column(String(100), nullable=False)
    accuracy: Mapped[float]          = mapped_column(Float, nullable=False)
    precision: Mapped[float]         = mapped_column(Float, nullable=True)
    recall: Mapped[float]            = mapped_column(Float, nullable=True)
    f1_score: Mapped[float]          = mapped_column(Float, nullable=True)
    assets_monitored: Mapped[int]    = mapped_column(Integer, default=0)
    status: Mapped[str]              = mapped_column(SAEnum("active", "training", "deprecated", name="model_status"), default="active")
    last_trained: Mapped[datetime]   = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime]     = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<MLModel {self.name} [{self.model_type}] acc={self.accuracy}>"
