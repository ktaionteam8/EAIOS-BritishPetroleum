"""FastAPI — Workforce Planning."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.workforce_agent import WorkforceAgent

app = FastAPI(
    title="BP HR & Safety — Workforce Planning",
    version="1.0.0",
    description="Hiring demand prediction microservice",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "workforce-planning", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = WorkforceAgent()
    results = agent.run()
    return {
        "agent": "WorkforceAgent",
        "count": len(results),
        "hire": sum(1 for r in results if r["action"] == "HIRE"),
        "redeploy": sum(1 for r in results if r["action"] == "REDEPLOY"),
        "maintain": sum(1 for r in results if r["action"] == "MAINTAIN"),
        "total_hires_needed": sum(r["hires_needed"] for r in results),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = WorkforceAgent()
    decisions = agent.decisions()
    return {"agent": "WorkforceAgent", "actionable_count": len(decisions), "decisions": decisions}
