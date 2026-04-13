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
        {tab === 'arbitrage'      && <div className="text-gray-500 text-sm">Arbitrage Intelligence — loading…</div>}
        {tab === 'castrol'        && <div className="text-gray-500 text-sm">Castrol Pricing — loading…</div>}
        {tab === 'aviation'       && <div className="text-gray-500 text-sm">Aviation Fuel — loading…</div>}
        {tab === 'carbon'         && <div className="text-gray-500 text-sm">Carbon Portfolio — loading…</div>}
        {tab === 'compliance'     && <div className="text-gray-500 text-sm">Compliance — loading…</div>}
      </main>
    </div>
  );
};

export default Artemis;
