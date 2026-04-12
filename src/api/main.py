"""FastAPI — Aviation Fuel Forecasting."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.aviation_forecast_agent import AviationForecastAgent

app = FastAPI(
    title="BP Commercial Trading — Aviation Fuel Forecasting",
    version="1.0.0",
    description="30-day jet fuel demand forecasting microservice",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "aviation-fuel-forecasting", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = AviationForecastAgent()
    results = agent.run()
    return {
        "agent": "AviationForecastAgent",
        "count": len(results),
        "increasing": sum(1 for r in results if r["trend"] == "INCREASING"),
        "decreasing": sum(1 for r in results if r["trend"] == "DECREASING"),
        "stable": sum(1 for r in results if r["trend"] == "STABLE"),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = AviationForecastAgent()
    decisions = agent.decisions()
    return {"agent": "AviationForecastAgent", "actionable_count": len(decisions), "decisions": decisions}
