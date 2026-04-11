"""
FastAPI Application — Marine Bunkering
========================================
REST endpoints for multimodal logistics shipment monitoring.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.logistics_agent import LogisticsAgent
from src.services.governance import Tier1Governance, Tier2Governance

app = FastAPI(
    title="BP Supply Chain — Marine Bunkering",
    version="1.0.0",
    description="Multimodal logistics and marine bunkering monitoring microservice",
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
    return {"status": "healthy", "service": "marine-bunkering", "version": "1.0.0"}


@app.get("/api/agents/logistics")
def get_logistics_results(status: str | None = None, min_risk: float = 0.0):
    agent = LogisticsAgent()
    results = agent.run()
    if status:
        results = [r for r in results if r["status"] == status]
    results = [r for r in results if r["risk_score"] >= min_risk]
    return {"agent": "LogisticsAgent", "count": len(results), "results": results}


@app.get("/api/agents/logistics/critical")
def get_logistics_critical():
    agent = LogisticsAgent()
    results = [r for r in agent.run() if r["status"] == "critical"]
    return {"agent": "LogisticsAgent", "count": len(results), "critical": results}


@app.get("/api/governance/tier1")
def get_tier1():
    results = LogisticsAgent().run()
    return Tier1Governance().run({"LogisticsAgent": results})


@app.get("/api/governance/tier2")
def get_tier2():
    results = LogisticsAgent().run()
    tier1 = Tier1Governance().run({"LogisticsAgent": results})
    return Tier2Governance().run(tier1)


@app.get("/api/pipeline/run")
def run_pipeline():
    results = LogisticsAgent().run()
    tier1 = Tier1Governance().run({"LogisticsAgent": results})
    tier2 = Tier2Governance().run(tier1)
    return {
        "agents": {"LogisticsAgent": {"count": len(results), "critical": sum(1 for r in results if r["status"] == "critical")}},
        "governance": {"tier1_summary": tier1["summary"], "tier2_summary": tier2["summary"]},
    }
