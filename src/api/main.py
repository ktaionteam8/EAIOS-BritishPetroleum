"""FastAPI — JV Accounting."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.jv_accounting_agent import JVAccountingAgent

app = FastAPI(
    title="BP Finance — JV Accounting",
    version="1.0.0",
    description="Joint venture partner-share reconciliation microservice",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "jv-accounting", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = JVAccountingAgent()
    results = agent.run()
    return {
        "agent": "JVAccountingAgent",
        "count": len(results),
        "balanced": sum(1 for r in results if r["decision"] == "BALANCED"),
        "mismatch": sum(1 for r in results if r["decision"] == "MISMATCH"),
        "review": sum(1 for r in results if r["decision"] == "REVIEW"),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = JVAccountingAgent()
    decisions = agent.decisions()
    return {"agent": "JVAccountingAgent", "actionable_count": len(decisions), "decisions": decisions}
