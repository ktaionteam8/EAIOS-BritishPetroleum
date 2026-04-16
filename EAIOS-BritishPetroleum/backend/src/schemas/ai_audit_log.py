from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime


class AIAuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    agent_name: str
    domain_id: str
    model_version: str
    action: str
    input_context: str
    output_summary: str
    confidence_score: float
    status: str
    triggered_by: str
    created_at: datetime
    updated_at: datetime


class AIAuditLogCreate(BaseModel):
    agent_name: str = Field(..., min_length=1, max_length=255)
    domain_id: str = Field(..., min_length=1, max_length=100)
    model_version: str = Field(..., min_length=1, max_length=100)
    action: str = Field(..., min_length=1, max_length=500)
    input_context: str
    output_summary: str
    confidence_score: float = Field(..., ge=0.0, le=100.0)
    status: str = Field(default="auto_executed")
    triggered_by: str = Field(..., min_length=1, max_length=255)
