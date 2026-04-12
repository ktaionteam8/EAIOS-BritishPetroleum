"""FastAPI — Master Agent Orchestrator."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.master_agent import MasterAgent

app = FastAPI(
    title="BP EAIOS — Master Agent Orchestrator",
    version="1.0.0",
    description="Enterprise-level decision orchestrator combining all 6 domains",
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
    return {"status": "healthy", "service": "master-agent-orchestrator", "version": "1.0.0"}


@app.get("/api/run")
def run():
    """Full run: fetch all domain decisions + aggregate."""
    agent = MasterAgent()
    return agent.run()


@app.get("/api/decision")
def decision():
    """Final enterprise-level decision only."""
    agent = MasterAgent()
    return agent.decision_only()
