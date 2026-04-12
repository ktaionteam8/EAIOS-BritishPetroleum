"""FastAPI — LNG Trading Platform."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.lng_trading_agent import LNGTradingAgent

app = FastAPI(
    title="BP Commercial Trading — LNG Trading Platform",
    version="1.0.0",
    description="LNG cargo cross-hub arbitrage microservice (TTF vs JKM)",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "lng-trading-platform", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = LNGTradingAgent()
    results = agent.run()
    return {
        "agent": "LNGTradingAgent",
        "count": len(results),
        "buy": sum(1 for r in results if r["recommendation"] == "BUY"),
        "sell": sum(1 for r in results if r["recommendation"] == "SELL"),
        "hold": sum(1 for r in results if r["recommendation"] == "HOLD"),
        "total_expected_pnl": round(sum(r["expected_pnl"] for r in results), 2),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = LNGTradingAgent()
    decisions = agent.decisions()
    return {"agent": "LNGTradingAgent", "actionable_count": len(decisions), "decisions": decisions}
