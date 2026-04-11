"""
Refiner AI — FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import dashboard, alerts, equipment, digital_twin, ml_models, spare_parts, work_orders, roi

app = FastAPI(
    title="Refiner AI API",
    description="Predictive Maintenance Intelligence Platform — EAIOS British Petroleum",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
PREFIX = "/api/refiner-ai"

app.include_router(dashboard.router,    prefix=f"{PREFIX}/dashboard",   tags=["Dashboard"])
app.include_router(alerts.router,       prefix=f"{PREFIX}/alerts",      tags=["Alerts"])
app.include_router(equipment.router,    prefix=f"{PREFIX}/equipment",   tags=["Equipment"])
app.include_router(digital_twin.router, prefix=f"{PREFIX}/digital-twin", tags=["Digital Twin"])
app.include_router(ml_models.router,    prefix=f"{PREFIX}/ml-models",   tags=["ML Models"])
app.include_router(spare_parts.router,  prefix=f"{PREFIX}/spare-parts", tags=["Spare Parts"])
app.include_router(work_orders.router,  prefix=f"{PREFIX}/work-orders", tags=["Work Orders"])
app.include_router(roi.router,          prefix=f"{PREFIX}/roi",         tags=["ROI Analytics"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "refiner-ai", "version": "1.0.0"}
