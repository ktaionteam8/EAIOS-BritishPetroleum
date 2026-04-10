"""Energy Efficiency - API Entry Point"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="EAIOS-BP: Energy Efficiency",
    description="Energy consumption optimization across manufacturing operations",
    version="0.1.0",
    docs_url="/api/v1/energy-efficiency/docs",
    openapi_url="/api/v1/energy-efficiency/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/energy-efficiency/health")
async def health_check():
    return {"status": "healthy", "service": "energy-efficiency"}
