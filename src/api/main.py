"""FastAPI — IT Service Desk AI."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.service_desk_agent import ServiceDeskAgent

app = FastAPI(
    title="BP IT Operations — Service Desk AI",
    version="1.0.0",
    description="Automated ticket triage microservice",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "it-service-desk-ai", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = ServiceDeskAgent()
    results = agent.run()
    return {
        "agent": "ServiceDeskAgent",
        "count": len(results),
        "auto_resolve": sum(1 for r in results if r["action"] == "AUTO_RESOLVE"),
        "route": sum(1 for r in results if r["action"] == "ROUTE"),
        "escalate": sum(1 for r in results if r["action"] == "ESCALATE"),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = ServiceDeskAgent()
    decisions = agent.decisions()
    return {"agent": "ServiceDeskAgent", "actionable_count": len(decisions), "decisions": decisions}
