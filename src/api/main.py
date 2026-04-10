"""Downtime Prevention - API Entry Point"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="EAIOS-BP: Downtime Prevention",
    description="Scheduling and anomaly detection to minimize unplanned downtime",
    version="0.1.0",
    docs_url="/api/v1/downtime-prevention/docs",
    openapi_url="/api/v1/downtime-prevention/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/downtime-prevention/health")
async def health_check():
    return {"status": "healthy", "service": "downtime-prevention"}
