import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useArtemisData, ArtemisData } from '../../hooks/useArtemisData';
import { AuditLogPanel } from '../../components/AuditLogPanel';
import {
  ArtemisAgentStatus, ArtemisComplianceEvent,
  ArbitrageOpportunity, BaseOilPrice, CastrolPricingRec,
  AviationForecast, AviationContract,
  CarbonPosition, CarbonRecommendation,
  ArtemisModelRegistry, ArtemisAuditLog,
} from '../../api/client';

// ── Types ─────────────────────────────────────────────────────────────────────
type TabId = 'command-centre' | 'arbitrage' | 'castrol' | 'aviation' | 'carbon' | 'compliance';

interface KPICardProps {
  label: string; value: string; sub: string; accent: string; border: string;
}
const KPICard: React.FC<KPICardProps> = ({ label, value, sub, accent, border }) => (
  <div className={`bg-gray-900 border ${border} rounded-xl p-5 flex flex-col gap-1`}>
    <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">{label}</p>
    <p className={`text-3xl font-bold ${accent}`}>{value}</p>
    <p className="text-xs text-gray-500">{sub}</p>
  </div>
);

function fmtLastSignal(ts: string | null): string {
  if (!ts) return '—';
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

interface AgentPanelProps {
  name: string; scope: string; status: 'active' | 'idle';
  signals: number; lastSignal: string; metric: string; metricLabel: string;
}
const AgentPanel: React.FC<AgentPanelProps> = ({ name, scope, status, signals, lastSignal, metric, metricLabel }) => (
  <div className="bg-gray-900 border border-amber-800/30 rounded-xl p-5 flex flex-col gap-3">
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-0.5">ARTEMIS Agent</p>
        <p className="text-white font-semibold text-sm">{name}</p>
        <p className="text-gray-500 text-xs mt-0.5">{scope}</p>
      </div>
      <span className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
        status === 'active' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-gray-800/60 text-gray-400'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-400' : 'bg-gray-500'}`} />
        {status === 'active' ? 'Active' : 'Idle'}
      </span>
    </div>
    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-800">
      <div className="text-center">
        <p className="text-sm font-bold font-mono text-amber-400">{signals}</p>
        <p className="text-gray-600 text-xs">Signals Today</p>
      </div>
      <div className="text-center">
        <p className="text-sm font-bold font-mono text-amber-400">{metric}</p>
        <p className="text-gray-600 text-xs">{metricLabel}</p>
      </div>
      <div className="text-center">
        <p className="text-sm font-bold font-mono text-amber-400">{lastSignal}</p>
        <p className="text-gray-600 text-xs">Last Signal</p>
      </div>
    </div>
  </div>
);

// ── Command Centre Tab ────────────────────────────────────────────────────────
const AGENT_COLOR: Record<string, string> = {
  'artemis-trade': 'text-emerald-400',
  'artemis-castrol': 'text-amber-400',
  'artemis-aviation': 'text-purple-400',
  'artemis-carbon': 'text-blue-400',
};

interface CommandCentreProps {
  agents: ArtemisAgentStatus[];
  auditLog: ArtemisAuditLog[];
  complianceEvents: ArtemisComplianceEvent[];
}
const CommandCentreTab: React.FC<CommandCentreProps> = ({ agents, auditLog, complianceEvents }) => (
  <div className="space-y-8">
    {/* KPI Strip */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard label="Incremental Margin Target" value="$40–80M" sub="Per year — arbitrage + pricing + aviation" accent="text-amber-400" border="border-amber-800/30" />
      <KPICard label="Spreads Monitored" value="180+" sub="Cross-commodity relationships, real-time" accent="text-amber-300" border="border-amber-800/20" />
      <KPICard label="Active Agents" value="4 / 4" sub="Trade · Castrol · Aviation · Carbon" accent="text-emerald-400" border="border-emerald-800/20" />
      <KPICard label="Airports Covered" value="600+" sub="Aviation demand forecasting, 90-day horizon" accent="text-blue-400" border="border-blue-800/20" />
    </div>

    {/* Agent Panels */}
    <div>
      <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-widest">Agent Status</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {agents.map(a => (
          <AgentPanel key={a.id}
            name={a.agent_name}
            scope={a.scope}
            status={a.status === 'active' ? 'active' : 'idle'}
            signals={a.signals_today}
            lastSignal={fmtLastSignal(a.last_signal_at)}
            metric={a.primary_metric_value ?? '—'}
            metricLabel={a.primary_metric_label ?? ''}
          />
        ))}
      </div>
    </div>

    {/* Recent Signals — from SOX audit log */}
    <div>
      <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-widest">Recent Intelligence Signals</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
        {auditLog.slice(0, 5).map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gray-800 ${AGENT_COLOR[s.agent_key] ?? 'text-gray-400'} shrink-0`}>
                {s.agent_key.replace('artemis-', '').replace(/^\w/, c => c.toUpperCase())}
              </span>
              <span className="text-gray-500 text-xs shrink-0">{s.action_type.replace(/_/g, ' ')}</span>
              <p className="text-gray-300 text-sm truncate">{s.recommendation_summary ?? '—'}</p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              {s.estimated_pnl_usd != null && (
                <span className="text-emerald-400 text-xs font-mono">${(s.estimated_pnl_usd / 1000).toFixed(0)}k</span>
              )}
              <span className="text-gray-600 text-xs">{fmtLastSignal(s.created_at)}</span>
              <button className="text-xs border border-amber-800/40 text-amber-400 hover:bg-amber-900/20 px-2 py-0.5 rounded transition-colors">Review</button>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Compliance Rail */}
    <div>
      <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-widest">Compliance Rail</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {complianceEvents.slice(0, 3).map(c => (
          <div key={c.id} className="bg-gray-900 border border-amber-800/30 rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">{c.framework}</p>
            <p className="text-white text-sm font-semibold">{c.status.toUpperCase()}</p>
            <p className="text-gray-500 text-xs mt-1">{c.detail}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Arbitrage Intelligence Tab ────────────────────────────────────────────────
interface ArbitrageTabProps { opportunities: ArbitrageOpportunity[]; }
const ArbitrageTab: React.FC<ArbitrageTabProps> = ({ opportunities }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard label="Spreads Monitored" value="180" sub="Real-time, sub-60s latency" accent="text-amber-400" border="border-amber-800/30" />
      <KPICard label="Active Opportunities" value="5" sub="Above alert threshold now" accent="text-emerald-400" border="border-emerald-800/20" />
      <KPICard label="P&amp;L Identified Today" value="$9.6M" sub="Across all open opportunities" accent="text-amber-300" border="border-amber-800/20" />
      <KPICard label="Avg Signal Latency" value="47s" sub="Signal → recommendation" accent="text-blue-400" border="border-blue-800/20" />
    </div>

    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white uppercase tracking-widest">Live Arbitrage Opportunities</h2>
        <span className="text-xs text-gray-500">Sorted by confidence · All require Tier 2 approval</span>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-6 gap-4 px-5 py-2.5 border-b border-gray-800 text-xs text-gray-500 font-semibold uppercase tracking-wider">
          <span className="col-span-2">Spread</span><span>Level</span><span>Percentile</span><span>Est. P&amp;L</span><span>Confidence</span>
        </div>
        {opportunities.map((o) => (
          <div key={o.id} className="grid grid-cols-6 gap-4 px-5 py-3.5 border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors items-center">
            <span className="col-span-2 text-white text-sm font-medium">{o.spread_name}</span>
            <span className="text-amber-400 font-mono text-sm">{o.current_level}</span>
            <span className="text-gray-300 text-sm">{o.percentile_rank}th</span>
            <span className="text-emerald-400 font-mono text-sm font-semibold">${(o.estimated_pnl_usd / 1000).toFixed(0)}k</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${o.confidence_pct}%` }} />
              </div>
              <span className="text-xs text-gray-400 font-mono w-8">{o.confidence_pct.toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-amber-900/10 border border-amber-800/30 rounded-xl p-5">
      <p className="text-xs text-amber-400 font-bold uppercase tracking-widest mb-1">Human-in-the-Loop Required</p>
      <p className="text-gray-400 text-sm">All opportunities above require explicit trader approval before ETRM execution. FCA supervisory records are written at approval. Override rationale is captured for model retraining.</p>
    </div>
  </div>
);

// ── Castrol Pricing Tab ───────────────────────────────────────────────────────
interface CastrolTabProps { baseOil: BaseOilPrice[]; pricingRecs: CastrolPricingRec[]; }
const CastrolTab: React.FC<CastrolTabProps> = ({ baseOil, pricingRecs }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard label="SKUs Monitored" value="1,240" sub="Across 120+ global markets" accent="text-amber-400" border="border-amber-800/30" />
      <KPICard label="Pricing Cycle" value="07:00 UTC" sub="Daily · Intraday on +0.5% move" accent="text-amber-300" border="border-amber-800/20" />
      <KPICard label="Updates Pending" value="14" sub="Group II move triggered intraday run" accent="text-orange-400" border="border-orange-800/20" />
      <KPICard label="Margin Uplift Target" value="2.0%" sub="Gross margin vs unmanaged baseline" accent="text-emerald-400" border="border-emerald-800/20" />
    </div>

    <div>
      <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-widest">Base Oil Cost Monitor</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {baseOil.map(b => (
          <div key={b.id} className={`bg-gray-900 border rounded-xl p-4 ${b.alert_status === 'alert' ? 'border-orange-800/40' : 'border-gray-800'}`}>
            <p className="text-white text-sm font-semibold">{b.grade}</p>
            <p className="text-amber-400 text-2xl font-bold font-mono mt-2">{b.price_display}</p>
            <p className={`text-xs mt-1 font-semibold ${b.change_pct >= 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
              {b.change_display} today {b.alert_status === 'alert' && '· Intraday update triggered'}
            </p>
          </div>
        ))}
      </div>
    </div>

    <div>
      <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-widest">B2B Pricing Recommendations</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-5 gap-4 px-5 py-2.5 border-b border-gray-800 text-xs text-gray-500 font-semibold uppercase tracking-wider">
          <span className="col-span-2">SKU</span><span>Current</span><span>Recommended</span><span>Status</span>
        </div>
        {pricingRecs.map((s) => (
          <div key={s.id} className="grid grid-cols-5 gap-4 px-5 py-3.5 border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors items-center">
            <div className="col-span-2">
              <p className="text-white text-sm font-medium">{s.sku_name}</p>
              <p className="text-gray-500 text-xs">{s.segment} · {s.geography}</p>
            </div>
            <span className="text-gray-400 font-mono text-sm">{s.current_display}</span>
            <span className="text-amber-400 font-mono text-sm font-semibold">{s.recommended_display}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${
              s.rec_status === 'update_available' ? 'bg-amber-900/30 text-amber-400' :
              s.rec_status === 'overpriced'       ? 'bg-red-900/30 text-red-400' :
                                                   'bg-gray-800 text-gray-400'
            }`}>{s.rec_status.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Aviation Fuel Tab ─────────────────────────────────────────────────────────
interface AviationTabProps { forecasts: AviationForecast[]; contracts: AviationContract[]; }
const AviationTab: React.FC<AviationTabProps> = ({ forecasts, contracts }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard label="Airports Covered" value="600+" sub="Daily demand forecast" accent="text-purple-400" border="border-purple-800/30" />
      <KPICard label="90-Day Forecast Acc." value="88%" sub="MAPE target — current vs actuals" accent="text-amber-400" border="border-amber-800/30" />
      <KPICard label="Renewals Due 90 Days" value="14" sub="Contract negotiation packs ready" accent="text-orange-400" border="border-orange-800/20" />
      <KPICard label="Jet Crack Spread" value="$18.4/bbl" sub="Current Brent → Jet A-1 margin" accent="text-blue-400" border="border-blue-800/20" />
    </div>

    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white uppercase tracking-widest">Airport Demand Forecast — Top 5 by Volume</h2>
        <span className="text-xs text-gray-500">Updated daily · 90-day horizon</span>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-6 gap-4 px-5 py-2.5 border-b border-gray-800 text-xs text-gray-500 font-semibold uppercase tracking-wider">
          <span className="col-span-2">Airport</span><span>Airlines</span><span>30-Day Actual</span><span>90-Day Forecast</span><span>Contract Renewal</span>
        </div>
        {forecasts.map((a) => {
          const contract = contracts.find(c => c.iata_code === a.iata_code);
          return (
            <div key={a.id} className="grid grid-cols-6 gap-4 px-5 py-3.5 border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors items-center">
              <div className="col-span-2">
                <p className="text-white text-sm font-medium">{a.airport_name ?? a.iata_code}</p>
                <p className="text-gray-500 text-xs">{a.iata_code}</p>
              </div>
              <span className="text-gray-400 text-xs">{contract?.airline ?? '—'}</span>
              <span className="text-amber-400 font-mono text-sm">{a.d30_display}</span>
              <div>
                <span className="text-purple-400 font-mono text-sm">{a.d90_display}</span>
                <span className={`ml-2 text-xs font-semibold ${a.d90_delta_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{a.d90_delta_display}</span>
              </div>
              {contract
                ? <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${contract.days_to_renewal < 100 ? 'bg-orange-900/30 text-orange-400' : 'bg-gray-800 text-gray-400'}`}>{contract.days_to_renewal} days</span>
                : <span className="text-gray-600 text-xs">—</span>
              }
            </div>
          );
        })}
      </div>
    </div>

    <div className="bg-purple-900/10 border border-purple-800/30 rounded-xl p-5">
      <p className="text-xs text-purple-400 font-bold uppercase tracking-widest mb-2">Contract Negotiation Pack — FRA &amp; LHR Due in 87 Days</p>
      <p className="text-gray-400 text-sm">ARTEMIS-Aviation Agent has generated 90-day demand forecasts with confidence intervals, recommended fixed-price vs index-linked structure analysis, leverage assessment, and three-scenario P&amp;L models for both renewals. Available for download.</p>
      <button className="mt-3 text-xs border border-purple-700/50 text-purple-400 hover:bg-purple-900/20 px-3 py-1.5 rounded-lg transition-colors">View Contract Pack</button>
    </div>
  </div>
);

// ── Carbon Portfolio Tab ──────────────────────────────────────────────────────
interface CarbonTabProps { positions: CarbonPosition[]; recs: CarbonRecommendation[]; }
const CarbonTab: React.FC<CarbonTabProps> = ({ positions, recs }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard label="EU ETS Net Position" value="-30kt" sub="Dec-25 deficit — purchase recommended" accent="text-red-400" border="border-red-800/30" />
      <KPICard label="ETS Allowance Price" value="€48.20" sub="ICE Futures Europe · Dec-25" accent="text-amber-400" border="border-amber-800/30" />
      <KPICard label="Scope 1+2 Trajectory" value="On Track" sub="vs. Net-Zero 2030 milestone" accent="text-emerald-400" border="border-emerald-800/20" />
      <KPICard label="Portfolio Savings Target" value="$10–20M" sub="Per year vs unmanaged benchmark" accent="text-blue-400" border="border-blue-800/20" />
    </div>

    <div>
      <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-widest">Carbon Credit Portfolio</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-6 gap-4 px-5 py-2.5 border-b border-gray-800 text-xs text-gray-500 font-semibold uppercase tracking-wider">
          <span className="col-span-2">Credit Type</span><span>Holdings</span><span>Obligation</span><span>Net Position</span><span>Agent Action</span>
        </div>
        {positions.map((c) => {
          const rec = recs.find(r => r.credit_type === c.credit_type);
          const action = rec?.action.toUpperCase() ?? 'HOLD';
          const urgency = rec?.urgency ?? '';
          return (
            <div key={c.id} className="grid grid-cols-6 gap-4 px-5 py-3.5 border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors items-center">
              <div className="col-span-2">
                <p className="text-white text-sm font-medium">{c.credit_type}</p>
                <p className="text-gray-500 text-xs">{c.price_display}</p>
              </div>
              <span className="text-gray-300 font-mono text-sm">{c.holdings_display}</span>
              <span className="text-gray-400 font-mono text-sm">{c.obligation_display}</span>
              <span className={`font-mono text-sm font-semibold ${c.net_position_tonnes >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{c.net_position_display}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit ${
                action === 'BUY'  ? 'bg-emerald-900/30 text-emerald-400' :
                action === 'SELL' ? 'bg-amber-900/30 text-amber-400' :
                                   'bg-gray-800 text-gray-400'
              }`}>{action}{urgency && ` · ${urgency}`}</span>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

// ── Compliance Tab ────────────────────────────────────────────────────────────
interface ComplianceTabProps {
  complianceEvents: ArtemisComplianceEvent[];
  models: ArtemisModelRegistry[];
  auditLog: ArtemisAuditLog[];
}
const ComplianceTab: React.FC<ComplianceTabProps> = ({ complianceEvents, models, auditLog }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {complianceEvents.slice(0, 3).map(f => (
        <div key={f.id} className="bg-gray-900 border border-amber-800/30 rounded-xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">{f.framework}</p>
          <p className="text-white font-semibold text-sm">{f.status.toUpperCase()}</p>
          <p className="text-gray-500 text-xs mt-2 leading-relaxed">{f.detail}</p>
        </div>
      ))}
    </div>

    <div>
      <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-widest">Model Registry — SageMaker</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-5 gap-4 px-5 py-2.5 border-b border-gray-800 text-xs text-gray-500 font-semibold uppercase tracking-wider">
          <span className="col-span-2">Model</span><span>Status</span><span>Accuracy</span><span>Next Review</span>
        </div>
        {models.map((m) => (
          <div key={m.id} className="grid grid-cols-5 gap-4 px-5 py-3.5 border-b border-gray-800/50 last:border-0 items-center">
            <div className="col-span-2">
              <p className="text-white text-sm font-medium">{m.model_name} <span className="text-gray-600 text-xs">{m.version}</span></p>
              <p className="text-gray-500 text-xs">Drift: {m.drift_status}</p>
            </div>
            <span className="text-emerald-400 text-xs font-bold">{m.status}</span>
            <span className="text-amber-400 font-mono text-sm">{m.accuracy_pct.toFixed(1)}%</span>
            <span className={`text-xs font-semibold ${m.next_review_days < 15 ? 'text-orange-400' : 'text-gray-400'}`}>{m.next_review_days} days</span>
          </div>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">Audit Log — Recent</p>
        {auditLog.slice(0, 5).map(r => (
          <div key={r.id} className="flex justify-between py-1.5 border-b border-gray-800/50 last:border-0">
            <div className="min-w-0 mr-2">
              <span className="text-gray-400 text-sm truncate block">{r.recommendation_summary ?? r.action_type.replace(/_/g,' ')}</span>
              <span className="text-gray-600 text-xs">{r.agent_key} · {r.regulatory_tier}</span>
            </div>
            <span className="text-white font-mono text-xs shrink-0">{fmtLastSignal(r.created_at)}</span>
          </div>
        ))}
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">Data Residency</p>
        {[
          { region: 'EU (Frankfurt, Ireland)', framework: 'GDPR · EU AI Act', status: 'Compliant' },
          { region: 'UK (London)',              framework: 'UK GDPR · FCA',     status: 'Compliant' },
          { region: 'US (N.Virginia)',          framework: 'SOX · CFTC',        status: 'Compliant' },
          { region: 'Asia-Pacific (Singapore)', framework: 'PDPA · MAS TRM',    status: 'Compliant' },
          { region: 'UAE (UAE Central)',        framework: 'DIFC · UAE DP',     status: 'Compliant' },
        ].map(d => (
          <div key={d.region} className="flex justify-between items-center py-1.5 border-b border-gray-800/50 last:border-0">
            <div>
              <span className="text-gray-300 text-sm">{d.region}</span>
              <p className="text-gray-600 text-xs">{d.framework}</p>
            </div>
            <span className="text-emerald-400 text-xs font-semibold">{d.status}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Tabs config ───────────────────────────────────────────────────────────────
const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'command-centre', label: 'Command Centre' },
  { id: 'arbitrage',      label: 'Arbitrage Intelligence' },
  { id: 'castrol',        label: 'Castrol Pricing' },
  { id: 'aviation',       label: 'Aviation Fuel' },
  { id: 'carbon',         label: 'Carbon Portfolio' },
  { id: 'compliance',     label: 'Compliance' },
];

// ── Main Page ─────────────────────────────────────────────────────────────────
const Artemis: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>('command-centre');
  const [auditOpen, setAuditOpen] = useState(false);
  const d: ArtemisData = useArtemisData();

  return (
    <div className="min-h-screen bg-bp-dark font-sans">
      <AuditLogPanel
        isOpen={auditOpen}
        onClose={() => setAuditOpen(false)}
        domainId="04-commercial-trading"
        title="Artemis — Audit Log"
      />
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4">
          <button onClick={() => navigate('/dashboard')} className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1.5 mb-4 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Dashboard
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Commercial &amp; Trading</span>
                <span className="text-xs text-gray-600">v1.0.0</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">ARTEMIS</h1>
              <p className="text-gray-400 text-sm mt-1">Autonomous Real-Time Energy Market Intelligence System</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${d.loading ? 'bg-gray-800/30 text-gray-500 border-gray-700' : 'bg-emerald-900/30 text-emerald-400 border-emerald-800/30'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${d.loading ? 'bg-gray-500' : 'bg-emerald-400 animate-pulse'}`} />
                {d.loading ? 'Loading…' : `Live — ${d.agents.filter(a => a.status === 'active').length} Agents Active`}
              </span>
              <span className="text-xs text-gray-500 hidden sm:block">AWS · Capgemini Resonance</span>
              <button
                onClick={() => setAuditOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-900/30 text-emerald-400 border border-emerald-800/30 hover:bg-emerald-900/50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Audit Log
              </button>
            </div>
          </div>
        </div>
        {/* Tab Bar */}
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`text-xs font-semibold px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
                  tab === t.id ? 'border-amber-400 text-amber-400' : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        {tab === 'command-centre' && <CommandCentreTab agents={d.agents} auditLog={d.auditLog} complianceEvents={d.complianceEvents} />}
        {tab === 'arbitrage'      && <ArbitrageTab opportunities={d.opportunities} />}
        {tab === 'castrol'        && <CastrolTab baseOil={d.baseOil} pricingRecs={d.pricingRecs} />}
        {tab === 'aviation'       && <AviationTab forecasts={d.forecasts} contracts={d.contracts} />}
        {tab === 'carbon'         && <CarbonTab positions={d.carbonPositions} recs={d.carbonRecs} />}
        {tab === 'compliance'     && <ComplianceTab complianceEvents={d.complianceEvents} models={d.models} auditLog={d.auditLog} />}
      </main>
    </div>
  );
};

export default Artemis;
