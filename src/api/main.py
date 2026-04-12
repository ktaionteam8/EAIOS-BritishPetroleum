"""FastAPI — Compliance Management."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.compliance_agent import ComplianceAgent

app = FastAPI(
    title="BP IT Operations — Compliance Management",
    version="1.0.0",
    description="Control validation and compliance tracking microservice",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "compliance-management", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = ComplianceAgent()
    results = agent.run()
    return {
        "agent": "ComplianceAgent",
        "count": len(results),
        "compliant": sum(1 for r in results if r["status"] == "COMPLIANT"),
        "gap": sum(1 for r in results if r["status"] == "GAP"),
        "violation": sum(1 for r in results if r["status"] == "VIOLATION"),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = ComplianceAgent()
    decisions = agent.decisions()
    return {"agent": "ComplianceAgent", "actionable_count": len(decisions), "decisions": decisions}
