"""FastAPI — Contractor Management."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.contractor_agent import ContractorAgent

app = FastAPI(
    title="BP HR & Safety — Contractor Management",
    version="1.0.0",
    description="Contractor efficiency and compliance tracking microservice",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "contractor-management", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = ContractorAgent()
    results = agent.run()
    return {
        "agent": "ContractorAgent",
        "count": len(results),
        "retain": sum(1 for r in results if r["action"] == "RETAIN"),
        "maintain": sum(1 for r in results if r["action"] == "MAINTAIN"),
        "review": sum(1 for r in results if r["action"] == "REVIEW"),
        "replace": sum(1 for r in results if r["action"] == "REPLACE"),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = ContractorAgent()
    decisions = agent.decisions()
    return {"agent": "ContractorAgent", "actionable_count": len(decisions), "decisions": decisions}
