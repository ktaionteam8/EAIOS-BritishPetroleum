"""Digital Twin - API Entry Point"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="EAIOS-BP: Digital Twin",
    description="Virtual replicas of physical assets for simulation and monitoring",
    version="0.1.0",
    docs_url="/api/v1/digital-twin/docs",
    openapi_url="/api/v1/digital-twin/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/digital-twin/health")
async def health_check():
    return {"status": "healthy", "service": "digital-twin"}
