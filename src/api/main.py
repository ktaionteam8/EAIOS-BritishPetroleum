"""FastAPI — Talent Analytics."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.talent_analytics_agent import TalentAnalyticsAgent

app = FastAPI(
    title="BP HR & Safety — Talent Analytics",
    version="1.0.0",
    description="Employee performance and retention analytics microservice",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "talent-analytics", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = TalentAnalyticsAgent()
    results = agent.run()
    return {
        "agent": "TalentAnalyticsAgent",
        "count": len(results),
        "promote": sum(1 for r in results if r["action"] == "PROMOTE"),
        "retain": sum(1 for r in results if r["action"] == "RETAIN"),
        "review": sum(1 for r in results if r["action"] == "REVIEW"),
        "maintain": sum(1 for r in results if r["action"] == "MAINTAIN"),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = TalentAnalyticsAgent()
    decisions = agent.decisions()
    return {"agent": "TalentAnalyticsAgent", "actionable_count": len(decisions), "decisions": decisions}
