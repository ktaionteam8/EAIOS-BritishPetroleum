"""
FastAPI Application — Aviation Fuel Logistics (SAFETY-CRITICAL)
================================================================
REST endpoints for aviation fuel supply monitoring at global airports.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.aviation_agent import AviationAgent
from src.services.governance import Tier1Governance, Tier2Governance

app = FastAPI(
    title="BP Supply Chain — Aviation Fuel Logistics",
    version="1.0.0",
    description="Safety-critical aviation fuel supply monitoring microservice",
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
    return {"status": "healthy", "service": "aviation-fuel-logistics", "version": "1.0.0"}


@app.get("/api/agents/aviation")
def get_aviation_results(status: str | None = None, min_risk: float = 0.0):
    agent = AviationAgent()
    results = agent.run()
    if status:
        results = [r for r in results if r["status"] == status]
    results = [r for r in results if r["risk_score"] >= min_risk]
    return {"agent": "AviationAgent", "count": len(results), "results": results}


@app.get("/api/agents/aviation/critical")
def get_aviation_critical():
    agent = AviationAgent()
    results = [r for r in agent.run() if r["status"] == "critical"]
    return {"agent": "AviationAgent", "count": len(results), "critical": results}


@app.get("/api/governance/tier1")
def get_tier1():
    results = AviationAgent().run()
    return Tier1Governance().run({"AviationAgent": results})


@app.get("/api/governance/tier2")
def get_tier2():
    results = AviationAgent().run()
    tier1 = Tier1Governance().run({"AviationAgent": results})
    return Tier2Governance().run(tier1)


@app.get("/api/pipeline/run")
def run_pipeline():
    results = AviationAgent().run()
    tier1 = Tier1Governance().run({"AviationAgent": results})
    tier2 = Tier2Governance().run(tier1)
    return {
        "agents": {"AviationAgent": {"count": len(results), "critical": sum(1 for r in results if r["status"] == "critical")}},
        "governance": {"tier1_summary": tier1["summary"], "tier2_summary": tier2["summary"]},
    }
