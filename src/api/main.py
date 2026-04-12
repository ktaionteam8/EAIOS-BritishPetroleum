"""FastAPI — Shadow IT Rationalization."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.shadow_it_agent import ShadowITAgent

app = FastAPI(
    title="BP IT Operations — Shadow IT Rationalization",
    version="1.0.0",
    description="Unauthorized SaaS application detection microservice",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "shadow-it-rationalization", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = ShadowITAgent()
    results = agent.run()
    return {
        "agent": "ShadowITAgent",
        "count": len(results),
        "sanction": sum(1 for r in results if r["action"] == "SANCTION"),
        "review": sum(1 for r in results if r["action"] == "REVIEW"),
        "block": sum(1 for r in results if r["action"] == "BLOCK"),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = ShadowITAgent()
    decisions = agent.decisions()
    return {"agent": "ShadowITAgent", "actionable_count": len(decisions), "decisions": decisions}
