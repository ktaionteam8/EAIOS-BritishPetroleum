"""
FastAPI Application — Retail Fuel Optimization
=================================================
REST endpoints for retail gas station monitoring.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.retail_agent import RetailAgent
from src.services.governance import Tier1Governance, Tier2Governance

app = FastAPI(
    title="BP Supply Chain — Retail Fuel Optimization",
    version="1.0.0",
    description="Retail gas station inventory and demand monitoring microservice",
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
    return {"status": "healthy", "service": "retail-fuel-optimization", "version": "1.0.0"}


@app.get("/api/agents/retail")
def get_retail_results(status: str | None = None, min_risk: float = 0.0):
    agent = RetailAgent()
    results = agent.run()
    if status:
        results = [r for r in results if r["status"] == status]
    results = [r for r in results if r["risk_score"] >= min_risk]
    return {"agent": "RetailAgent", "count": len(results), "results": results}


@app.get("/api/agents/retail/critical")
def get_retail_critical():
    agent = RetailAgent()
    results = [r for r in agent.run() if r["status"] == "critical"]
    return {"agent": "RetailAgent", "count": len(results), "critical": results}


@app.get("/api/governance/tier1")
def get_tier1():
    results = RetailAgent().run()
    return Tier1Governance().run({"RetailAgent": results})


@app.get("/api/governance/tier2")
def get_tier2():
    results = RetailAgent().run()
    tier1 = Tier1Governance().run({"RetailAgent": results})
    return Tier2Governance().run(tier1)


@app.get("/api/pipeline/run")
def run_pipeline():
    results = RetailAgent().run()
    tier1 = Tier1Governance().run({"RetailAgent": results})
    tier2 = Tier2Governance().run(tier1)
    return {
        "agents": {"RetailAgent": {"count": len(results), "critical": sum(1 for r in results if r["status"] == "critical")}},
        "governance": {"tier1_summary": tier1["summary"], "tier2_summary": tier2["summary"]},
    }
