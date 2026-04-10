"""Refinery Yield Optimization - API Entry Point"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="EAIOS-BP: Refinery Yield Optimization",
    description="AI optimization of refinery output, feedstock blending, and process parameters",
    version="0.1.0",
    docs_url="/api/v1/refinery-yield-optimization/docs",
    openapi_url="/api/v1/refinery-yield-optimization/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/refinery-yield-optimization/health")
async def health_check():
    return {"status": "healthy", "service": "refinery-yield-optimization"}
