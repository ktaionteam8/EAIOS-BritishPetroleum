"""FastAPI — Skills Gap Analysis."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.skills_gap_agent import SkillsGapAgent

app = FastAPI(
    title="BP HR & Safety — Skills Gap Analysis",
    version="1.0.0",
    description="Missing skill detection microservice",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "skills-gap-analysis", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = SkillsGapAgent()
    results = agent.run()
    return {
        "agent": "SkillsGapAgent",
        "count": len(results),
        "train": sum(1 for r in results if r["action"] == "TRAIN"),
        "hire": sum(1 for r in results if r["action"] == "HIRE"),
        "ok": sum(1 for r in results if r["action"] == "OK"),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = SkillsGapAgent()
    decisions = agent.decisions()
    return {"agent": "SkillsGapAgent", "actionable_count": len(decisions), "decisions": decisions}
