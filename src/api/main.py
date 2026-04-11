"""
FastAPI Application — Demand-Supply Matching
=============================================
Provides REST endpoints for crude supply monitoring,
refinery operations, and governance decisions.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.crude_agent import CrudeAgent
from src.agents.refinery_agent import RefineryAgent
from src.services.governance import Tier1Governance, Tier2Governance

app = FastAPI(
    title="BP Supply Chain — Demand-Supply Matching",
    version="1.0.0",
    description="Crude procurement and refinery demand matching microservice",
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
    return {"status": "healthy", "service": "demand-supply-matching", "version": "1.0.0"}


@app.get("/api/agents/crude")
def get_crude_results(status: str | None = None, min_risk: float = 0.0):
    agent = CrudeAgent()
    results = agent.run()
    if status:
        results = [r for r in results if r["status"] == status]
    results = [r for r in results if r["risk_score"] >= min_risk]
    return {"agent": "CrudeAgent", "count": len(results), "results": results}


@app.get("/api/agents/crude/critical")
def get_crude_critical():
    agent = CrudeAgent()
    results = [r for r in agent.run() if r["status"] == "critical"]
    return {"agent": "CrudeAgent", "count": len(results), "critical": results}


@app.get("/api/agents/refinery")
def get_refinery_results(status: str | None = None, min_risk: float = 0.0):
    agent = RefineryAgent()
    results = agent.run()
    if status:
        results = [r for r in results if r["status"] == status]
    results = [r for r in results if r["risk_score"] >= min_risk]
    return {"agent": "RefineryAgent", "count": len(results), "results": results}


@app.get("/api/agents/refinery/critical")
def get_refinery_critical():
    agent = RefineryAgent()
    results = [r for r in agent.run() if r["status"] == "critical"]
    return {"agent": "RefineryAgent", "count": len(results), "critical": results}


@app.get("/api/governance/tier1")
def get_tier1_governance():
    crude = CrudeAgent().run()
    refinery = RefineryAgent().run()
    tier1 = Tier1Governance().run({"CrudeAgent": crude, "RefineryAgent": refinery})
    return tier1


@app.get("/api/governance/tier2")
def get_tier2_governance():
    crude = CrudeAgent().run()
    refinery = RefineryAgent().run()
    tier1 = Tier1Governance().run({"CrudeAgent": crude, "RefineryAgent": refinery})
    tier2 = Tier2Governance().run(tier1)
    return tier2


@app.get("/api/pipeline/run")
def run_full_pipeline():
    crude = CrudeAgent().run()
    refinery = RefineryAgent().run()
    tier1 = Tier1Governance().run({"CrudeAgent": crude, "RefineryAgent": refinery})
    tier2 = Tier2Governance().run(tier1)
    return {
        "agents": {
            "CrudeAgent": {"count": len(crude), "critical": sum(1 for r in crude if r["status"] == "critical")},
            "RefineryAgent": {"count": len(refinery), "critical": sum(1 for r in refinery if r["status"] == "critical")},
        },
        "governance": {"tier1_summary": tier1["summary"], "tier2_summary": tier2["summary"]},
    }
