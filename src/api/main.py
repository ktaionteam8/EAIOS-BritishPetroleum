"""FastAPI — Treasury Management."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.treasury_agent import TreasuryAgent

app = FastAPI(
    title="BP Finance — Treasury Management",
    version="1.0.0",
    description="Cash flow and liquidity management microservice",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "treasury-management", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = TreasuryAgent()
    results = agent.run()
    return {
        "agent": "TreasuryAgent",
        "count": len(results),
        "invest": sum(1 for r in results if r["decision"] == "INVEST"),
        "hold": sum(1 for r in results if r["decision"] == "HOLD"),
        "alert": sum(1 for r in results if r["decision"] == "ALERT"),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = TreasuryAgent()
    decisions = agent.decisions()
    return {"agent": "TreasuryAgent", "actionable_count": len(decisions), "decisions": decisions}
