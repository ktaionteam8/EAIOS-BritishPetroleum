"""FastAPI — Crude Trading Analytics."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.crude_trading_agent import CrudeTradingAgent

app = FastAPI(
    title="BP Commercial Trading — Crude Trading Analytics",
    version="1.0.0",
    description="Crude oil trading BUY/SELL/HOLD recommendation microservice",
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
    return {"status": "healthy", "service": "crude-trading-analytics", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = CrudeTradingAgent()
    results = agent.run()
    return {
        "agent": "CrudeTradingAgent",
        "count": len(results),
        "buy": sum(1 for r in results if r["recommendation"] == "BUY"),
        "sell": sum(1 for r in results if r["recommendation"] == "SELL"),
        "hold": sum(1 for r in results if r["recommendation"] == "HOLD"),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = CrudeTradingAgent()
    decisions = agent.decisions()
    return {
        "agent": "CrudeTradingAgent",
        "actionable_count": len(decisions),
        "decisions": decisions,
    }
