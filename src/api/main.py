"""FastAPI — OT Security Monitoring."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.ot_security_agent import OTSecurityAgent

app = FastAPI(
    title="BP IT Operations — OT Security Monitoring",
    version="1.0.0",
    description="Safety-critical OT/ICS/SCADA security monitoring microservice",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "ot-security-monitoring", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = OTSecurityAgent()
    results = agent.run()
    return {
        "agent": "OTSecurityAgent",
        "count": len(results),
        "critical": sum(1 for r in results if r["status"] == "CRITICAL"),
        "warning": sum(1 for r in results if r["status"] == "WARNING"),
        "normal": sum(1 for r in results if r["status"] == "NORMAL"),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = OTSecurityAgent()
    decisions = agent.decisions()
    return {"agent": "OTSecurityAgent", "actionable_count": len(decisions), "decisions": decisions}
