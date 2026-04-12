"""FastAPI — Cost Forecasting."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.cost_forecast_agent import CostForecastAgent

app = FastAPI(
    title="BP Finance — Cost Forecasting",
    version="1.0.0",
    description="Cross-domain cost rollup and forecasting microservice",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "cost-forecasting", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = CostForecastAgent()
    results = agent.run()
    return {
        "agent": "CostForecastAgent",
        "count": len(results),
        "overrun": sum(1 for r in results if r["decision"] == "OVERRUN"),
        "underrun": sum(1 for r in results if r["decision"] == "UNDERRUN"),
        "stable": sum(1 for r in results if r["decision"] == "STABLE"),
        "total_forecast": sum(r["forecast_cost"] for r in results),
        "total_budget": sum(r["budget"] for r in results),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = CostForecastAgent()
    decisions = agent.decisions()
    return {"agent": "CostForecastAgent", "actionable_count": len(decisions), "decisions": decisions}
