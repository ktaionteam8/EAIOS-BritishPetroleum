"""FastAPI — Castrol Pricing Engine."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.castrol_pricing_agent import CastrolPricingAgent

app = FastAPI(
    title="BP Commercial Trading — Castrol Pricing Engine",
    version="1.0.0",
    description="Dynamic Castrol SKU pricing recommendation microservice",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "castrol-pricing-engine", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = CastrolPricingAgent()
    results = agent.run()
    return {
        "agent": "CastrolPricingAgent",
        "count": len(results),
        "price_up": sum(1 for r in results if r["action"] == "PRICE_UP"),
        "price_down": sum(1 for r in results if r["action"] == "PRICE_DOWN"),
        "hold": sum(1 for r in results if r["action"] == "HOLD"),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = CastrolPricingAgent()
    decisions = agent.decisions()
    return {"agent": "CastrolPricingAgent", "actionable_count": len(decisions), "decisions": decisions}
