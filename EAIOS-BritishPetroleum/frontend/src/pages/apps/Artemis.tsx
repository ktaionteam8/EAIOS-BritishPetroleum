import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
const RECENT_SIGNALS = [
  { agent: 'Trade', type: 'Arbitrage', detail: 'TTF Gas ↔ UK Power spread at 94th percentile', pnl: '+$2.1M', time: '4m ago', color: 'text-emerald-400' },
  { agent: 'Carbon', type: 'Portfolio', detail: 'EU ETS Dec-26 below 30-day MA — accumulation window', pnl: '-€0.8M risk', time: '11m ago', color: 'text-blue-400' },
  { agent: 'Castrol', type: 'Pricing', detail: 'Group II base oil +1.2% intraday — 14 SKU updates queued', pnl: 'Margin impact', time: '18m ago', color: 'text-amber-400' },
  { agent: 'Aviation', type: 'Contract', detail: 'Lufthansa FRA renewal due in 87 days — forecast ready', pnl: '$4.3M contract', time: '1h ago', color: 'text-purple-400' },
  { agent: 'Trade', type: 'Arbitrage', detail: 'Brent/Dubai crude quality differential at 18-month wide', pnl: '+$3.6M', time: '1h 22m ago', color: 'text-emerald-400' },
];

const CommandCentreTab: React.FC = () => (
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
        <AgentPanel name="ARTEMIS-Trade" scope="Crude · Gas · LNG · Power" status="active" signals={23} lastSignal="4m ago" metric="180" metricLabel="Spreads" />
        <AgentPanel name="ARTEMIS-Castrol" scope="B2B Pricing · 120+ Markets" status="active" signals={14} lastSignal="18m ago" metric="1,240" metricLabel="SKUs Priced" />
        <AgentPanel name="ARTEMIS-Aviation" scope="Jet A-1 · 600+ Airports" status="active" signals={6} lastSignal="1h ago" metric="88%" metricLabel="Forecast Acc." />
        <AgentPanel name="ARTEMIS-Carbon" scope="EU ETS · VCS · CORSIA" status="active" signals={9} lastSignal="11m ago" metric="€42.3" metricLabel="ETS Price" />
      </div>
    </div>

    {/* Recent Signals */}
    <div>
      <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-widest">Recent Intelligence Signals</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
        {RECENT_SIGNALS.map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gray-800 ${s.color} shrink-0`}>{s.agent}</span>
              <span className="text-gray-500 text-xs shrink-0">{s.type}</span>
              <p className="text-gray-300 text-sm truncate">{s.detail}</p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-emerald-400 text-xs font-mono">{s.pnl}</span>
              <span className="text-gray-600 text-xs">{s.time}</span>
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
        {[
          { label: 'SOX Audit Log', status: 'COMPLIANT', detail: 'Immutable WORM — 14,820 records today', color: 'text-emerald-400 border-emerald-800/30' },
          { label: 'UK FCA Supervisory Record', status: 'COMPLIANT', detail: 'All Tier 2 decisions logged · No MAR alerts', color: 'text-emerald-400 border-emerald-800/30' },
          { label: 'EU AI Act — Tier 2', status: 'COMPLIANT', detail: 'Models validated · Next review in 18 days', color: 'text-emerald-400 border-emerald-800/30' },
        ].map(c => (
          <div key={c.label} className={`bg-gray-900 border rounded-xl p-4 ${c.color.split(' ')[1]}`}>
            <p className={`text-xs font-bold uppercase tracking-widest ${c.color.split(' ')[0]} mb-1`}>{c.status}</p>
            <p className="text-white text-sm font-semibold">{c.label}</p>
            <p className="text-gray-500 text-xs mt-1">{c.detail}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Arbitrage Intelligence Tab ────────────────────────────────────────────────
const OPPORTUNITIES = [
  { spread: 'TTF Gas ↔ UK Power (NBP spark)',     level: '£38.4/MWh', pct: '94th',  pnl: '+$2.1M', window: '2–6h',    conf: 91, tier: 'Tier 2' },
  { spread: 'Brent/Dubai Quality Differential',   level: '$3.82/bbl', pct: '88th',  pnl: '+$3.6M', window: '1–3 days', conf: 84, tier: 'Tier 2' },
  { spread: 'LNG JKM ↔ TTF Cargo Arb',            level: '$4.10/mmBtu', pct: '79th', pnl: '+$1.8M', window: '4–8h',  conf: 76, tier: 'Tier 2' },
  { spread: 'EU ETS vs Carbon-Adjusted Gas Margin', level: '€6.2/tonne', pct: '72nd', pnl: '+$0.9M', window: '1–2 days', conf: 71, tier: 'Tier 2' },
  { spread: 'Brent M1–M3 Contango',                level: '$1.44/bbl', pct: '61st',  pnl: '+$1.2M', window: '3–5 days', conf: 68, tier: 'Tier 2' },
];

const ArbitrageTab: React.FC = () => (
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
        {OPPORTUNITIES.map((o, i) => (
          <div key={i} className="grid grid-cols-6 gap-4 px-5 py-3.5 border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors items-center">
            <span className="col-span-2 text-white text-sm font-medium">{o.spread}</span>
            <span className="text-amber-400 font-mono text-sm">{o.level}</span>
            <span className="text-gray-300 text-sm">{o.pct}</span>
            <span className="text-emerald-400 font-mono text-sm font-semibold">{o.pnl}</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${o.conf}%` }} />
              </div>
              <span className="text-xs text-gray-400 font-mono w-8">{o.conf}%</span>
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
const BASE_OIL = [
  { grade: 'Group I SN 150',  price: '$862/MT',  change: '+0.4%', status: 'Normal' },
  { grade: 'Group II 100N',   price: '$894/MT',  change: '+1.2%', status: 'Alert'  },
  { grade: 'Group III 4cSt',  price: '$1,108/MT', change: '+0.7%', status: 'Normal' },
];
const PRICING_SKU = [
  { sku: 'Castrol Hyspin AWS 46',   segment: 'Industrial',  curr: '$3.42/L', rec: '$3.49/L', margin: '+2.0%', status: 'Update Available' },
  { sku: 'Castrol Optigear 320',    segment: 'Industrial',  curr: '$6.18/L', rec: '$6.18/L', margin: 'Stable', status: 'At Recommended' },
  { sku: 'Castrol Syntilo 9954',    segment: 'Metalworking', curr: '$4.85/L', rec: '$4.72/L', margin: '-2.7%', status: 'Overpriced' },
  { sku: 'Castrol Tribol 800/W',    segment: 'Industrial',  curr: '$9.10/L', rec: '$9.32/L', margin: '+2.4%', status: 'Update Available' },
  { sku: 'Castrol Perfecto T 46',   segment: 'Power Gen',   curr: '$4.20/L', rec: '$4.20/L', margin: 'Stable', status: 'At Recommended' },
];

const CastrolTab: React.FC = () => (
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
        {BASE_OIL.map(b => (
          <div key={b.grade} className={`bg-gray-900 border rounded-xl p-4 ${b.status === 'Alert' ? 'border-orange-800/40' : 'border-gray-800'}`}>
            <p className="text-white text-sm font-semibold">{b.grade}</p>
            <p className="text-amber-400 text-2xl font-bold font-mono mt-2">{b.price}</p>
            <p className={`text-xs mt-1 font-semibold ${b.change.startsWith('+') ? 'text-orange-400' : 'text-emerald-400'}`}>{b.change} today {b.status === 'Alert' && '· Intraday update triggered'}</p>
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
        {PRICING_SKU.map((s, i) => (
          <div key={i} className="grid grid-cols-5 gap-4 px-5 py-3.5 border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors items-center">
            <div className="col-span-2">
              <p className="text-white text-sm font-medium">{s.sku}</p>
              <p className="text-gray-500 text-xs">{s.segment}</p>
            </div>
            <span className="text-gray-400 font-mono text-sm">{s.curr}</span>
            <span className="text-amber-400 font-mono text-sm font-semibold">{s.rec}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${
              s.status === 'Update Available' ? 'bg-amber-900/30 text-amber-400' :
              s.status === 'Overpriced'       ? 'bg-red-900/30 text-red-400' :
                                               'bg-gray-800 text-gray-400'
            }`}>{s.status}</span>
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

  return (
    <div className="min-h-screen bg-bp-dark font-sans">
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
              <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-800/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live — 4 Agents Active
              </span>
              <span className="text-xs text-gray-500 hidden sm:block">AWS · Capgemini Resonance</span>
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
        {tab === 'command-centre' && <CommandCentreTab />}
        {tab === 'arbitrage'      && <ArbitrageTab />}
        {tab === 'castrol'        && <CastrolTab />}
        {tab === 'aviation'       && <div className="text-gray-500 text-sm">Aviation Fuel — loading…</div>}
        {tab === 'carbon'         && <div className="text-gray-500 text-sm">Carbon Portfolio — loading…</div>}
        {tab === 'compliance'     && <div className="text-gray-500 text-sm">Compliance — loading…</div>}
      </main>
    </div>
  );
};

export default Artemis;
