"""Seed AI audit log entries — domains 05-06 + Artemis-specific features (part 2 of 2)."""
import asyncio, uuid
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from src.config import settings
from src.models.ai_audit_log import AIAuditLog

ENTRIES = [
    # ── Domain 05: Manufacturing & Plant Operations ────────────────────────
    dict(agent_name="Refiner AI — Predictive Maintenance", domain_id="05-manufacturing-plant-operations",
         model_version="claude-opus-4-6", confidence_score=93.8, status="auto_executed",
         triggered_by="system@eaios.bp.com", action="Scheduled emergency inspection — Compressor C-201 bearing failure predicted",
         input_context="Vibration RMS: 14.2 mm/s (ISO 10816 Zone D). Temp delta: +18°C vs baseline. Oil particle count: 847 particles/ml.",
         output_summary="Bearing failure predicted 72-96h. WO-2024-8847 auto-created. Spare confirmed in stock. Maintenance window: Tuesday 02:00-06:00."),
    dict(agent_name="Refinery Yield Optimization Agent", domain_id="05-manufacturing-plant-operations",
         model_version="claude-opus-4-6", confidence_score=89.4, status="approved",
         triggered_by="refinery-ops@bp.com", action="Optimised crude blend — increased distillate yield 2.1% at Whiting",
         input_context="Current blend: 55% Arab Light, 45% WTI. Distillate demand premium: $8.20/bbl vs naphtha. CDU at 95% utilisation.",
         output_summary="Recommend shift to 65% Arab Light, 35% WTI. Projected distillate yield +2.1% (18k bbl/day incremental). Margin improvement $4.1M/month."),
    dict(agent_name="Refiner AI — Quality Control", domain_id="05-manufacturing-plant-operations",
         model_version="claude-opus-4-6", confidence_score=98.2, status="rejected",
         triggered_by="plant-control@bp.com", action="Recommended naphtha cut point adjustment to restore Jet A-1 smoke point",
         input_context="Crude blend 60% Arab Light, 40% Forties. Smoke point: 19mm (spec min 25mm). Naphtha cut: 165°C.",
         output_summary="Increase naphtha cut to 175°C; reduce Forties to 30%. Predicted smoke point: 27mm. Operator overrode — production schedule constraints cited."),
    dict(agent_name="Downtime Prevention Agent", domain_id="05-manufacturing-plant-operations",
         model_version="claude-opus-4-6", confidence_score=87.6, status="approved",
         triggered_by="reliability@bp.com", action="Proactive valve replacement recommended — HV-4420 failure signature detected",
         input_context="HV-4420 actuator response time degraded 340ms→890ms over 6 weeks. Similar signature preceded HV-4301 failure in 2024.",
         output_summary="Replace HV-4420 actuator during next planned outage (7 days). Estimated unplanned downtime risk avoided: 18h at $2.1M/hr throughput loss."),
    dict(agent_name="Energy Efficiency Agent", domain_id="05-manufacturing-plant-operations",
         model_version="claude-opus-4-6", confidence_score=91.2, status="approved",
         triggered_by="sustainability@bp.com", action="Identified 3.4% energy intensity improvement — Rotterdam refinery steam system",
         input_context="Steam distribution losses: 14% (industry benchmark: 8%). Condensate recovery rate: 61% (target: 80%). Fuel gas consumption 4% above plan.",
         output_summary="Optimise steam trap maintenance schedule; recover condensate from 4 identified loss points. Projected CO2 reduction: 8,400 tCO2/yr. Fuel saving £1.2M/yr."),
    dict(agent_name="Digital Twin Agent", domain_id="05-manufacturing-plant-operations",
         model_version="claude-opus-4-6", confidence_score=84.3, status="approved",
         triggered_by="engineering@bp.com", action="Completed turnaround scenario simulation — Rotterdam CDU shutdown 2026",
         input_context="Simulating 21-day CDU turnaround. 847 process states modelled. Scope: catalyst replacement, heat exchanger bundle cleaning, instrumentation overhaul.",
         output_summary="Optimal sequence reduces critical path by 2.5 days. Recommended crane utilisation schedule avoids 3 identified conflicts. Simulation confidence 84% — novel catalyst type limited historical data."),

    # ── Domain 06: Supply Chain & Logistics ───────────────────────────────
    dict(agent_name="Demand-Supply Matching Agent", domain_id="06-supply-chain-logistics",
         model_version="claude-opus-4-6", confidence_score=85.5, status="approved",
         triggered_by="supply-ops@bp.com", action="Rerouted Rotterdam cargo to Antwerp — demand spike detected",
         input_context="Antwerp ullage: 340k bbl available. Rotterdam tankage: full. Demand forecast: +180k bbl/day this week.",
         output_summary="Redirect MV Nordic Tern (120k bbl jet) Rotterdam R5 → Antwerp T14. Saving $180k vs spot purchase. ETA +6h. Customs pre-cleared."),
    dict(agent_name="Castrol Distribution Agent", domain_id="06-supply-chain-logistics",
         model_version="claude-opus-4-6", confidence_score=83.9, status="approved",
         triggered_by="castrol-supply@bp.com", action="Rebalanced APAC Castrol blending plant allocations — Q2 demand shift",
         input_context="Singapore blend plant at 94% capacity. Kuala Lumpur at 61%. Freight cost KL→SG: $42/MT. Demand: +18% Indonesia, -12% Thailand.",
         output_summary="Transfer 8,000 MT Havoline 10W-40 production KL→SG. Net freight saving $180K vs air freight alternative. Delivery SLA maintained across all 14 APAC markets."),
    dict(agent_name="Aviation Fuel Logistics Agent", domain_id="06-supply-chain-logistics",
         model_version="claude-opus-4-6", confidence_score=90.7, status="auto_executed",
         triggered_by="system@eaios.bp.com", action="Auto-adjusted Heathrow Jet A-1 replenishment order — BA schedule change",
         input_context="BA announced +22 flights from T5 this week. Current stock: 1.1M litres. Daily demand revised to 490k litres. Lead time: 3 days.",
         output_summary="Increased replenishment order to 1.8M litres from Coryton terminal. ETA 28h. Hydrant system pre-booked. Stock will not breach safety minimum."),
    dict(agent_name="Marine Bunkering Agent", domain_id="06-supply-chain-logistics",
         model_version="claude-opus-4-6", confidence_score=88.2, status="approved",
         triggered_by="bunkering@bp.com", action="Optimised VLSFO bunkering plan — MV Atlantic Pioneer Singapore port call",
         input_context="MV Atlantic Pioneer: 4,200 MT VLSFO requirement. Singapore spot: $578/MT. Rotterdam pre-order option: $562/MT at 60d terms.",
         output_summary="Recommend split: 2,800 MT Rotterdam pre-order ($562) + 1,400 MT Singapore spot ($578). Blended saving $19.6K vs full spot. IMO 2020 sulphur compliance confirmed."),
    dict(agent_name="Retail Fuel Optimization Agent", domain_id="06-supply-chain-logistics",
         model_version="claude-opus-4-6", confidence_score=81.4, status="pending_review",
         triggered_by="retail-ops@bp.com", action="Flagged 34 UK service stations at stockout risk — Easter demand surge",
         input_context="Easter bank holiday: +38% uplift forecast. 34 stations have <3-day stock at elevated demand rate. Tank wagon fleet: 87% committed.",
         output_summary="Recommend emergency rota: 18 stations served via double-shift deliveries, 16 via competitor tank wagon sub-contract. Cost premium: £42K vs plan."),
    dict(agent_name="Inventory Management Agent", domain_id="06-supply-chain-logistics",
         model_version="claude-opus-4-6", confidence_score=77.3, status="pending_review",
         triggered_by="inventory@bp.com", action="Flagged potential stockout — Aviation Jet A-1 Heathrow T5",
         input_context="Current stock: 820k litres. Daily consumption: 420k litres. Lead time: 3 days. Safety stock: 500k litres.",
         output_summary="Stock falls below safety stock in 2.8 days. Recommend immediate order 1.2M litres. Confidence 77% due to BA schedule uncertainty. Manual confirmation recommended."),

    # ── Artemis Feature-Specific Audit Entries ────────────────────────────
    dict(agent_name="Artemis — Trade Execution Engine", domain_id="04-commercial-trading",
         model_version="claude-opus-4-6", confidence_score=97.4, status="auto_executed",
         triggered_by="trading-desk@bp.com", action="Booked crude trade — 500k bbl WTI Cushing, June delivery",
         input_context="Counterparty: Vitol SA (credit limit $50M, utilised $12M). Instrument: physical crude. Price: WTI flat. Volume: 500,000 bbl.",
         output_summary="Trade ID TRD-2026-04782 logged. Confirmation sent to counterparty and back-office. Risk check passed (utilisation 26%). Settlement: June 15 via SWIFT."),
    dict(agent_name="Artemis — Risk & VaR Monitor", domain_id="04-commercial-trading",
         model_version="claude-opus-4-6", confidence_score=95.1, status="auto_executed",
         triggered_by="system@eaios.bp.com", action="Daily VaR calculation completed — portfolio within limits",
         input_context="Portfolio: 14 open positions across crude, gas, carbon, power. Historical simulation method, 250-day lookback, 99% confidence.",
         output_summary="1-day VaR: $4.82M. Portfolio limit: $8M. Stress VaR: $11.2M. Largest contributor: Brent futures (38% of VaR). All limits within threshold."),
    dict(agent_name="Artemis — Counterparty Risk Manager", domain_id="04-commercial-trading",
         model_version="claude-opus-4-6", confidence_score=88.9, status="pending_review",
         triggered_by="credit-risk@bp.com", action="Flagged Unipec credit limit breach — $52M exposure vs $50M limit",
         input_context="Unipec current trades: 8 open positions totalling $52.3M. Approved credit limit: $50M. New $4M trade proposed.",
         output_summary="Limit breached by $2.3M. Block new trade pending credit review. Recommend temporary limit increase to $55M for 30 days pending annual review."),
    dict(agent_name="Artemis — ETS Compliance Agent", domain_id="04-commercial-trading",
         model_version="claude-opus-4-6", confidence_score=99.2, status="auto_executed",
         triggered_by="system@eaios.bp.com", action="Executed ETS surrender event — 1.18Mt EUAs surrendered for FY2025",
         input_context="Deadline: April 30 (EU ETS). Verified emissions FY2025: 1.18Mt CO2e. EUA holding: 1.24Mt. Surplus: 60,000 EUAs.",
         output_summary="1.18Mt EUAs surrendered via EU Registry. Surplus 60,000 EUAs retained for banking. Compliance certificate archived. No penalty incurred."),
    dict(agent_name="Artemis — Castrol Margin Simulator", domain_id="04-commercial-trading",
         model_version="claude-opus-4-6", confidence_score=86.7, status="approved",
         triggered_by="castrol-commercial@bp.com", action="Ran margin simulation — 500k MT Castrol Magnatec production scenario",
         input_context="Simulation: 500k MT Magnatec 5W-30 at current Group III base oil ($1,240/MT) and additive costs. Retail price: £28.50/litre.",
         output_summary="Gross margin: 38.4% (vs target 35%). Breakeven base oil price: $1,480/MT. Sensitivity: every $100/MT feedstock move = 2.8% margin impact."),
    dict(agent_name="Artemis — Vessel & Cargo Tracker", domain_id="04-commercial-trading",
         model_version="claude-opus-4-6", confidence_score=99.8, status="auto_executed",
         triggered_by="system@eaios.bp.com", action="AIS update — MV Nordic Spirit ETA revised, Ras Tanura loading delayed",
         input_context="MV Nordic Spirit (VLCC, IMO 9824431). Was: ETA Ras Tanura April 18 14:00. AIS now shows position 340nm NE, speed 12.4kn.",
         output_summary="ETA revised to April 19 08:00. Loading window adjusted. Charterer notified. No demurrage exposure at current laytime clock: 14h allowance remaining."),
    dict(agent_name="Artemis — Price Alert Engine", domain_id="04-commercial-trading",
         model_version="claude-opus-4-6", confidence_score=99.9, status="auto_executed",
         triggered_by="system@eaios.bp.com", action="Price alert triggered — Brent Crude breached $87.50/bbl threshold",
         input_context="Alert: BP-ALERT-442. Commodity: Brent Crude. Threshold: above $87.50/bbl. Current price: $87.64/bbl at 09:32 GMT.",
         output_summary="Alert fired. Notifications sent to 3 recipients (trading-desk@bp.com, risk@bp.com, cfo@bp.com). Hedging review initiated. Alert auto-reset to monitor next $1 move."),
    dict(agent_name="Artemis — P&L Reporting Agent", domain_id="04-commercial-trading",
         model_version="claude-opus-4-6", confidence_score=98.6, status="auto_executed",
         triggered_by="system@eaios.bp.com", action="Generated daily trading P&L report — April 15 2026",
         input_context="14 open positions. Mark-to-market prices sourced from Platts and ICE. FX: USD/GBP 0.792 applied. Previous close: $24.1M book value.",
         output_summary="Daily MTM P&L: +$1.84M. YTD realised P&L: +$18.7M. Top contributor: EUA long (+$620K). Biggest drag: LNG short (-$290K). Report archived to risk system."),
    dict(agent_name="Artemis — Position Limit Monitor", domain_id="04-commercial-trading",
         model_version="claude-opus-4-6", confidence_score=93.4, status="pending_review",
         triggered_by="system@eaios.bp.com", action="Position limit warning — Brent futures approaching 80% of approved limit",
         input_context="Brent futures long: 1,820 lots. Approved limit: 2,500 lots. Utilisation: 72.8%. Trend: +180 lots in past 24h.",
         output_summary="At current rate, limit breach in approximately 3.7 trading days. Warning issued to head trader and risk manager. No action taken automatically — requires trader acknowledgement."),
]


async def seed():
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        for i, entry in enumerate(ENTRIES):
            ts = datetime.utcnow() - timedelta(hours=i * 3 + 2)
            session.add(AIAuditLog(id=uuid.uuid4(), created_at=ts, updated_at=ts, **entry))
        await session.commit()
        print(f"Seeded {len(ENTRIES)} AI audit log entries (domains 05-06 + Artemis features).")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
