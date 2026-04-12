"""FastAPI — Carbon Credit Trading."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.carbon_credit_agent import CarbonCreditAgent

app = FastAPI(
    title="BP Commercial Trading — Carbon Credit Trading",
    version="1.0.0",
    description="Carbon credit BUY/SELL/HOLD recommendation microservice",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "carbon-credit-trading", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = CarbonCreditAgent()
    results = agent.run()
    return {
        "agent": "CarbonCreditAgent",
        "count": len(results),
        "buy": sum(1 for r in results if r["recommendation"] == "BUY"),
        "sell": sum(1 for r in results if r["recommendation"] == "SELL"),
        "hold": sum(1 for r in results if r["recommendation"] == "HOLD"),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = CarbonCreditAgent()
    decisions = agent.decisions()
    return {"agent": "CarbonCreditAgent", "actionable_count": len(decisions), "decisions": decisions}
