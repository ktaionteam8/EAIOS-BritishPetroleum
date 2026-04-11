"""
FastAPI Application — Castrol Distribution
============================================
REST endpoints for Castrol lubricant distribution monitoring.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.lubricant_agent import LubricantAgent
from src.services.governance import Tier1Governance, Tier2Governance

app = FastAPI(
    title="BP Supply Chain — Castrol Distribution",
    version="1.0.0",
    description="Castrol lubricant distribution monitoring microservice",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "castrol-distribution", "version": "1.0.0"}


@app.get("/api/agents/lubricant")
def get_lubricant_results(status: str | None = None, min_risk: float = 0.0):
    agent = LubricantAgent()
    results = agent.run()
    if status:
        results = [r for r in results if r["status"] == status]
    results = [r for r in results if r["risk_score"] >= min_risk]
    return {"agent": "LubricantAgent", "count": len(results), "results": results}


@app.get("/api/agents/lubricant/critical")
def get_lubricant_critical():
    agent = LubricantAgent()
    results = [r for r in agent.run() if r["status"] == "critical"]
    return {"agent": "LubricantAgent", "count": len(results), "critical": results}


@app.get("/api/governance/tier1")
def get_tier1():
    results = LubricantAgent().run()
    return Tier1Governance().run({"LubricantAgent": results})


@app.get("/api/governance/tier2")
def get_tier2():
    results = LubricantAgent().run()
    tier1 = Tier1Governance().run({"LubricantAgent": results})
    return Tier2Governance().run(tier1)


@app.get("/api/pipeline/run")
def run_pipeline():
    results = LubricantAgent().run()
    tier1 = Tier1Governance().run({"LubricantAgent": results})
    tier2 = Tier2Governance().run(tier1)
    return {
        "agents": {"LubricantAgent": {"count": len(results), "critical": sum(1 for r in results if r["status"] == "critical")}},
        "governance": {"tier1_summary": tier1["summary"], "tier2_summary": tier2["summary"]},
    }
