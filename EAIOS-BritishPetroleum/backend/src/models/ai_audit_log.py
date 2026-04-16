from sqlalchemy import String, Text, Float, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from .database import Base


class AIAuditLog(Base):
    """Black-box recorder for every AI decision across all EAIOS agents."""
    __tablename__ = "ai_audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Identity
    agent_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    domain_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    model_version: Mapped[str] = mapped_column(String(100), nullable=False)

    # Decision data
    action: Mapped[str] = mapped_column(String(500), nullable=False)
    input_context: Mapped[str] = mapped_column(Text, nullable=False)
    output_summary: Mapped[str] = mapped_column(Text, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)

    # Outcome
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="auto_executed", index=True
    )  # auto_executed | approved | rejected | pending_review

    # Attribution
    triggered_by: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        return f"<AIAuditLog {self.agent_name} | {self.action[:40]} | {self.status}>"
