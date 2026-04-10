"""Predictive Maintenance - API Entry Point"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="EAIOS-BP: Predictive Maintenance",
    description="ML models for equipment failure prediction using sensor/IoT data",
    version="0.1.0",
    docs_url="/api/v1/predictive-maintenance/docs",
    openapi_url="/api/v1/predictive-maintenance/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/predictive-maintenance/health")
async def health_check():
    return {"status": "healthy", "service": "predictive-maintenance"}
