"""FastAPI — Tax Compliance."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.tax_compliance_agent import TaxComplianceAgent

app = FastAPI(
    title="BP Finance — Tax Compliance",
    version="1.0.0",
    description="Regional tax rule validation microservice",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "tax-compliance", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = TaxComplianceAgent()
    results = agent.run()
    return {
        "agent": "TaxComplianceAgent",
        "count": len(results),
        "compliant": sum(1 for r in results if r["decision"] == "COMPLIANT"),
        "risk": sum(1 for r in results if r["decision"] == "RISK"),
        "non_compliant": sum(1 for r in results if r["decision"] == "NON_COMPLIANT"),
        "total_estimated_gap": round(sum(r["estimated_tax_gap"] for r in results if r["decision"] != "COMPLIANT"), 2),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = TaxComplianceAgent()
    decisions = agent.decisions()
    return {"agent": "TaxComplianceAgent", "actionable_count": len(decisions), "decisions": decisions}
