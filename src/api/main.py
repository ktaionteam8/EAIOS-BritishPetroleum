"""
FastAPI Application — Inventory Management
=============================================
REST endpoints for warehouse inventory monitoring.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.inventory_agent import InventoryAgent
from src.services.governance import Tier1Governance, Tier2Governance

app = FastAPI(
    title="BP Supply Chain — Inventory Management",
    version="1.0.0",
    description="Warehouse inventory monitoring and optimization microservice",
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
    return {"status": "healthy", "service": "inventory-management", "version": "1.0.0"}


@app.get("/api/agents/inventory")
def get_inventory_results(status: str | None = None, min_risk: float = 0.0):
    agent = InventoryAgent()
    results = agent.run()
    if status:
        results = [r for r in results if r["status"] == status]
    results = [r for r in results if r["risk_score"] >= min_risk]
    return {"agent": "InventoryAgent", "count": len(results), "results": results}


@app.get("/api/agents/inventory/critical")
def get_inventory_critical():
    agent = InventoryAgent()
    results = [r for r in agent.run() if r["status"] == "critical"]
    return {"agent": "InventoryAgent", "count": len(results), "critical": results}


@app.get("/api/governance/tier1")
def get_tier1():
    results = InventoryAgent().run()
    return Tier1Governance().run({"InventoryAgent": results})


@app.get("/api/governance/tier2")
def get_tier2():
    results = InventoryAgent().run()
    tier1 = Tier1Governance().run({"InventoryAgent": results})
    return Tier2Governance().run(tier1)


@app.get("/api/pipeline/run")
def run_pipeline():
    results = InventoryAgent().run()
    tier1 = Tier1Governance().run({"InventoryAgent": results})
    tier2 = Tier2Governance().run(tier1)
    return {
        "agents": {"InventoryAgent": {"count": len(results), "critical": sum(1 for r in results if r["status"] == "critical")}},
        "governance": {"tier1_summary": tier1["summary"], "tier2_summary": tier2["summary"]},
    }
