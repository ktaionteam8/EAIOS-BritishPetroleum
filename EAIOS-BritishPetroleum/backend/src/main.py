from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from anthropic import AsyncAnthropic

from src.config import settings

# ── Domain routers ────────────────────────────────────────────────────────────
from src.routers.dashboard import router as dashboard_router
from src.routers.alerts import router as alerts_router
from src.routers.equipment import router as equipment_router
from src.routers.ml_models import router as ml_models_router
from src.routers.work_orders import router as work_orders_router
from src.routers.roi import router as roi_router
from src.routers.energy import router as energy_router
from src.routers.compliance import router as compliance_router
from src.routers.tar import router as tar_router
from src.routers.offshore import router as offshore_router
from src.routers.castrol import router as castrol_router
from src.routers.ot_adoption_wave_edge import (
    ot_router, adoption_router, wave_router, edge_router
)
from src.routers.digital_twin import router as digital_twin_router
from src.routers.reliability import router as reliability_router
from src.routers.field_ops import router as field_ops_router

app = FastAPI(
    title="EAIOS BP API",
    version="0.1.0",
    description="Enterprise AI Operating System — British Petroleum",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.allowed_origins.split(",")],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

# ── Register routers ─────────────────────────────────────────────────────────
app.include_router(dashboard_router)
app.include_router(alerts_router)
app.include_router(equipment_router)
app.include_router(ml_models_router)
app.include_router(work_orders_router)
app.include_router(roi_router)
app.include_router(energy_router)
app.include_router(compliance_router)
app.include_router(tar_router)
app.include_router(offshore_router)
app.include_router(castrol_router)
app.include_router(ot_router)
app.include_router(adoption_router)
app.include_router(wave_router)
app.include_router(edge_router)
app.include_router(digital_twin_router)
app.include_router(reliability_router)
app.include_router(field_ops_router)

# Anthropic client — reads ANTHROPIC_API_KEY from environment automatically
_anthropic = AsyncAnthropic()

_SYSTEM_PROMPT = (
    "You are RefinerAI Advisor, an expert AI assistant embedded in British Petroleum's "
    "Enterprise AI Operating System (EAIOS). You specialise in predictive maintenance, "
    "refinery operations, and plant reliability engineering across BP's global refinery fleet.\n\n"
    "Your expertise covers:\n"
    "- Rotating equipment health: compressors, pumps, turbines, heat exchangers\n"
    "- Failure Mode & Effects Analysis (FMEA) and Risk-Based Inspection (RBI)\n"
    "- Remaining Useful Life (RUL) prediction and MTBF/MTTR/OEE analysis\n"
    "- Root Cause Analysis (RCA) methodologies\n"
    "- Turnaround and maintenance planning (TAR)\n"
    "- Spare parts optimisation and procurement\n"
    "- Work order prioritisation and dispatch\n"
    "- Safety and HSE compliance in refinery environments\n\n"
    "Always provide concise, actionable insights. Use markdown formatting for clarity. "
    "When referencing equipment, cite specific actions, costs, and timeframes where possible."
)


class _ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str


class ChatRequest(BaseModel):
    messages: list[_ChatMessage]


@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    Streaming proxy to Claude API for the RefinerAI Advisor tab.
    Requires ANTHROPIC_API_KEY to be set in the environment.
    """
    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    async def generate():
        try:
            async with _anthropic.messages.stream(
                model="claude-opus-4-6",
                max_tokens=2048,
                system=_SYSTEM_PROMPT,
                messages=messages,
                thinking={"type": "adaptive"},
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        except Exception as exc:
            yield f"\n\n⚠️ Error contacting AI: {exc}"

    return StreamingResponse(generate(), media_type="text/plain; charset=utf-8")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "environment": settings.environment,
    }
