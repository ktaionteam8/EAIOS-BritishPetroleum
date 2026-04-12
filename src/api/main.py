"""FastAPI — Revenue Analytics."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.revenue_analytics_agent import RevenueAnalyticsAgent

app = FastAPI(
    title="BP Finance — Revenue Analytics",
    version="1.0.0",
    description="Cross-domain revenue trend and growth analytics microservice",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "revenue-analytics", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = RevenueAnalyticsAgent()
    results = agent.run()
    return {
        "agent": "RevenueAnalyticsAgent",
        "count": len(results),
        "growth": sum(1 for r in results if r["decision"] == "GROWTH"),
        "stable": sum(1 for r in results if r["decision"] == "STABLE"),
        "decline": sum(1 for r in results if r["decision"] == "DECLINE"),
        "total_current_revenue": sum(r["current_revenue"] for r in results),
        "total_prev_revenue": sum(r["prev_quarter_revenue"] for r in results),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = RevenueAnalyticsAgent()
    decisions = agent.decisions()
    return {"agent": "RevenueAnalyticsAgent", "actionable_count": len(decisions), "decisions": decisions}
