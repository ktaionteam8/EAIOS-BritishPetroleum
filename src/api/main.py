"""FastAPI — Safety Incident Prediction."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.safety_agent import SafetyAgent

app = FastAPI(
    title="BP HR & Safety — Safety Incident Prediction",
    version="1.0.0",
    description="Safety-critical incident risk prediction microservice",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "safety-incident-prediction", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = SafetyAgent()
    results = agent.run()
    return {
        "agent": "SafetyAgent",
        "count": len(results),
        "alert": sum(1 for r in results if r["status"] == "ALERT"),
        "monitor": sum(1 for r in results if r["status"] == "MONITOR"),
        "normal": sum(1 for r in results if r["status"] == "NORMAL"),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = SafetyAgent()
    decisions = agent.decisions()
    return {"agent": "SafetyAgent", "actionable_count": len(decisions), "decisions": decisions}
