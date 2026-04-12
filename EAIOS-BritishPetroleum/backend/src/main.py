from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from anthropic import AsyncAnthropic

from src.config import settings

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
