"""FastAPI — Financial Close Automation."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.financial_close_agent import FinancialCloseAgent

app = FastAPI(
    title="BP Finance — Financial Close Automation",
    version="1.0.0",
    description="Month-end close readiness microservice",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "financial-close-automation", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = FinancialCloseAgent()
    results = agent.run()
    return {
        "agent": "FinancialCloseAgent",
        "count": len(results),
        "close_ready": sum(1 for r in results if r["decision"] == "CLOSE_READY"),
        "pending": sum(1 for r in results if r["decision"] == "PENDING"),
        "issue": sum(1 for r in results if r["decision"] == "ISSUE"),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = FinancialCloseAgent()
    decisions = agent.decisions()
    return {"agent": "FinancialCloseAgent", "actionable_count": len(decisions), "decisions": decisions}
