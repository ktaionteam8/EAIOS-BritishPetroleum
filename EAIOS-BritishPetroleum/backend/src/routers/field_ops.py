"""Field Ops router — inspection routes, checklists, and contractors."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, ConfigDict
from typing import Optional

from src.models.database import get_db
from src.models.field_ops import InspectionRoute, InspectionItem, Contractor

router = APIRouter(prefix="/api/field-ops", tags=["field-ops"])


class RouteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    route_code: str
    name: str
    priority: str
    site_id: str
    distance_km: Optional[float]
    estimated_duration_min: Optional[int]
    inspector_name: Optional[str]
    status: str
    scheduled_date: Optional[datetime]
    completed_at: Optional[datetime]


class ChecklistItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    route_id: str
    asset_tag: str
    check_description: str
    iso_standard: Optional[str]
    sort_order: int
    is_completed: bool
    completed_at: Optional[datetime]
    pass_fail: Optional[str]
    observation_notes: Optional[str]


class ChecklistCompleteBody(BaseModel):
    pass_fail: str
    observation_notes: Optional[str] = None


class ContractorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    company_name: str
    specialty: str
    site_id: Optional[str]


@router.get("/routes", response_model=list[RouteOut])
async def list_routes(
    site_id: str | None = Query(None),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(InspectionRoute).order_by(InspectionRoute.scheduled_date.asc())
    if site_id:
        stmt = stmt.where(InspectionRoute.site_id == site_id)
    if status:
        stmt = stmt.where(InspectionRoute.status == status)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/routes/{route_id}/checklist", response_model=list[ChecklistItemOut])
async def get_checklist(route_id: str, db: AsyncSession = Depends(get_db)):
    route = await db.get(InspectionRoute, route_id)
    if route is None:
        raise HTTPException(status_code=404, detail={"detail": "Route not found", "code": "route_not_found"})
    result = await db.execute(
        select(InspectionItem)
        .where(InspectionItem.route_id == route_id)
        .order_by(InspectionItem.sort_order)
    )
    return result.scalars().all()


@router.post("/routes/{route_id}/items/{item_id}/complete", response_model=ChecklistItemOut)
async def complete_item(
    route_id: str,
    item_id: str,
    body: ChecklistCompleteBody,
    db: AsyncSession = Depends(get_db),
):
    item = await db.get(InspectionItem, item_id)
    if item is None or item.route_id != route_id:
        raise HTTPException(status_code=404, detail={"detail": "Item not found", "code": "item_not_found"})
    item.is_completed = True
    item.completed_at = datetime.utcnow()
    item.pass_fail = body.pass_fail
    item.observation_notes = body.observation_notes
    await db.commit()
    await db.refresh(item)
    return item


@router.get("/contractors", response_model=list[ContractorOut])
async def list_contractors(
    site_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Contractor).order_by(Contractor.company_name)
    if site_id:
        stmt = stmt.where(Contractor.site_id == site_id)
    result = await db.execute(stmt)
    return result.scalars().all()
