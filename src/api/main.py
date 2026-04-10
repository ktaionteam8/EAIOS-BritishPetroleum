"""Quality Control AI - API Entry Point"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="EAIOS-BP: Quality Control AI",
    description="Computer vision and statistical models for product quality inspection",
    version="0.1.0",
    docs_url="/api/v1/quality-control-ai/docs",
    openapi_url="/api/v1/quality-control-ai/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/quality-control-ai/health")
async def health_check():
    return {"status": "healthy", "service": "quality-control-ai"}
