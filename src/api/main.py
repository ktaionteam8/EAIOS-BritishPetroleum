"""FastAPI — Energy Transition Reskilling."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.reskilling_agent import ReskillingAgent

app = FastAPI(
    title="BP HR & Safety — Energy Transition Reskilling",
    version="1.0.0",
    description="Reskilling recommendation for workforce energy transition",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "energy-transition-reskilling", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = ReskillingAgent()
    results = agent.run()
    return {
        "agent": "ReskillingAgent",
        "count": len(results),
        "reskill": sum(1 for r in results if r["action"] == "RESKILL"),
        "upskill": sum(1 for r in results if r["action"] == "UPSKILL"),
        "hold": sum(1 for r in results if r["action"] == "HOLD"),
        "total_training_hours": sum(r["recommended_training_hours"] for r in results),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = ReskillingAgent()
    decisions = agent.decisions()
    return {"agent": "ReskillingAgent", "actionable_count": len(decisions), "decisions": decisions}
