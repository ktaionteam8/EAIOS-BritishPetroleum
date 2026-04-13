"""ARTEMIS API router — all Commercial & Trading intelligence endpoints."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.database import get_db
from src.models.artemis_core import (
    ArtemisAgentStatus, ArtemisModelRegistry,
    ArtemisAuditLog, ArtemisComplianceEvent,
)
from src.models.artemis_arbitrage import ArtemisArbitrageOpportunity, ArtemisArbitrageMetric
from src.models.artemis_castrol import ArtemisBaseOilPrice, ArtemisCastrolPricingRec
from src.models.artemis_aviation import (
    ArtemisAviationAirport, ArtemisAviationForecast, ArtemisAviationContract,
)
from src.models.artemis_carbon import ArtemisCarbonPosition, ArtemisCarbonRecommendation
from src.schemas.artemis import (
    AgentStatusOut, ModelRegistryOut, AuditLogOut, ComplianceEventOut,
    ArbitrageOpportunityOut, ArbitrageMetricOut,
    BaseOilPriceOut, CastrolPricingRecOut,
    AviationForecastOut, AviationContractOut,
    CarbonPositionOut, CarbonRecommendationOut,
)
from src.middleware.auth import get_current_user

router = APIRouter(prefix="/api/artemis", tags=["artemis"])


# ── Core / Command Centre ─────────────────────────────────────────────────────
@router.get("/agents", response_model=list[AgentStatusOut])
async def list_agents(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    """All 4 ARTEMIS agent statuses for the Command Centre dashboard."""
    result = await db.execute(select(ArtemisAgentStatus).order_by(ArtemisAgentStatus.agent_key))
    return result.scalars().all()


@router.get("/models", response_model=list[ModelRegistryOut])
async def list_models(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    """SageMaker model registry — all ARTEMIS models in production."""
    result = await db.execute(
        select(ArtemisModelRegistry).order_by(ArtemisModelRegistry.next_review_days)
    )
    return result.scalars().all()


@router.get("/audit-log", response_model=list[AuditLogOut])
async def list_audit_log(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    """SOX immutable audit log — most recent decisions first."""
    result = await db.execute(
        select(ArtemisAuditLog).order_by(desc(ArtemisAuditLog.created_at)).limit(limit)
    )
    return result.scalars().all()


@router.get("/compliance", response_model=list[ComplianceEventOut])
async def list_compliance_events(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    """Active compliance events across SOX/FCA/EU AI Act frameworks."""
    result = await db.execute(
        select(ArtemisComplianceEvent)
        .where(ArtemisComplianceEvent.status != "resolved")
        .order_by(desc(ArtemisComplianceEvent.created_at))
        .limit(20)
    )
    return result.scalars().all()


# ── Arbitrage ─────────────────────────────────────────────────────────────────
@router.get("/arbitrage/opportunities", response_model=list[ArbitrageOpportunityOut])
async def list_opportunities(
    status: str = Query("open"),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    """Live arbitrage opportunities — default returns only open signals."""
    result = await db.execute(
        select(ArtemisArbitrageOpportunity)
        .where(ArtemisArbitrageOpportunity.status == status)
        .order_by(desc(ArtemisArbitrageOpportunity.confidence_pct))
    )
    return result.scalars().all()


@router.get("/arbitrage/metrics", response_model=list[ArbitrageMetricOut])
async def list_arb_metrics(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    """Daily arbitrage pipeline metrics for the last N days."""
    result = await db.execute(
        select(ArtemisArbitrageMetric)
        .order_by(desc(ArtemisArbitrageMetric.metric_date))
        .limit(days)
    )
    return result.scalars().all()


# ── Castrol ───────────────────────────────────────────────────────────────────
@router.get("/castrol/base-oil", response_model=list[BaseOilPriceOut])
async def list_base_oil_prices(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    """Latest base oil prices — one row per grade."""
    result = await db.execute(
        select(ArtemisBaseOilPrice).order_by(desc(ArtemisBaseOilPrice.price_date))
    )
    seen: set[str] = set()
    prices = []
    for row in result.scalars():
        if row.grade not in seen:
            seen.add(row.grade)
            prices.append(row)
    return prices


@router.get("/castrol/pricing", response_model=list[CastrolPricingRecOut])
async def list_castrol_pricing(
    geography: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    """Current Castrol B2B pricing recommendations."""
    stmt = select(ArtemisCastrolPricingRec).order_by(
        desc(ArtemisCastrolPricingRec.generated_at)
    )
    if geography:
        stmt = stmt.where(ArtemisCastrolPricingRec.geography == geography)
    result = await db.execute(stmt)
    return result.scalars().all()


# ── Aviation ──────────────────────────────────────────────────────────────────
@router.get("/aviation/forecasts", response_model=list[AviationForecastOut])
async def list_forecasts(
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    """Latest aviation demand forecasts, sorted by 30-day volume descending."""
    result = await db.execute(
        select(ArtemisAviationForecast)
        .order_by(desc(ArtemisAviationForecast.d30_actual_ml))
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/aviation/contracts", response_model=list[AviationContractOut])
async def list_contracts(
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    """Aviation contract pipeline — optionally filtered by status."""
    stmt = select(ArtemisAviationContract).order_by(ArtemisAviationContract.days_to_renewal)
    if status:
        stmt = stmt.where(ArtemisAviationContract.status == status)
    result = await db.execute(stmt)
    return result.scalars().all()


# ── Carbon ────────────────────────────────────────────────────────────────────
@router.get("/carbon/positions", response_model=list[CarbonPositionOut])
async def list_carbon_positions(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    """Current carbon credit portfolio positions."""
    result = await db.execute(
        select(ArtemisCarbonPosition).order_by(ArtemisCarbonPosition.credit_type)
    )
    return result.scalars().all()


@router.get("/carbon/recommendations", response_model=list[CarbonRecommendationOut])
async def list_carbon_recs(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    """Open carbon portfolio recommendations from ARTEMIS-Carbon Agent."""
    result = await db.execute(
        select(ArtemisCarbonRecommendation)
        .where(ArtemisCarbonRecommendation.status == "open")
        .order_by(desc(ArtemisCarbonRecommendation.created_at))
    )
    return result.scalars().all()
