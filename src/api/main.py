"""FastAPI — Cross-Commodity Arbitrage."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.arbitrage_agent import ArbitrageAgent

app = FastAPI(
    title="BP Commercial Trading — Cross-Commodity Arbitrage",
    version="1.0.0",
    description="Cross-commodity pair arbitrage detection microservice",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "cross-commodity-arbitrage", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = ArbitrageAgent()
    results = agent.run()
    return {
        "agent": "ArbitrageAgent",
        "count": len(results),
        "detected": sum(1 for r in results if r["status"] == "DETECTED"),
        "none": sum(1 for r in results if r["status"] == "NONE"),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = ArbitrageAgent()
    decisions = agent.decisions()
    return {"agent": "ArbitrageAgent", "actionable_count": len(decisions), "decisions": decisions}
