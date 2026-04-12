"""FastAPI — Threat Detection."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.agents.threat_detection_agent import ThreatDetectionAgent

app = FastAPI(
    title="BP IT Operations — Threat Detection",
    version="1.0.0",
    description="Security event anomaly detection microservice",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "threat-detection", "version": "1.0.0"}


@app.get("/api/run")
def run():
    agent = ThreatDetectionAgent()
    results = agent.run()
    return {
        "agent": "ThreatDetectionAgent",
        "count": len(results),
        "threat": sum(1 for r in results if r["classification"] == "THREAT"),
        "suspicious": sum(1 for r in results if r["classification"] == "SUSPICIOUS"),
        "benign": sum(1 for r in results if r["classification"] == "BENIGN"),
        "results": results,
    }


@app.get("/api/decision")
def decision():
    agent = ThreatDetectionAgent()
    decisions = agent.decisions()
    return {"agent": "ThreatDetectionAgent", "actionable_count": len(decisions), "decisions": decisions}
