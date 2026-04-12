"""FastAPI — Infrastructure Monitoring."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.infra_monitoring_agent import InfraMonitoringAgent

app = FastAPI(
    title="BP IT Operations — Infrastructure Monitoring",
    version="1.0.0",
    description="System health tracking and auto-scaling recommendation microservice",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "infrastructure-monitoring", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = InfraMonitoringAgent()
    results = agent.run()
    return {
        "agent": "InfraMonitoringAgent",
        "count": len(results),
        "alert": sum(1 for r in results if r["action"] == "ALERT"),
        "scale_up": sum(1 for r in results if r["action"] == "SCALE_UP"),
        "scale_down": sum(1 for r in results if r["action"] == "SCALE_DOWN"),
        "stable": sum(1 for r in results if r["action"] == "STABLE"),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = InfraMonitoringAgent()
    decisions = agent.decisions()
    return {"agent": "InfraMonitoringAgent", "actionable_count": len(decisions), "decisions": decisions}
