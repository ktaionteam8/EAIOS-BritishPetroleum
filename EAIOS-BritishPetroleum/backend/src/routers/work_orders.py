"""Work orders + spare parts router."""
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.database import get_db
from src.models.work_orders import WorkOrder
from src.models.spare_parts import SparePart, SparePartStock, ProcurementOrder
from src.schemas.work_orders import (
    WorkOrderCreate, WorkOrderOut, WorkOrderStatusUpdate,
    SparePartOut, SparePartStockOut,
    ProcurementOrderCreate, ProcurementOrderOut,
)
from src.middleware.auth import get_current_user

router = APIRouter(tags=["work-orders"])

# ── Work Orders ──────────────────────────────────────────────────────────────

@router.get("/api/work-orders", response_model=list[WorkOrderOut])
async def list_work_orders(
    status: str | None = Query(None),
    priority: str | None = Query(None),
    site_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    stmt = select(WorkOrder).order_by(WorkOrder.created_at.desc())
    if status:
        stmt = stmt.where(WorkOrder.status == status)
    if priority:
        stmt = stmt.where(WorkOrder.priority == priority)
    if site_id:
        stmt = stmt.where(WorkOrder.site_id == site_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/api/work-orders", response_model=WorkOrderOut, status_code=201)
async def create_work_order(
    body: WorkOrderCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    wo_number = f"WO-{datetime.utcnow().strftime('%Y')}-{str(uuid.uuid4())[:6].upper()}"
    wo = WorkOrder(wo_number=wo_number, **body.model_dump())
    db.add(wo)
    await db.commit()
    await db.refresh(wo)
    return wo


@router.patch("/api/work-orders/{wo_id}", response_model=WorkOrderOut)
async def update_work_order_status(
    wo_id: str,
    body: WorkOrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    wo = await db.get(WorkOrder, wo_id)
    if wo is None:
        raise HTTPException(status_code=404, detail={"detail": "Work order not found", "code": "wo_not_found"})
    wo.status = body.status
    if body.cost_actual is not None:
        wo.cost_actual = body.cost_actual
    if body.status == "completed":
        wo.completed_at = datetime.utcnow()
    await db.commit()
    await db.refresh(wo)
    return wo


# ── Spare Parts ───────────────────────────────────────────────────────────────

@router.get("/api/spare-parts", response_model=list[SparePartOut])
async def list_spare_parts(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    result = await db.execute(select(SparePart).where(SparePart.is_active == True).order_by(SparePart.criticality_score.desc()))
    return result.scalars().all()


@router.get("/api/spare-parts/stock", response_model=list[SparePartStockOut])
async def list_stock(
    site_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    stmt = select(SparePartStock)
    if site_id:
        stmt = stmt.where(SparePartStock.site_id == site_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/api/procurement-orders", response_model=list[ProcurementOrderOut])
async def list_procurement(
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    stmt = select(ProcurementOrder).order_by(ProcurementOrder.ordered_date.desc())
    if status:
        stmt = stmt.where(ProcurementOrder.status == status)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/api/procurement-orders", response_model=ProcurementOrderOut, status_code=201)
async def create_procurement_order(
    body: ProcurementOrderCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    part = await db.get(SparePart, body.part_id)
    if part is None:
        raise HTTPException(status_code=404, detail={"detail": "Spare part not found", "code": "part_not_found"})
    po_number = f"PO-{datetime.utcnow().strftime('%Y')}-{str(uuid.uuid4())[:6].upper()}"
    po = ProcurementOrder(
        po_number=po_number,
        part_id=body.part_id,
        site_id=body.site_id,
        quantity=body.quantity,
        unit_cost=part.unit_cost,
        total_cost=part.unit_cost * body.quantity,
        urgency_days=body.urgency_days,
        ordered_date=datetime.utcnow(),
        status="ordered",
    )
    db.add(po)
    await db.commit()
    await db.refresh(po)
    return po
