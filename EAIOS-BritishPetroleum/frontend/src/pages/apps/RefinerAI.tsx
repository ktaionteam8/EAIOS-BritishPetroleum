import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Types ─────────────────────────────────────────────────────────────────────
type TabId =
  | 'dashboard'
  | 'live-alerts'
  | 'equipment-health'
  | 'digital-twin'
  | 'ai-advisor'
  | 'ml-models'
  | 'spare-parts'
  | 'work-orders'
  | 'roi'
  | 'reliability'
  | 'compliance'
  | 'field-ops'
  | 'energy'
  | 'tar';

// ── KPI Card ──────────────────────────────────────────────────────────────────
interface KPICardProps {
  label: string;
  value: string;
  sub: string;
  accent: string;
  border: string;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, sub, accent, border }) => (
  <div className={`bg-gray-900 border ${border} rounded-xl p-5 flex flex-col gap-1`}>
    <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">{label}</p>
    <p className={`text-3xl font-bold ${accent}`}>{value}</p>
    <p className="text-xs text-gray-500">{sub}</p>
  </div>
);

// ── Refinery dot on world map ─────────────────────────────────────────────────
interface RefineryDotProps {
  top: number; left: number;
  status: 'healthy' | 'warning' | 'critical';
  label?: string;
}
const DOT_COLOR = { healthy: '#22c55e', warning: '#f59e0b', critical: '#ef4444' };
const RefineryDot: React.FC<RefineryDotProps> = ({ top, left, status, label }) => (
  <div style={{ position: 'absolute', top: `${top}%`, left: `${left}%` }}>
    <div style={{
      width: 10, height: 10, borderRadius: '50%',
      background: DOT_COLOR[status],
      boxShadow: `0 0 6px ${DOT_COLOR[status]}`,
    }} />
    {label && (
      <p style={{ fontSize: 9, color: '#9ca3af', whiteSpace: 'nowrap', marginTop: 2 }}>{label}</p>
    )}
  </div>
);

// ── Alert Row ─────────────────────────────────────────────────────────────────
interface AlertRowProps {
  severity: 'critical' | 'warning' | 'advisory';
  title: string;
  site: string;
  details: string;
  rul: string;
  confidence: number;
  time: string;
}
const SEV_COLOR = { critical: '#ef4444', warning: '#f59e0b', advisory: '#60a5fa' };
const AlertRow: React.FC<AlertRowProps> = ({ severity, title, site, details, rul, confidence, time }) => (
  <div className="border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: SEV_COLOR[severity], flexShrink: 0, marginTop: 6 }} />
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold leading-tight">{title}</p>
          <p className="text-gray-500 text-xs mt-0.5">{site} · {details} · RUL: {rul} · Confidence: {confidence}%</p>
        </div>
      </div>
      <span className="text-gray-600 text-xs whitespace-nowrap flex-shrink-0">{time}</span>
    </div>
  </div>
);

// ── Equipment Row ─────────────────────────────────────────────────────────────
interface EquipmentRowProps {
  tag: string; name: string; site: string;
  health: number; rul: string;
  aiStatus: 'CRITICAL' | 'WARNING' | 'HEALTHY';
  action: string;
}
const STATUS_COLOR = { CRITICAL: '#ef4444', WARNING: '#f59e0b', HEALTHY: '#22c55e' };
const EquipmentRow: React.FC<EquipmentRowProps> = ({ tag, name, site, health, rul, aiStatus, action }) => (
  <tr className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
    <td className="py-3 px-4 text-purple-400 text-sm font-mono">{tag}</td>
    <td className="py-3 px-4 text-white text-sm">{name}</td>
    <td className="py-3 px-4 text-gray-400 text-sm">{site}</td>
    <td className="py-3 px-4">
      <span className="text-sm font-semibold" style={{ color: health < 50 ? '#ef4444' : health < 70 ? '#f59e0b' : '#22c55e' }}>{health}%</span>
    </td>
    <td className="py-3 px-4 text-gray-400 text-sm font-mono">{rul}</td>
    <td className="py-3 px-4">
      <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: `${STATUS_COLOR[aiStatus]}22`, color: STATUS_COLOR[aiStatus] }}>{aiStatus}</span>
    </td>
    <td className="py-3 px-4">
      <button className="text-xs text-purple-400 border border-purple-800 px-3 py-1 rounded hover:bg-purple-900/30 transition-colors">{action}</button>
    </td>
  </tr>
);

// ── REQ-04: Failure Prediction Gantt data ────────────────────────────────────
interface GanttItem {
  tag: string; name: string; site: string;
  rul: number; conf: number;
  sev: 'critical' | 'high' | 'medium' | 'low';
}
const GANTT_ITEMS: GanttItem[] = [
  { tag: 'C-101', name: 'Centrifugal Compressor', site: 'Ruwais, UAE',       rul: 2,  conf: 97.3, sev: 'critical' },
  { tag: 'E-212', name: 'Shell & Tube Exchanger', site: 'Houston, USA',      rul: 3,  conf: 91.8, sev: 'critical' },
  { tag: 'P-205', name: 'Centrifugal Pump',       site: 'Houston, USA',      rul: 8,  conf: 78.3, sev: 'high'     },
  { tag: 'T-405', name: 'Gas Turbine',            site: 'Ras Tanura, KSA',   rul: 14, conf: 71.6, sev: 'high'     },
  { tag: 'K-302', name: 'Screw Compressor',       site: 'Jamnagar, India',   rul: 22, conf: 65.2, sev: 'medium'   },
  { tag: 'V-305', name: 'Separator Vessel',       site: 'Cherry Point, USA', rul: 28, conf: 62.1, sev: 'medium'   },
  { tag: 'G-302', name: 'Gas Turbine',            site: 'Ras Tanura, KSA',   rul: 35, conf: 58.4, sev: 'medium'   },
  { tag: 'F-101', name: 'Fired Heater',           site: 'Rotterdam, NL',     rul: 41, conf: 54.7, sev: 'medium'   },
  { tag: 'R-201', name: 'Reactor',                site: 'Whiting, USA',      rul: 48, conf: 51.2, sev: 'low'      },
  { tag: 'P-401', name: 'Crude Pump',             site: 'Ras Tanura, KSA',   rul: 55, conf: 48.9, sev: 'low'      },
  { tag: 'C-203', name: 'Cooling Tower Fan',      site: 'Castellon, ES',     rul: 62, conf: 44.3, sev: 'low'      },
  { tag: 'K-201', name: 'Reformer Heater',        site: 'Gelsenkirchen, DE', rul: 71, conf: 41.8, sev: 'low'      },
  { tag: 'E-501', name: 'Pre-heater',             site: 'Rotterdam, NL',     rul: 78, conf: 38.5, sev: 'low'      },
  { tag: 'T-103', name: 'Storage Tank',           site: 'Ruwais, UAE',       rul: 85, conf: 35.2, sev: 'low'      },
];
const GANTT_COLOR: Record<string, string> = { critical: '#ef4444', high: '#f59e0b', medium: '#60a5fa', low: '#4ade80' };
const GRID_DAYS = [7, 14, 21, 30, 45, 60, 75, 90];
const HORIZON = 90;

const FailurePredictionGantt: React.FC = () => {
  const LW = 195, CW = 620, W = LW + CW;
  const ROW = 30, HDR = 26;
  const H = HDR + GANTT_ITEMS.length * ROW;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <div>
          <h3 className="text-white font-semibold text-sm">REQ-04 · Failure Prediction Timeline — 90-Day Horizon</h3>
          <p className="text-gray-500 text-xs mt-0.5">AI-predicted failure dates · sorted by urgency · confidence-weighted</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {([['critical','#ef4444','< 7d'],['high','#f59e0b','7–30d'],['medium','#60a5fa','30–60d'],['low','#4ade80','60–90d']] as [string,string,string][]).map(([s,c,l]) => (
            <span key={s} className="flex items-center gap-1.5 text-gray-400">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: c }} />{l}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height: H, minWidth: 600 }}>
          {/* Day gridlines + labels */}
          {GRID_DAYS.map(d => {
            const x = LW + (d / HORIZON) * CW;
            return (
              <g key={d}>
                <line x1={x} y1={HDR} x2={x} y2={H} stroke="#1f2937" strokeWidth="1" />
                <text x={x} y={HDR - 7} fill="#4b5563" fontSize="8" textAnchor="middle">Day {d}</text>
              </g>
            );
          })}

          {/* Today marker */}
          <line x1={LW} y1={0} x2={LW} y2={H} stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="5,3" />
          <text x={LW} y={HDR - 7} fill="#a78bfa" fontSize="8" textAnchor="middle" fontWeight="bold">TODAY</text>

          {/* Rows */}
          {GANTT_ITEMS.map((g, i) => {
            const y = HDR + i * ROW;
            const col = GANTT_COLOR[g.sev];
            const barW = Math.max(6, (g.rul / HORIZON) * CW);
            const midY = y + ROW / 2;
            return (
              <g key={g.tag}>
                {i % 2 === 0 && <rect x={0} y={y} width={W} height={ROW} fill="#0d1117" opacity="0.6" />}

                {/* Tag */}
                <text x={4} y={midY - 4} fill={col} fontSize="9" fontWeight="bold" dominantBaseline="middle">{g.tag}</text>
                {/* Name */}
                <text x={46} y={midY - 4} fill="#e5e7eb" fontSize="8" dominantBaseline="middle">{g.name}</text>
                {/* Site */}
                <text x={46} y={midY + 7} fill="#6b7280" fontSize="7" dominantBaseline="middle">{g.site}</text>

                {/* Risk bar (filled) */}
                <rect x={LW} y={y + 8} width={barW} height={ROW - 16} fill={col} opacity={0.18} rx="3" />
                <rect x={LW} y={y + 8} width={barW} height={ROW - 16} fill="none" stroke={col} strokeWidth="1" rx="3" opacity="0.7" />

                {/* Failure marker dot */}
                <circle cx={LW + barW} cy={midY} r="4" fill={col} />

                {/* RUL label */}
                <text x={LW + barW + 7} y={midY - 4} fill={col} fontSize="8" fontWeight="bold" dominantBaseline="middle">
                  {g.rul < 1 ? '<1d' : `${g.rul}d`}
                </text>
                <text x={LW + barW + 7} y={midY + 7} fill="#6b7280" fontSize="7" dominantBaseline="middle">{g.conf}%</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Summary strip */}
      <div className="px-5 py-3 border-t border-gray-800 flex items-center gap-6 text-xs">
        <span className="text-gray-500">14 assets in failure prediction window</span>
        <span className="text-red-400 font-semibold">2 critical — action required now</span>
        <span className="text-amber-400 font-semibold">2 high — schedule within 14 days</span>
        <span className="text-blue-400 font-semibold">4 medium — plan within 45 days</span>
        <span className="text-gray-500 ml-auto">Estimated exposure if unaddressed: <span className="text-white font-semibold">$18.4M</span></span>
      </div>
    </div>
  );
};

// ── Dashboard Tab ─────────────────────────────────────────────────────────────
const DashboardTab: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KPICard label="Unplanned Events Avoided" value="38.2%" sub="↑ Target: 40% — on track" accent="text-green-400" border="border-green-900/50" />
      <KPICard label="Equipment Monitored"      value="6,842"  sub="↑ 312 newly onboarded"   accent="text-blue-400"  border="border-blue-900/50"  />
      <KPICard label="Critical Alerts (24h)"    value="14"     sub="↑ 3 from yesterday"      accent="text-orange-400" border="border-orange-900/50" />
      <KPICard label="AI Model Accuracy"        value="94.7%"  sub="↑ +1.2% from last retrain" accent="text-purple-400" border="border-purple-900/50" />
    </div>

    {/* World Map */}
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold">Global Refinery Health Map</h3>
          <p className="text-gray-500 text-xs">Real-time status · 40 sites worldwide</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"/><span className="text-gray-400">Healthy</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"/><span className="text-gray-400">Warning</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"/><span className="text-gray-400">Critical</span></span>
        </div>
      </div>
      <div className="relative rounded-lg overflow-hidden" style={{ height: 220, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }} viewBox="0 0 800 400">
          <ellipse cx="160" cy="170" rx="100" ry="80" fill="#4b5563"/>
          <ellipse cx="200" cy="310" rx="55"  ry="70" fill="#4b5563"/>
          <ellipse cx="420" cy="140" rx="50"  ry="45" fill="#4b5563"/>
          <ellipse cx="430" cy="270" rx="60"  ry="75" fill="#4b5563"/>
          <ellipse cx="600" cy="170" rx="130" ry="80" fill="#4b5563"/>
          <ellipse cx="660" cy="320" rx="55"  ry="40" fill="#4b5563"/>
        </svg>
        <RefineryDot top={42} left={19}  status="warning"  label="Houston" />
        <RefineryDot top={35} left={55}  status="healthy"  label="Rotterdam" />
        <RefineryDot top={28} left={68}  status="critical" label="Ruwais, UAE" />
        <RefineryDot top={38} left={73}  status="warning"  label="Ras Tanura" />
        <RefineryDot top={43} left={77}  status="healthy"  label="Jamnagar" />
        <RefineryDot top={20} left={62}  status="healthy"  />
        <RefineryDot top={15} left={74}  status="healthy"  />
        <RefineryDot top={50} left={10}  status="healthy"  />
        <RefineryDot top={78} left={80}  status="healthy"  />
        <RefineryDot top={60} left={48}  status="healthy"  />
      </div>
    </div>

    {/* REQ-04 — Failure Prediction Gantt */}
    <FailurePredictionGantt />

    {/* REQ-10 — Multi-Site Benchmarking */}
    <MultiSiteBenchmark />
  </div>
);

// ── Live Alerts Tab ───────────────────────────────────────────────────────────
const LiveAlertsTab: React.FC = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-5 gap-3">
      {[['4','CRITICAL','text-red-400','border-red-900/50'],['7','WARNING','text-amber-400','border-amber-900/50'],['3','ADVISORY','text-blue-400','border-blue-900/50'],['48','RESOLVED 24H','text-gray-400','border-gray-800'],['94.7%','AI CONFIDENCE AVG','text-purple-400','border-purple-900/50']].map(([v,l,t,b]) => (
        <div key={l} className={`bg-gray-900 border ${b} rounded-xl p-4`}>
          <p className={`text-2xl font-bold ${t}`}>{v}</p>
          <p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">{l}</p>
        </div>
      ))}
    </div>
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Active Alerts — AI Prioritised</h3>
        <span className="text-xs bg-purple-900/40 text-purple-400 px-2 py-1 rounded font-mono">LSTM + XGBOOST</span>
      </div>
      <div className="space-y-3">
        <AlertRow severity="critical" title="Bearing Failure Predicted — Compressor C-101" site="Ruwais, UAE" details="Loop 4A · Vibration 8.4 mm/s" rul="48h" confidence={97.3} time="2m ago" />
        <AlertRow severity="warning"  title="Fouling Shutdown Risk — Heat Exchanger E-212" site="Houston, USA" details="VDU Train B · Efficiency -18%" rul="72h" confidence={91.8} time="15m ago" />
        <AlertRow severity="warning"  title="Vibration Anomaly — Pump P-205"               site="Houston, USA" details="CDU Train B · Impeller imbalance" rul="8d" confidence={78.3} time="1h ago" />
        <AlertRow severity="advisory" title="Blade Erosion Detected — Turbine T-405"        site="Ras Tanura, KSA" details="Power Gen Unit 3 · IR signature anomaly" rul="14d" confidence={71.6} time="2h ago" />
      </div>
    </div>

    {/* REQ-12 — Anomaly Detection Heatmap */}
    <AnomalyHeatmap />

    {/* REQ-16 — Alert Escalation Matrix */}
    <EscalationMatrix />
  </div>
);

// ── REQ-03: FFT Spectrum data & panel ─────────────────────────────────────────
interface FFTPoint { freq: number; amp: number; label?: string; fault?: 'critical' | 'warning' | 'normal'; }
interface FFTAsset { name: string; rpm: number; alarm: number; bars: FFTPoint[]; t90: number; t60: number; t30: number; }

const FFT_ASSETS: Record<string, FFTAsset> = {
  'C-101': { name: 'Compressor C-101 · Ruwais', rpm: 3580, alarm: 7.1, t90: 1.1, t60: 2.8, t30: 4.2,
    bars: [
      { freq: 20, amp: 0.4 }, { freq: 35, amp: 0.6 },
      { freq: 42, amp: 2.1, label: 'BSF',    fault: 'warning'  },
      { freq: 50, amp: 1.2, label: '1×RPM',  fault: 'normal'   },
      { freq: 62, amp: 1.8, label: 'BPFO',   fault: 'warning'  },
      { freq: 75, amp: 0.5 },
      { freq: 87, amp: 8.4, label: 'BPFI ▲', fault: 'critical' },
      { freq: 100,amp: 0.7, label: '2×RPM',  fault: 'normal'   },
      { freq: 130,amp: 0.5 },
      { freq: 175,amp: 3.1, label: 'BPFI×2', fault: 'warning'  },
    ],
  },
  'E-212': { name: 'Exchanger E-212 · Houston', rpm: 1450, alarm: 5.0, t90: 0.9, t60: 1.4, t30: 2.1,
    bars: [
      { freq: 24, amp: 0.3 },
      { freq: 48, amp: 2.8, label: '2×RPM', fault: 'warning' },
      { freq: 72, amp: 0.6 },
      { freq: 96, amp: 0.8 },
      { freq: 144,amp: 0.4 },
    ],
  },
  'P-205': { name: 'Pump P-205 · Houston', rpm: 2950, alarm: 5.0, t90: 0.7, t60: 1.1, t30: 1.9,
    bars: [
      { freq: 15, amp: 0.4 },
      { freq: 49, amp: 1.6, label: '1×RPM', fault: 'normal' },
      { freq: 65, amp: 2.2, label: 'Impeller BPF', fault: 'warning' },
      { freq: 98, amp: 0.9 },
      { freq: 130,amp: 0.5 },
    ],
  },
  'T-405': { name: 'Turbine T-405 · Ras Tanura', rpm: 3000, alarm: 6.0, t90: 0.8, t60: 1.2, t30: 1.6,
    bars: [
      { freq: 25, amp: 0.4 },
      { freq: 50, amp: 1.0, label: '1×RPM', fault: 'normal' },
      { freq: 75, amp: 1.9, label: 'Blade pass', fault: 'warning' },
      { freq: 100,amp: 0.6 },
      { freq: 150,amp: 0.3 },
    ],
  },
  'K-302': { name: 'Compressor K-302 · Jamnagar', rpm: 8200, alarm: 7.1, t90: 0.3, t60: 0.4, t30: 0.5,
    bars: [
      { freq: 30, amp: 0.3 },
      { freq: 60, amp: 0.5, label: '1×RPM', fault: 'normal' },
      { freq: 90, amp: 0.4 },
      { freq: 120,amp: 0.6 },
      { freq: 180,amp: 0.3 },
    ],
  },
};

const FFT_FAULT_COLOR: Record<string, string> = { critical: '#ef4444', warning: '#f59e0b', normal: '#60a5fa', none: '#374151' };

const VibrationSpectrumPanel: React.FC<{ assetId: string }> = ({ assetId }) => {
  const d = FFT_ASSETS[assetId];
  if (!d) return null;
  const W = 700, H = 180, PL = 36, PR = 30, PT = 20, PB = 28;
  const cW = W - PL - PR, cH = H - PT - PB;
  const maxAmp = 10, maxFreq = 200;
  const nowAmp = Math.max(...d.bars.map(b => b.amp));
  const growth = nowAmp > 0 && d.t90 > 0 ? (((nowAmp - d.t90) / d.t90) * 100).toFixed(0) : '—';

  return (
    <div className="bg-gray-900 border border-purple-900/40 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <div>
          <h4 className="text-white font-semibold text-sm">FFT Vibration Spectrum — {d.name}</h4>
          <p className="text-gray-500 text-xs mt-0.5">{d.rpm.toLocaleString()} RPM · Alarm: {d.alarm} mm/s · ISO 13373-3</p>
        </div>
        <div className="flex items-center gap-5 text-xs">
          {[['BPFI','Inner Race','text-red-400'],['BPFO','Outer Race','text-amber-400'],['BSF','Ball Spin','text-amber-400'],['1×RPM','Imbalance','text-blue-400']].map(([k,v,c]) => (
            <div key={k} className="text-center">
              <p className={`font-mono font-bold ${c}`}>{k}</p>
              <p className="text-gray-600" style={{ fontSize: 10 }}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height: H }}>
          {/* Grid + Y labels */}
          {[0, 2.5, 5, 7.5, 10].map(v => {
            const y = PT + cH - (v / maxAmp) * cH;
            return (
              <g key={v}>
                <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#1f2937" strokeWidth="1" />
                <text x={PL - 4} y={y + 3} fill="#6b7280" fontSize="8" textAnchor="end">{v}</text>
              </g>
            );
          })}
          {/* Alarm line */}
          {(() => { const y = PT + cH - (d.alarm / maxAmp) * cH; return (
            <g>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6,4" />
              <text x={W - PR + 3} y={y + 3} fill="#ef4444" fontSize="8">Alarm {d.alarm}</text>
            </g>
          ); })()}
          {/* Bars */}
          {d.bars.map((b, i) => {
            const x = PL + (b.freq / maxFreq) * cW;
            const bH = (b.amp / maxAmp) * cH;
            const y = PT + cH - bH;
            const col = FFT_FAULT_COLOR[b.fault ?? 'none'];
            return (
              <g key={i}>
                <rect x={x - 5} y={y} width={10} height={bH} fill={col} opacity={0.85} rx="2" />
                {b.label && <text x={x} y={y - 4} fill={col} fontSize="7" textAnchor="middle" fontWeight="bold">{b.label}</text>}
              </g>
            );
          })}
          {/* X axis labels */}
          {[0, 50, 100, 150, 200].map(v => (
            <text key={v} x={PL + (v / maxFreq) * cW} y={H - 4} fill="#6b7280" fontSize="8" textAnchor="middle">{v} Hz</text>
          ))}
          <text x={10} y={H / 2} fill="#6b7280" fontSize="8" textAnchor="middle" transform={`rotate(-90, 10, ${H / 2})`}>mm/s</text>
        </svg>

        {/* Trend strip */}
        <div className="flex items-center gap-6 mt-2 pt-3 border-t border-gray-800">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Peak Growth:</p>
          {([['90d ago', d.t90, 'text-green-400'], ['60d ago', d.t60, 'text-yellow-400'], ['30d ago', d.t30, 'text-orange-400'], ['Now', nowAmp, 'text-red-400']] as [string, number, string][]).map(([l, v, c]) => (
            <div key={l} className="text-center">
              <p className={`text-sm font-bold font-mono ${c}`}>{v.toFixed(1)}</p>
              <p className="text-gray-600 text-xs">{l}</p>
            </div>
          ))}
          <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-800">
            <div className="h-full rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" style={{ width: '100%' }} />
          </div>
          <span className="text-red-400 text-xs font-bold">↑ {growth}% in 90d</span>
        </div>
      </div>
    </div>
  );
};

// ── REQ-06: Risk Matrix 5×5 ──────────────────────────────────────────────────
interface RiskEquipment { tag: string; l: number; c: number; dx?: number; dy?: number; }
const RISK_EQUIPMENT: RiskEquipment[] = [
  { tag: 'C-101', l: 5, c: 5 },
  { tag: 'E-212', l: 4, c: 4 },
  { tag: 'P-205', l: 3, c: 4, dx: -14 },
  { tag: 'T-405', l: 3, c: 4, dx: 14 },
  { tag: 'G-302', l: 3, c: 3 },
  { tag: 'V-305', l: 2, c: 3 },
  { tag: 'K-302', l: 1, c: 2 },
];
const RISK_COLOR = (rpn: number) =>
  rpn >= 15 ? { bg: '#3b0a0a', border: '#ef4444', text: '#f87171' }
: rpn >= 10 ? { bg: '#2d1400', border: '#f97316', text: '#fb923c' }
: rpn >=  5 ? { bg: '#2a1e00', border: '#fbbf24', text: '#fcd34d' }
:             { bg: '#071a0d', border: '#4ade80', text: '#86efac' };

const LIKELIHOOD_LABELS = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];
const CONSEQUENCE_LABELS = ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'];

const RiskMatrix5x5: React.FC = () => {
  const CELL = 74, LW = 108, BH = 32, PAD = 16;
  const W = LW + 5 * CELL + PAD;
  const H = 5 * CELL + BH + PAD;

  return (
    <div className="bg-gray-900 border border-orange-900/40 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <div>
          <h4 className="text-white font-semibold text-sm">REQ-06 · Risk Matrix (5×5) — Equipment Criticality</h4>
          <p className="text-gray-500 text-xs mt-0.5">ISO 31000 · Likelihood × Consequence = RPN · Equipment plotted by AI assessment</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {([['≥15','#ef4444','CRITICAL'],['10–14','#f97316','HIGH'],['5–9','#fbbf24','MEDIUM'],['1–4','#4ade80','LOW']] as [string,string,string][]).map(([r,c,l]) => (
            <span key={l} className="flex items-center gap-1.5 text-gray-400">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />{l} ({r})
            </span>
          ))}
        </div>
      </div>

      <div className="p-5">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height: H }}>
          {/* Grid cells */}
          {[1,2,3,4,5].map(l =>
            [1,2,3,4,5].map(c => {
              const rpn = l * c;
              const { bg, border } = RISK_COLOR(rpn);
              const x = LW + (c - 1) * CELL;
              const y = (5 - l) * CELL;
              return (
                <g key={`${l}-${c}`}>
                  <rect x={x} y={y} width={CELL} height={CELL} fill={bg} stroke={border} strokeWidth="0.5" opacity="0.9" />
                  <text x={x + CELL / 2} y={y + CELL / 2} fill={border} fontSize="11" textAnchor="middle"
                    dominantBaseline="middle" fontWeight="bold" opacity="0.4">{rpn}</text>
                </g>
              );
            })
          )}

          {/* Y-axis labels (Likelihood) */}
          {LIKELIHOOD_LABELS.map((label, i) => {
            const l = i + 1;
            const y = (5 - l) * CELL + CELL / 2;
            return <text key={label} x={LW - 6} y={y} fill="#9ca3af" fontSize="8" textAnchor="end" dominantBaseline="middle">{label}</text>;
          })}

          {/* X-axis labels (Consequence) */}
          {CONSEQUENCE_LABELS.map((label, i) => {
            const x = LW + i * CELL + CELL / 2;
            return <text key={label} x={x} y={5 * CELL + 18} fill="#9ca3af" fontSize="8" textAnchor="middle">{label}</text>;
          })}

          {/* Axis titles */}
          <text x={LW / 2 - 10} y={5 * CELL / 2} fill="#6b7280" fontSize="9" textAnchor="middle"
            transform={`rotate(-90,${LW / 2 - 10},${5 * CELL / 2})`}>Likelihood ↑</text>
          <text x={LW + 5 * CELL / 2} y={5 * CELL + 30} fill="#6b7280" fontSize="9" textAnchor="middle">Consequence →</text>

          {/* Equipment dots */}
          {RISK_EQUIPMENT.map(eq => {
            const rpn = eq.l * eq.c;
            const { border } = RISK_COLOR(rpn);
            const cx = LW + (eq.c - 1) * CELL + CELL / 2 + (eq.dx ?? 0);
            const cy = (5 - eq.l) * CELL + CELL / 2 + (eq.dy ?? 0);
            return (
              <g key={eq.tag}>
                <circle cx={cx} cy={cy} r={16} fill={border} opacity="0.15" />
                <circle cx={cx} cy={cy} r={4}  fill={border} />
                <text x={cx} y={cy - 12} fill={border} fontSize="8" fontWeight="bold" textAnchor="middle">{eq.tag}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend table */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-4 gap-2">
          {RISK_EQUIPMENT.map(eq => {
            const rpn = eq.l * eq.c;
            const { border, text } = RISK_COLOR(rpn);
            const label = rpn >= 15 ? 'CRITICAL' : rpn >= 10 ? 'HIGH' : rpn >= 5 ? 'MEDIUM' : 'LOW';
            return (
              <div key={eq.tag} className="bg-gray-800 rounded-lg px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-mono font-bold" style={{ color: border }}>{eq.tag}</span>
                <span className="text-xs font-semibold" style={{ color: text }}>RPN {rpn} · {label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Equipment Health Tab ──────────────────────────────────────────────────────
const EquipmentHealthTab: React.FC = () => {
  const [fftAsset, setFftAsset] = useState('C-101');
  return (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-3">
      {[['6,321','HEALTHY','text-green-400','border-green-900/50'],['387','WARNING','text-amber-400','border-amber-900/50'],['134','ACTION REQUIRED','text-red-400','border-red-900/50'],['6,842','TOTAL ASSETS','text-white','border-gray-800']].map(([v,l,t,b]) => (
        <div key={l} className={`bg-gray-900 border ${b} rounded-xl p-4`}>
          <p className={`text-2xl font-bold ${t}`}>{v}</p>
          <p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">{l}</p>
        </div>
      ))}
    </div>
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <h3 className="text-white font-semibold">Equipment Health Register — Predictive Index</h3>
        <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded">LIVE · ALL 40 REFINERIES</span>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            {['Tag','Equipment','Site','Health','RUL','AI Status','Action'].map(h => (
              <th key={h} className="py-3 px-4 text-left text-xs text-gray-500 uppercase tracking-wider font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <EquipmentRow tag="C-101" name="Centrifugal Compressor · MAN Turbomachinery Series-7" site="Ruwais, UAE"     health={38} rul="48h"  aiStatus="CRITICAL" action="Dispatch" />
          <EquipmentRow tag="E-212" name="Shell & Tube Exchanger · Lummus 400v Series"           site="Houston, USA"   health={52} rul="3d"   aiStatus="CRITICAL" action="Dispatch" />
          <EquipmentRow tag="P-205" name="Centrifugal Pump · KSB Multitec 100-8"                 site="Houston, USA"   health={64} rul="8d"   aiStatus="WARNING"  action="Schedule" />
          <EquipmentRow tag="T-405" name="Gas Turbine · GE Onsite-100A"                          site="Ras Tanura, KSA" health={72} rul="14d"  aiStatus="WARNING"  action="Schedule" />
          <EquipmentRow tag="K-302" name="Centrifugal Compressor · Siemens SGT-800"              site="Jamnagar, India" health={91} rul="45d"  aiStatus="HEALTHY"  action="Monitor"  />
        </tbody>
      </table>
    </div>

    {/* REQ-03 — Vibration FFT Spectrum Analyser */}
    <div>
      <div className="flex items-center gap-3 mb-3">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest">Spectrum Analysis — Select Asset:</p>
        {Object.keys(FFT_ASSETS).map(id => (
          <button key={id} onClick={() => setFftAsset(id)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors font-mono ${fftAsset === id ? 'bg-purple-900/50 text-purple-300 border-purple-700' : 'text-gray-500 border-gray-700 hover:border-gray-500'}`}>
            {id}
          </button>
        ))}
      </div>
      <VibrationSpectrumPanel assetId={fftAsset} />
    </div>

    {/* REQ-07 — Health Trend & Degradation Forecast */}
    <div>
      <div className="flex items-center gap-3 mb-3">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest">Degradation Forecast — Select Asset:</p>
        {Object.keys(HEALTH_TREND).map(id => (
          <button key={id} onClick={() => setFftAsset(id)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors font-mono ${fftAsset === id ? 'bg-indigo-900/50 text-indigo-300 border-indigo-700' : 'text-gray-500 border-gray-700 hover:border-gray-500'}`}>
            {id}
          </button>
        ))}
      </div>
      <HealthTrendPanel assetId={fftAsset} />
    </div>

    {/* REQ-17 — Oil Analysis & Lubrication Tracker */}
    <OilAnalysisPanel />

    {/* REQ-06 — Risk Matrix 5×5 */}
    <RiskMatrix5x5 />
  </div>
  );
};

// ── Digital Twin Tab ──────────────────────────────────────────────────────────
const DigitalTwinTab: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <h3 className="text-white text-lg font-semibold">Compressor C-101 · Digital Twin</h3>
      <span className="text-xs bg-red-900/40 text-red-400 px-2 py-1 rounded font-semibold">CRITICAL — BEARING DEGRADATION ACTIVE</span>
    </div>
    <div className="grid grid-cols-4 gap-3">
      {[
        ['VIBRATION RMS','8.4 mm/s','ALARM +7.1','text-red-400','border-red-900/50'],
        ['BEARING TEMP','94 °C','WARN +85°C','text-amber-400','border-amber-900/50'],
        ['LUBE OIL PRESSURE','2.1 bar','LOW <2.5','text-amber-400','border-amber-900/50'],
        ['DISCHARGE PRESS','18.4 bar','Normal','text-green-400','border-green-900/50'],
        ['MOTOR CURRENT','142 A','FLC: 105A','text-amber-400','border-amber-900/50'],
        ['SPEED','3,580 RPM','Set: 3,000','text-white','border-gray-800'],
        ['HEALTH INDEX','38 / 100','Degraded','text-red-400','border-red-900/50'],
        ['PREDICTED RUL','48 hours','URGENT ACTION','text-red-400','border-red-900/50'],
      ].map(([l,v,s,t,b]) => (
        <div key={l} className={`bg-gray-900 border ${b} rounded-xl p-4`}>
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">{l}</p>
          <p className={`text-2xl font-bold ${t}`}>{v}</p>
          <p className="text-gray-600 text-xs mt-1">{s}</p>
        </div>
      ))}
    </div>
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-semibold">Real-Time Vibration Trend — 72 Hour History</h4>
        <span className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded">EXCEEDING ALARM THRESHOLD</span>
      </div>
      {/* Simple SVG sparkline */}
      <svg viewBox="0 0 800 120" className="w-full" style={{ height: 120 }}>
        <defs>
          <linearGradient id="vib" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Alarm threshold line */}
        <line x1="0" y1="40" x2="800" y2="40" stroke="#ef4444" strokeWidth="1" strokeDasharray="6,4" />
        <text x="4" y="36" fill="#ef4444" fontSize="10">Alarm 7.1 mm/s</text>
        {/* Vibration waveform */}
        <polyline
          fill="url(#vib)" stroke="#a855f7" strokeWidth="2"
          points="0,80 50,75 100,78 150,72 200,68 250,65 300,58 350,55 400,50 450,45 500,40 550,35 600,30 650,25 700,20 750,18 800,15"
        />
      </svg>
    </div>
  </div>
);

// ── AI Advisor Tab ────────────────────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_URL ?? '';

interface AdvisorMessage {
  role: 'user' | 'ai';
  text: string;
}

const INITIAL_ADVISOR_MESSAGES: AdvisorMessage[] = [
  { role: 'user', text: 'What is the recommended action for Compressor C-101 at Ruwais?' },
  { role: 'ai', text: 'Based on LSTM vibration analysis and bearing temperature trends, C-101 shows a 97.3% probability of inner-race bearing failure within 48 hours.\n\n**Recommended immediate actions:**\n1. Dispatch maintenance crew — Level 3 rotating equipment specialists\n2. Source MAN Turbomachinery bearing assembly Part #7B-2241-ZZ (2 units)\n3. Schedule 6-hour planned shutdown window within next 12 hours\n4. Prepare alignment tools and lube oil flush kit\n\n**Cost of action:** ~$18,400 labour + parts\n**Cost of failure:** ~$2.1M unplanned shutdown + secondary damage' },
  { role: 'user', text: 'What spare parts should we pre-order for the next 30 days?' },
  { role: 'ai', text: 'Based on predictive failure probabilities across all 40 refineries, here are the **top 5 parts to pre-order in the next 30 days:**\n\n| Part | Equipment | Prob. | Lead Time |\n|------|-----------|-------|-----------|\n| Bearing 7B-2241-ZZ | C-101, C-204 | 97% | 3 days |\n| Mechanical Seal Kit MS-400 | P-205, P-301 | 78% | 5 days |\n| Impeller Set IP-100-8 | P-205 | 64% | 14 days |\n| Lube Oil Filter LF-7A | K-302 | 42% | 2 days |\n| Coupling Half CH-SGT8 | K-302 | 38% | 21 days |\n\nEstimated total procurement: $284,000 · Potential downtime avoided: $6.8M' },
];

const QUICK_PROMPTS = [
  'Analyse C-101 bearing failure risk',
  'Top 5 at-risk equipment this week',
  'Generate work order for P-205',
  'What is RUL for T-405?',
];

const AiAdvisorTab: React.FC = () => {
  const [messages, setMessages] = useState<AdvisorMessage[]>(INITIAL_ADVISOR_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    const userText = text.trim();
    if (!userText || isLoading) return;

    setInput('');
    setError(null);

    const history = [...messages, { role: 'user' as const, text: userText }];
    setMessages([...history, { role: 'ai', text: '' }]);
    setIsLoading(true);

    try {
      const apiMessages = history.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        throw new Error(`Server error ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const currentText = accumulated;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'ai', text: currentText };
          return updated;
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to reach AI service: ${msg}. Check that REACT_APP_API_URL is set to your backend URL.`);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'ai', text: '⚠️ Unable to reach the AI service. Please try again.' };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Model Stack Banner */}
      <div className="bg-gray-900 border border-purple-900/50 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🧠</div>
          <div>
            <p className="text-white font-semibold text-sm">RefinerAI Advisor — Claude-Powered Maintenance Intelligence</p>
            <p className="text-gray-500 text-xs">Powered by Claude Opus 4.6 · Adaptive Thinking · Refinery domain expertise</p>
          </div>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border ${isLoading ? 'bg-amber-900/40 text-amber-400 border-amber-900' : 'bg-green-900/40 text-green-400 border-green-900'}`}>
          {isLoading ? '● Thinking…' : '● Online'}
        </span>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-900/50 rounded-xl px-4 py-3 text-red-400 text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Chat panel */}
        <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-xl flex flex-col" style={{ height: 520 }}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
            <h3 className="text-white font-semibold text-sm">AI Chat — Ask anything about your equipment</h3>
            <span className="text-xs text-gray-500 font-mono">Claude Opus 4.6 · Adaptive thinking</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div style={{ maxWidth: '85%' }}>
                  {m.role === 'ai' && (
                    <div className="flex items-center gap-2 mb-1">
                      <div style={{ width: 20, height: 20, borderRadius: 6, background: 'linear-gradient(135deg,#7c3aed,#2563eb)', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🧠</div>
                      <span className="text-purple-400 text-xs font-semibold">RefinerAI Advisor</span>
                    </div>
                  )}
                  <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${m.role === 'user' ? 'bg-purple-900/50 text-white' : 'bg-gray-800 text-gray-200'}`}>
                    {m.text || (
                      <span className="inline-flex gap-1 items-center text-gray-500">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder="Ask about equipment health, failure risk, spare parts, work orders..."
                disabled={isLoading}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-700 disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
                className="bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                {isLoading ? '…' : 'Send'}
              </button>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {QUICK_PROMPTS.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={isLoading}
                  className="text-xs text-purple-400 border border-purple-900/50 px-2 py-1 rounded-full hover:bg-purple-900/20 transition-colors disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Context sidebar */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-3">Active Context</p>
            <div className="space-y-2">
              {[['C-101 Ruwais','CRITICAL · 48h RUL','text-red-400'],['P-205 Houston','WARNING · 8d RUL','text-amber-400'],['T-405 Ras Tanura','WARNING · 14d RUL','text-amber-400']].map(([e,s,c]) => (
                <div key={e} className="flex items-center justify-between">
                  <span className="text-white text-xs font-mono">{e}</span>
                  <span className={`text-xs ${c}`}>{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-3">Knowledge Sources</p>
            <div className="space-y-2">
              {[['OEM Manuals','847 documents'],['Failure History','143,000 cases'],['Sensor Readings','Real-time · 6,842 assets'],['CMMS Records','Oracle · 12 years'],['Engineering Specs','2,400 P&IDs']].map(([n,c]) => (
                <div key={n} className="flex items-center justify-between">
                  <span className="text-gray-300 text-xs">{n}</span>
                  <span className="text-gray-600 text-xs">{c}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-3">AI Model</p>
            <div className="space-y-2">
              {[['Claude Opus 4.6','Primary reasoning model'],['Adaptive Thinking','Dynamic reasoning depth'],['Streaming','Real-time response delivery'],['Context window','200K tokens']].map(([m,d]) => (
                <div key={m}>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-400 text-xs font-semibold font-mono">{m}</span>
                    <span className="text-xs bg-green-900/30 text-green-500 px-1.5 rounded">active</span>
                  </div>
                  <p className="text-gray-600 text-xs">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── ML Models Tab ──────────────────────────────────────────────────────────────
const ML_MODELS = [
  { name: 'LSTM Vibration Anomaly', type: 'Deep Learning', accuracy: 97.3, precision: 96.1, recall: 98.4, f1: 97.2, trained: '2026-03-15', assets: 6842, status: 'production' },
  { name: 'XGBoost Failure Classifier', type: 'Gradient Boosting', accuracy: 94.7, precision: 93.2, recall: 96.1, f1: 94.6, trained: '2026-03-10', assets: 6842, status: 'production' },
  { name: 'Prophet RUL Forecaster', type: 'Time-Series', accuracy: 91.2, precision: 90.5, recall: 92.1, f1: 91.3, trained: '2026-02-28', assets: 4210, status: 'production' },
  { name: 'Random Forest Bearing Health', type: 'Ensemble', accuracy: 93.8, precision: 92.4, recall: 95.0, f1: 93.7, trained: '2026-03-01', assets: 2841, status: 'production' },
  { name: 'CNN Thermography Analyser', type: 'Computer Vision', accuracy: 89.4, precision: 88.7, recall: 90.2, f1: 89.4, trained: '2026-01-20', assets: 1204, status: 'retraining' },
  { name: 'Isolation Forest Outlier', type: 'Anomaly Detection', accuracy: 86.1, precision: 85.3, recall: 86.9, f1: 86.1, trained: '2026-02-15', assets: 6842, status: 'production' },
];

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  production: { bg: '#052e16', text: '#22c55e' },
  retraining: { bg: '#1c1917', text: '#f59e0b' },
};

const MLModelsTab: React.FC = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-3">
      {[['6','ACTIVE MODELS','text-purple-400','border-purple-900/50'],['94.7%','AVG ACCURACY','text-green-400','border-green-900/50'],['6,842','ASSETS MONITORED','text-blue-400','border-blue-900/50'],['143K','TRAINING RECORDS','text-white','border-gray-800']].map(([v,l,t,b]) => (
        <div key={l} className={`bg-gray-900 border ${b} rounded-xl p-4`}>
          <p className={`text-2xl font-bold ${t}`}>{v}</p>
          <p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">{l}</p>
        </div>
      ))}
    </div>

    {/* Model performance bars */}
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4">Model Accuracy Comparison</h3>
      <div className="space-y-3">
        {ML_MODELS.map(m => (
          <div key={m.name} className="flex items-center gap-3">
            <span className="text-gray-400 text-xs w-52 flex-shrink-0">{m.name}</span>
            <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
              <div className="h-2 rounded-full bg-gradient-to-r from-purple-700 to-purple-400" style={{ width: `${m.accuracy}%` }} />
            </div>
            <span className="text-white text-xs font-semibold w-12 text-right">{m.accuracy}%</span>
          </div>
        ))}
      </div>
    </div>

    {/* REQ-19 — AI Feedback Loop */}
    <AIFeedbackPanel />

    {/* Model cards */}
    <div className="grid grid-cols-3 gap-4">
      {ML_MODELS.map(m => (
        <div key={m.name} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-white text-sm font-semibold leading-tight">{m.name}</p>
              <p className="text-gray-500 text-xs mt-0.5">{m.type}</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: STATUS_BADGE[m.status].bg, color: STATUS_BADGE[m.status].text }}>{m.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[['Accuracy', m.accuracy],['Precision', m.precision],['Recall', m.recall],['F1 Score', m.f1]].map(([k,v]) => (
              <div key={k} className="bg-gray-800 rounded-lg p-2">
                <p className="text-gray-500 text-xs">{k}</p>
                <p className="text-white text-sm font-bold">{v}%</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600 border-t border-gray-800 pt-2">
            <span>Last retrained: {m.trained}</span>
            <span>{m.assets.toLocaleString()} assets</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── Spare Parts Tab ───────────────────────────────────────────────────────────
const SPARE_PARTS = [
  { part: 'Bearing Assembly 7B-2241-ZZ', equipment: 'C-101, C-204', stock: 0, min: 4, ordered: 4, cost: 8400, status: 'critical', urgency: '48h', supplier: 'MAN Turbomachinery' },
  { part: 'Mechanical Seal Kit MS-400', equipment: 'P-205, P-301', stock: 2, min: 4, ordered: 6, cost: 3200, status: 'low', urgency: '8d', supplier: 'KSB Group' },
  { part: 'Impeller Set IP-100-8', equipment: 'P-205', stock: 0, min: 2, ordered: 2, cost: 12800, status: 'critical', urgency: '8d', supplier: 'KSB Group' },
  { part: 'Lube Oil Filter LF-7A', equipment: 'K-302, C-101', stock: 12, min: 8, ordered: 0, cost: 420, status: 'ok', urgency: '—', supplier: 'Pall Corporation' },
  { part: 'Coupling Half CH-SGT8', equipment: 'K-302', stock: 1, min: 2, ordered: 2, cost: 22000, status: 'low', urgency: '45d', supplier: 'Siemens Energy' },
  { part: 'O-Ring Kit OR-HTAPI', equipment: 'Multiple', stock: 45, min: 20, ordered: 0, cost: 180, status: 'ok', urgency: '—', supplier: 'Parker Hannifin' },
];

const PART_STATUS: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: '#450a0a', text: '#f87171', label: 'CRITICAL LOW' },
  low:      { bg: '#431407', text: '#fb923c', label: 'LOW STOCK' },
  ok:       { bg: '#052e16', text: '#4ade80', label: 'IN STOCK' },
};

const SparePartsTab: React.FC = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-3">
      {[['2','CRITICAL LOW STOCK','text-red-400','border-red-900/50'],['2','LOW STOCK ITEMS','text-amber-400','border-amber-900/50'],['$284K','OPEN ORDER VALUE','text-blue-400','border-blue-900/50'],['$6.8M','DOWNTIME AVOIDED','text-green-400','border-green-900/50']].map(([v,l,t,b]) => (
        <div key={l} className={`bg-gray-900 border ${b} rounded-xl p-4`}>
          <p className={`text-2xl font-bold ${t}`}>{v}</p>
          <p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">{l}</p>
        </div>
      ))}
    </div>

    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <h3 className="text-white font-semibold">AI-Prioritised Parts Inventory</h3>
        <span className="text-xs bg-purple-900/30 text-purple-400 px-2 py-1 rounded">XGBoost Procurement Model · 30-Day Horizon</span>
      </div>
      <div className="grid grid-cols-3 gap-0">
        {SPARE_PARTS.map(p => (
          <div key={p.part} className="border-b border-r border-gray-800 p-4 hover:bg-gray-800/30 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <p className="text-white text-sm font-semibold leading-tight flex-1 pr-2">{p.part}</p>
              <span className="text-xs px-2 py-0.5 rounded font-bold flex-shrink-0" style={{ background: PART_STATUS[p.status].bg, color: PART_STATUS[p.status].text }}>{PART_STATUS[p.status].label}</span>
            </div>
            <p className="text-gray-500 text-xs mb-3">{p.equipment} · {p.supplier}</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center">
                <p className="text-xs text-gray-600">On Hand</p>
                <p className={`text-lg font-bold ${p.stock === 0 ? 'text-red-400' : p.stock < p.min ? 'text-amber-400' : 'text-white'}`}>{p.stock}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600">Min Stock</p>
                <p className="text-lg font-bold text-gray-400">{p.min}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600">On Order</p>
                <p className={`text-lg font-bold ${p.ordered > 0 ? 'text-blue-400' : 'text-gray-600'}`}>{p.ordered}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Unit cost: ${p.cost.toLocaleString()}</span>
              <span className={`font-semibold ${p.urgency === '—' ? 'text-gray-600' : 'text-amber-400'}`}>Needed: {p.urgency}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* REQ-14 — Spare Parts Criticality Matrix */}
    <SpareCriticalityMatrix />
  </div>
);

// ── AI Work Orders Tab ────────────────────────────────────────────────────────
interface WO {
  id: string;
  equipment: string;
  site: string;
  priority: 'EMERGENCY' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'Open' | 'In Progress' | 'Scheduled' | 'Completed';
  cost: string;
  due: string;
  aiGenerated?: boolean;
  isPR?: boolean;
}

const INITIAL_WOS: WO[] = [
  // Emergency
  { id: 'WO-2026-0847', equipment: 'C-101 Compressor',           site: 'Ruwais, UAE',          priority: 'EMERGENCY', status: 'Open',        cost: '$28,400', due: 'Now',  aiGenerated: true },
  { id: 'WO-2026-0846', equipment: 'G-302 Gas Turbine',          site: 'Ras Tanura, KSA',      priority: 'EMERGENCY', status: 'Open',        cost: '$54,200', due: 'Now',  aiGenerated: true },
  { id: 'WO-2026-0845', equipment: 'P-101A Feed Pump',           site: 'Whiting, USA',         priority: 'EMERGENCY', status: 'In Progress', cost: '$18,600', due: '2h',   aiGenerated: true },
  { id: 'WO-2026-0844', equipment: 'E-501 Heat Exchanger',       site: 'Rotterdam, NL',        priority: 'EMERGENCY', status: 'In Progress', cost: '$31,800', due: '4h',   aiGenerated: true },
  { id: 'WO-2026-0843', equipment: 'K-201 Reformer Heater',      site: 'Gelsenkirchen, DE',    priority: 'EMERGENCY', status: 'Open',        cost: '$72,000', due: 'Now',  aiGenerated: true },
  { id: 'WO-2026-0842', equipment: 'V-305 Separator Vessel',     site: 'Cherry Point, USA',    priority: 'EMERGENCY', status: 'Open',        cost: '$22,500', due: 'Now',  aiGenerated: true },
  { id: 'WO-2026-0840', equipment: 'C-203 Cooling Tower Fan',    site: 'Castellon, ES',        priority: 'EMERGENCY', status: 'In Progress', cost: '$15,900', due: '6h',   aiGenerated: true },
  // High
  { id: 'WO-2026-0841', equipment: 'E-212 Heat Exchanger',       site: 'Houston, USA',         priority: 'HIGH',      status: 'In Progress', cost: '$14,200', due: '3d' },
  { id: 'WO-2026-0839', equipment: 'P-401 Crude Pump',           site: 'Ras Tanura, KSA',      priority: 'HIGH',      status: 'In Progress', cost: '$9,800',  due: '2d' },
  { id: 'WO-2026-0838', equipment: 'C-105 Compressor',           site: 'Ruwais, UAE',          priority: 'HIGH',      status: 'Scheduled',   cost: '$16,400', due: '4d' },
  { id: 'WO-2026-0837', equipment: 'T-202 Turbine',              site: 'Gelsenkirchen, DE',    priority: 'HIGH',      status: 'Scheduled',   cost: '$38,500', due: '5d' },
  { id: 'WO-2026-0836', equipment: 'F-101 Fired Heater',         site: 'Rotterdam, NL',        priority: 'HIGH',      status: 'Scheduled',   cost: '$28,900', due: '7d' },
  { id: 'WO-2026-0834', equipment: 'R-201 Reactor',              site: 'Whiting, USA',         priority: 'HIGH',      status: 'Scheduled',   cost: '$45,600', due: '6d' },
  { id: 'WO-2026-0833', equipment: 'C-301 Centrifuge',           site: 'Cherry Point, USA',    priority: 'HIGH',      status: 'Scheduled',   cost: '$12,300', due: '9d' },
  { id: 'WO-2026-0832', equipment: 'E-407 Condenser',            site: 'Castellon, ES',        priority: 'HIGH',      status: 'In Progress', cost: '$8,700',  due: '1d' },
  { id: 'WO-2026-0831', equipment: 'P-502 Transfer Pump',        site: 'Houston, USA',         priority: 'HIGH',      status: 'Scheduled',   cost: '$6,200',  due: '10d' },
  { id: 'WO-2026-0830', equipment: 'G-104 Generator',            site: 'Ruwais, UAE',          priority: 'HIGH',      status: 'Scheduled',   cost: '$22,100', due: '8d' },
  // Medium
  { id: 'WO-2026-0829', equipment: 'T-405 Turbine',              site: 'Ras Tanura, KSA',      priority: 'MEDIUM',    status: 'Scheduled',   cost: '$41,000', due: '14d' },
  { id: 'WO-2026-0828', equipment: 'P-205 Pump',                 site: 'Houston, USA',         priority: 'MEDIUM',    status: 'Scheduled',   cost: '$6,800',  due: '8d' },
  { id: 'WO-2026-0827', equipment: 'V-101 Surge Drum',           site: 'Rotterdam, NL',        priority: 'MEDIUM',    status: 'Scheduled',   cost: '$9,400',  due: '12d' },
  { id: 'WO-2026-0826', equipment: 'E-314 Reboiler',             site: 'Gelsenkirchen, DE',    priority: 'MEDIUM',    status: 'Scheduled',   cost: '$18,700', due: '15d' },
  { id: 'WO-2026-0825', equipment: 'C-402 Screw Compressor',     site: 'Whiting, USA',         priority: 'MEDIUM',    status: 'Scheduled',   cost: '$14,500', due: '11d' },
  { id: 'WO-2026-0824', equipment: 'P-303 Booster Pump',         site: 'Cherry Point, USA',    priority: 'MEDIUM',    status: 'In Progress', cost: '$5,600',  due: '5d' },
  { id: 'WO-2026-0823', equipment: 'F-202 Flare Stack',          site: 'Castellon, ES',        priority: 'MEDIUM',    status: 'Scheduled',   cost: '$32,000', due: '20d' },
  { id: 'WO-2026-0822', equipment: 'R-102 Hydrotreater',         site: 'Ras Tanura, KSA',      priority: 'MEDIUM',    status: 'Scheduled',   cost: '$55,000', due: '18d' },
  { id: 'WO-2026-0821', equipment: 'T-103 Storage Tank',         site: 'Ruwais, UAE',          priority: 'MEDIUM',    status: 'In Progress', cost: '$7,800',  due: '7d' },
  { id: 'WO-2026-0820', equipment: 'K-301 Air Cooler',           site: 'Houston, USA',         priority: 'MEDIUM',    status: 'Scheduled',   cost: '$11,200', due: '22d' },
  { id: 'WO-2026-0819', equipment: 'C-501 Turbocharger',         site: 'Rotterdam, NL',        priority: 'MEDIUM',    status: 'Scheduled',   cost: '$24,800', due: '16d' },
  { id: 'WO-2026-0818', equipment: 'E-601 Pre-heater',           site: 'Gelsenkirchen, DE',    priority: 'MEDIUM',    status: 'Scheduled',   cost: '$16,300', due: '19d' },
  // Completed
  { id: 'WO-2026-0817', equipment: 'P-601 Lube Oil Pump',        site: 'Whiting, USA',         priority: 'LOW',       status: 'Completed',   cost: '$4,200',  due: '—' },
  { id: 'WO-2026-0816', equipment: 'V-202 Drum Separator',       site: 'Cherry Point, USA',    priority: 'LOW',       status: 'Completed',   cost: '$8,900',  due: '—' },
  { id: 'WO-2026-0815', equipment: 'E-201 Shell & Tube HX',      site: 'Castellon, ES',        priority: 'LOW',       status: 'Completed',   cost: '$12,600', due: '—' },
  { id: 'WO-2026-0814', equipment: 'G-401 Gas Compressor',       site: 'Ras Tanura, KSA',      priority: 'HIGH',      status: 'Completed',   cost: '$31,400', due: '—' },
  { id: 'WO-2026-0813', equipment: 'T-301 Distillation Column',  site: 'Rotterdam, NL',        priority: 'HIGH',      status: 'Completed',   cost: '$48,700', due: '—' },
  { id: 'WO-2026-0812', equipment: 'P-401B Feed Pump',           site: 'Ruwais, UAE',          priority: 'MEDIUM',    status: 'Completed',   cost: '$7,100',  due: '—' },
  { id: 'WO-2026-0811', equipment: 'C-102 Centrifugal Comp.',    site: 'Houston, USA',         priority: 'EMERGENCY', status: 'Completed',   cost: '$34,200', due: '—' },
  { id: 'WO-2026-0810', equipment: 'F-301 Reformer Furnace',     site: 'Gelsenkirchen, DE',    priority: 'HIGH',      status: 'Completed',   cost: '$62,800', due: '—' },
  { id: 'WO-2026-0809', equipment: 'R-301 Hydrocracker',         site: 'Whiting, USA',         priority: 'MEDIUM',    status: 'Completed',   cost: '$91,500', due: '—' },
  { id: 'WO-2026-0808', equipment: 'K-101 Air Separation Unit',  site: 'Cherry Point, USA',    priority: 'LOW',       status: 'Completed',   cost: '$18,300', due: '—' },
  { id: 'WO-2026-0807', equipment: 'P-201 Condensate Pump',      site: 'Castellon, ES',        priority: 'LOW',       status: 'Completed',   cost: '$5,600',  due: '—' },
];

const PRI_COLOR: Record<string, string> = { EMERGENCY: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#60a5fa', LOW: '#9ca3af' };
const ST_COLOR:  Record<string, string> = { Open: '#f87171', 'In Progress': '#fbbf24', Scheduled: '#818cf8', Completed: '#4ade80' };

const WorkOrdersTab: React.FC = () => {
  const [wos, setWos] = useState<WO[]>(INITIAL_WOS);
  const [toast, setToast] = useState<string | null>(null);
  const [prCounter, setPrCounter] = useState(1);

  const featuredWO = wos.find(w => w.priority === 'EMERGENCY' && w.status === 'Open') ?? null;

  const handleApprove = (wo: WO) => {
    const prId = `PR-2026-${String(prCounter).padStart(4, '0')}`;
    setPrCounter(c => c + 1);
    setWos(prev => [
      // Transition approved WO → In Progress
      ...prev.map(w => w.id === wo.id ? { ...w, status: 'In Progress' as const } : w),
      // Auto-generated PR → immediately Completed
      {
        id: prId,
        equipment: `${wo.equipment} [PR: Parts & Services]`,
        site: wo.site,
        priority: wo.priority,
        status: 'Completed' as const,
        cost: wo.cost,
        due: '—',
        isPR: true,
      },
    ]);
    setToast(`✓ ${wo.id} dispatched — ${prId} auto-completed`);
    setTimeout(() => setToast(null), 4000);
  };

  const counts = {
    emergency: wos.filter(w => w.priority === 'EMERGENCY' && w.status !== 'Completed').length,
    inProgress: wos.filter(w => w.status === 'In Progress').length,
    scheduled:  wos.filter(w => w.status === 'Scheduled').length,
    completed:  wos.filter(w => w.status === 'Completed').length,
  };

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="bg-green-950 border border-green-700 text-green-300 text-sm px-4 py-3 rounded-xl flex items-center gap-3">
          <span className="text-green-400 font-bold">✓</span>{toast}
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          [String(counts.emergency), 'EMERGENCY',    'text-red-400',   'border-red-900/50'],
          [String(counts.inProgress),'IN PROGRESS',  'text-amber-400', 'border-amber-900/50'],
          [String(counts.scheduled), 'SCHEDULED',    'text-blue-400',  'border-blue-900/50'],
          [String(counts.completed), 'COMPLETED 30D','text-green-400', 'border-green-900/50'],
        ].map(([v, l, t, b]) => (
          <div key={l} className={`bg-gray-900 border ${b} rounded-xl p-4`}>
            <p className={`text-2xl font-bold ${t}`}>{v}</p>
            <p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      {/* Featured emergency WO detail */}
      {featuredWO && (
        <div className="bg-gray-900 border border-red-900/60 rounded-xl overflow-hidden">
          <div className="bg-red-950/50 border-b border-red-900/50 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded">EMERGENCY</span>
              <span className="text-white font-semibold">{featuredWO.id} · Bearing Replacement — {featuredWO.equipment}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-red-400 font-mono">AI Generated · 2 hours ago</span>
              <button
                onClick={() => handleApprove(featuredWO)}
                className="text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded font-semibold transition-colors"
              >
                Approve & Dispatch
              </button>
            </div>
          </div>
          <div className="p-5 grid grid-cols-3 gap-6">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-3">OEM Instructions</p>
              <div className="space-y-2">
                {['1. Isolate drive power — LOTO procedure MAN-C101-LO01','2. Drain lube oil system — capture for analysis','3. Remove coupling guard and flexible coupling','4. Extract bearing housing — OEM puller tool #PT-7B','5. Clean seating surfaces — inspect shaft journal','6. Install new bearings — torque: 340 Nm','7. Refill lube oil — 22L Shell Tellus T46','8. Commission — vibration baseline < 2.5 mm/s'].map(s => (
                  <div key={s} className="flex gap-2">
                    <span className="text-purple-500 text-xs flex-shrink-0">▸</span>
                    <p className="text-gray-400 text-xs">{s}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-3">Required Resources</p>
              <p className="text-gray-600 text-xs mb-2">PERSONNEL</p>
              {[['Lead Rotating Equipment Engineer','1'],['Mechanical Technician (Level 3)','2'],['Safety Officer','1'],['OEM Specialist (MAN)','1']].map(([r,n]) => (
                <div key={r} className="flex justify-between text-xs py-1 border-b border-gray-800">
                  <span className="text-gray-400">{r}</span><span className="text-white font-semibold">{n}</span>
                </div>
              ))}
              <p className="text-gray-600 text-xs mt-3 mb-2">PARTS & TOOLS</p>
              {[['Bearing Assembly 7B-2241-ZZ','2 units'],['OEM Puller Kit PT-7B','1 set'],['Torque Wrench 340 Nm','1'],['Shell Tellus T46 Lube Oil','22 L']].map(([r,n]) => (
                <div key={r} className="flex justify-between text-xs py-1 border-b border-gray-800">
                  <span className="text-gray-400">{r}</span><span className="text-white font-semibold">{n}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-3">Cost & Timeline</p>
              <div className="space-y-3 mb-4">
                {[['Estimated Duration','6 hours','text-white'],['Shutdown Window','12h from now','text-amber-400'],['Labour Cost','$9,400','text-white'],['Parts Cost','$8,400 × 2','text-white'],['OEM Specialist','$1,200','text-white'],['Total WO Cost','$28,400','text-white font-bold']].map(([l,v,c]) => (
                  <div key={l} className="flex justify-between text-xs">
                    <span className="text-gray-500">{l}</span><span className={c}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="bg-green-950/40 border border-green-900/40 rounded-lg p-3">
                <p className="text-green-400 text-xs font-semibold mb-1">Cost vs Failure</p>
                {[['WO cost (planned)','$28,400','text-white'],['Failure cost (avoided)','$2,100,000','text-green-400'],['Net savings','$2,071,600','text-green-400 font-bold']].map(([l,v,c]) => (
                  <div key={l} className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">{l}</span><span className={c}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REQ-13 — Root Cause Analysis */}
      <RCAPanel />

      {/* REQ-18 — Contractor & Crew Planner */}
      <CrewPlanner />

      {/* All Work Orders table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">All Work Orders ({wos.length})</h3>
          <span className="text-gray-500 text-xs">{wos.filter(w => w.isPR).length} PR orders auto-completed</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-800">
              {['WO / PR Number','Equipment','Site','Priority','Status','Est. Cost','Due'].map(h => (
                <th key={h} className="py-3 px-4 text-left text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {wos.map(wo => (
                <tr key={wo.id} className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span className={`text-sm font-mono ${wo.isPR ? 'text-green-400' : 'text-purple-400'}`}>{wo.id}</span>
                    {wo.aiGenerated && <span className="ml-2 text-xs text-purple-500/70">AI</span>}
                    {wo.isPR && <span className="ml-2 text-xs bg-green-900/50 text-green-400 px-1.5 py-0.5 rounded">PR</span>}
                  </td>
                  <td className="py-2.5 px-4 text-white text-sm">{wo.equipment}</td>
                  <td className="py-2.5 px-4 text-gray-400 text-sm whitespace-nowrap">{wo.site}</td>
                  <td className="py-2.5 px-4">
                    <span className="text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap"
                      style={{ background: `${PRI_COLOR[wo.priority]}22`, color: PRI_COLOR[wo.priority] }}>
                      {wo.priority}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-xs font-semibold" style={{ color: ST_COLOR[wo.status] }}>{wo.status}</span>
                  </td>
                  <td className="py-2.5 px-4 text-gray-300 text-sm whitespace-nowrap">{wo.cost}</td>
                  <td className="py-2.5 px-4 text-gray-400 text-sm whitespace-nowrap">{wo.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── REQ-05: MTBF / MTTR / OEE data ──────────────────────────────────────────
const RELIABILITY_SITES = [
  { site: 'Ruwais, UAE',      mtbf: 842,  mttr: 6.2, oee: 71.4, avail: 88.1, perf: 90.2, qual: 89.8, trend: -3.2 },
  { site: 'Houston, USA',     mtbf: 1124, mttr: 4.8, oee: 81.2, avail: 91.4, perf: 93.6, qual: 94.8, trend: +2.1 },
  { site: 'Rotterdam, NL',    mtbf: 1380, mttr: 3.9, oee: 86.7, avail: 94.2, perf: 95.1, qual: 96.7, trend: +1.4 },
  { site: 'Ras Tanura, KSA',  mtbf: 960,  mttr: 5.4, oee: 78.3, avail: 90.1, perf: 91.8, qual: 93.4, trend: -0.8 },
  { site: 'Jamnagar, India',  mtbf: 1560, mttr: 3.1, oee: 89.4, avail: 95.6, perf: 96.2, qual: 97.4, trend: +3.2 },
];

// ── ROI & 40% Target Tab ──────────────────────────────────────────────────────
const ROI_BARS = [
  { label: 'LSTM Vibration Detection', value: 34, color: '#7c3aed' },
  { label: 'XGBoost Failure Classification', value: 28, color: '#6d28d9' },
  { label: 'Prophet RUL Forecasting', value: 18, color: '#4f46e5' },
  { label: 'AI Advisor Recommendations', value: 12, color: '#2563eb' },
  { label: 'Smart Parts Procurement', value: 8, color: '#0891b2' },
];

const ROITab: React.FC = () => (
  <div className="space-y-4">

    {/* REQ-05 — MTBF / MTTR / OEE */}
    <div className="bg-gray-900 border border-blue-900/40 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <div>
          <h3 className="text-white font-semibold text-sm">REQ-05 · Reliability KPIs — MTBF / MTTR / OEE</h3>
          <p className="text-gray-500 text-xs mt-0.5">Fleet-wide · ISO 55001 aligned · Rolling 12-month average</p>
        </div>
        <span className="text-xs bg-blue-900/30 text-blue-400 border border-blue-900/50 px-3 py-1 rounded-full">YTD 2026</span>
      </div>

      {/* Fleet KPIs */}
      <div className="grid grid-cols-3 divide-x divide-gray-800 border-b border-gray-800">
        {[
          ['MTBF', '1,173 h', 'Mean Time Between Failures', '↑ +148h vs last year', 'text-blue-400'],
          ['MTTR', '4.68 h', 'Mean Time To Repair', '↓ −1.2h vs last year', 'text-green-400'],
          ['OEE',  '81.4 %', 'Overall Equipment Effectiveness', '↑ +3.8% vs last year', 'text-purple-400'],
        ].map(([k, v, desc, trend, c]) => (
          <div key={k} className="px-6 py-4">
            <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-1">{k}</p>
            <p className={`text-4xl font-bold ${c} mb-1`}>{v}</p>
            <p className="text-gray-500 text-xs">{desc}</p>
            <p className={`text-xs mt-1 ${c}`}>{trend}</p>
          </div>
        ))}
      </div>

      {/* OEE Breakdown */}
      <div className="grid grid-cols-3 divide-x divide-gray-800 border-b border-gray-800 bg-gray-950/40">
        {[
          ['Availability', '91.2%', 'Planned vs actual uptime', 92.4],
          ['Performance',  '93.8%', 'Actual vs theoretical rate', 88.0],
          ['Quality',      '95.1%', 'Good output vs total output', 94.8],
        ].map(([k, v, desc, target]) => (
          <div key={String(k)} className="px-6 py-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-gray-400 text-xs font-semibold">{k}</p>
              <p className="text-white text-sm font-bold">{v}</p>
            </div>
            <div className="bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div className="h-1.5 rounded-full bg-blue-500" style={{ width: v as string }} />
            </div>
            <p className="text-gray-600 text-xs mt-1">{desc} · target {target}%</p>
          </div>
        ))}
      </div>

      {/* Per-site table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              {['Site','MTBF (h)','MTTR (h)','Availability','Performance','Quality','OEE','Trend'].map(h => (
                <th key={h} className="py-2.5 px-4 text-left text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RELIABILITY_SITES.map(r => (
              <tr key={r.site} className="border-b border-gray-800 hover:bg-gray-800/30">
                <td className="py-2.5 px-4 text-white text-sm whitespace-nowrap">{r.site}</td>
                <td className="py-2.5 px-4 text-blue-400 text-sm font-mono font-semibold">{r.mtbf.toLocaleString()}</td>
                <td className="py-2.5 px-4 text-green-400 text-sm font-mono font-semibold">{r.mttr}</td>
                <td className="py-2.5 px-4 text-gray-300 text-sm">{r.avail}%</td>
                <td className="py-2.5 px-4 text-gray-300 text-sm">{r.perf}%</td>
                <td className="py-2.5 px-4 text-gray-300 text-sm">{r.qual}%</td>
                <td className="py-2.5 px-4">
                  <span className="text-sm font-bold" style={{ color: r.oee >= 85 ? '#4ade80' : r.oee >= 75 ? '#fbbf24' : '#f87171' }}>{r.oee}%</span>
                </td>
                <td className="py-2.5 px-4">
                  <span className={`text-xs font-semibold ${r.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {r.trend > 0 ? '↑' : '↓'} {Math.abs(r.trend)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* REQ-15 — Maintenance Budget vs Actuals */}
    <BudgetActuals />

    {/* Hero — 40% Target */}
    <div className="bg-gray-900 border border-purple-900/50 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-2">BP Strategic Target — Unplanned Downtime Reduction</p>
          <p className="text-white text-5xl font-bold mb-1">38.2% <span className="text-gray-500 text-2xl font-normal">/ 40%</span></p>
          <p className="text-green-400 text-sm">↑ 4.1% improvement this quarter · On track to hit 40% by Q3 2026</p>
        </div>
        <div className="text-right">
          <div className="relative" style={{ width: 140, height: 140 }}>
            <svg viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="70" cy="70" r="60" fill="none" stroke="#1f2937" strokeWidth="12" />
              <circle cx="70" cy="70" r="60" fill="none" stroke="#7c3aed" strokeWidth="12"
                strokeDasharray={`${(38.2 / 100) * 2 * Math.PI * 60} ${2 * Math.PI * 60}`}
                strokeLinecap="round" />
              <circle cx="70" cy="70" r="60" fill="none" stroke="#374151" strokeWidth="12"
                strokeDasharray={`${((40 - 38.2) / 100) * 2 * Math.PI * 60} ${2 * Math.PI * 60}`}
                strokeDashoffset={`${-(38.2 / 100) * 2 * Math.PI * 60}`}
                strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <p className="text-white text-xl font-bold">38.2%</p>
              <p className="text-gray-500 text-xs">of 40%</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 bg-gray-800 rounded-full h-3 overflow-hidden">
        <div className="h-3 rounded-full bg-gradient-to-r from-purple-700 via-purple-500 to-green-500" style={{ width: '95.5%' }} />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1.5">
        <span>0%</span>
        <span className="text-purple-400 font-semibold">38.2% — Current</span>
        <span className="text-green-400 font-semibold">40% — Target</span>
      </div>
    </div>

    {/* KPI cards */}
    <div className="grid grid-cols-4 gap-4">
      {[
        ['$42.8M','Annual Savings to Date','vs $31.2M last year','text-green-400','border-green-900/50'],
        ['1,847h','Unplanned Downtime Avoided','↓ 38.2% reduction YTD','text-blue-400','border-blue-900/50'],
        ['23%','Equipment Life Extended','AI predictive vs reactive','text-purple-400','border-purple-900/50'],
        ['0','Safety Incidents (AI-linked)','↓ from 3 last year','text-amber-400','border-amber-900/50'],
      ].map(([v,l,s,t,b]) => (
        <div key={l} className={`bg-gray-900 border ${b} rounded-xl p-5`}>
          <p className={`text-3xl font-bold ${t} mb-1`}>{v}</p>
          <p className="text-white text-sm font-semibold">{l}</p>
          <p className="text-gray-500 text-xs mt-1">{s}</p>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-2 gap-4">
      {/* AI Contribution breakdown */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">AI Contribution to 40% Target</h3>
        <div className="space-y-4">
          {ROI_BARS.map(b => (
            <div key={b.label}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-400">{b.label}</span>
                <span className="text-white font-semibold">{b.value}%</span>
              </div>
              <div className="bg-gray-800 rounded-full h-2.5 overflow-hidden">
                <div className="h-2.5 rounded-full transition-all" style={{ width: `${b.value * 2.5}%`, background: b.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quarterly savings trend */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Quarterly Savings Trend ($M)</h3>
        <div className="flex items-end gap-3 h-40 px-2">
          {[['Q1 2025',6.2],['Q2 2025',7.8],['Q3 2025',9.4],['Q4 2025',10.1],['Q1 2026',9.3]].map(([q,v]) => {
            const vNum = v as number;
            const h = (vNum / 12) * 100;
            return (
              <div key={q} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-white text-xs font-semibold">${vNum}M</span>
                <div className="w-full rounded-t-md" style={{ height: `${h}%`, background: 'linear-gradient(to top, #4c1d95, #7c3aed)' }} />
                <span className="text-gray-600 text-xs">{q}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between text-xs">
          <span className="text-gray-500">Total 5-quarter savings</span>
          <span className="text-green-400 font-semibold">$42.8M</span>
        </div>
      </div>
    </div>
  </div>
);

// ── REQ-16: Alert Escalation Matrix ──────────────────────────────────────────
const ESCALATION_MATRIX = [
  { sev: 'CRITICAL', sla: '<15 min', l1: 'Shift Supervisor',   l2: 'Plant Manager',    l3: 'VP Operations',    channel: 'Call + SMS + SCADA alarm' },
  { sev: 'HIGH',     sla: '<1 hour', l1: 'Maintenance Lead',   l2: 'Shift Supervisor', l3: 'Plant Manager',    channel: 'SMS + Email + CMMS WO'    },
  { sev: 'MEDIUM',   sla: '<4 hours',l1: 'Maintenance Tech',   l2: 'Maintenance Lead', l3: 'Shift Supervisor', channel: 'Email + CMMS WO'           },
  { sev: 'ADVISORY', sla: '<24 hours',l1: 'Reliability Eng.',  l2: 'Maintenance Lead', l3: '—',                channel: 'CMMS notification'         },
];
const ESC_COL: Record<string,{bg:string;color:string}> = {
  CRITICAL: {bg:'#450a0a',color:'#f87171'},
  HIGH:     {bg:'#431407',color:'#fb923c'},
  MEDIUM:   {bg:'#2a1e00',color:'#fbbf24'},
  ADVISORY: {bg:'#0c1a2e',color:'#60a5fa'},
};

const EscalationMatrix: React.FC = () => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
    <div className="px-5 py-3 border-b border-gray-800">
      <h3 className="text-white font-semibold text-sm">REQ-16 · Alert Escalation Matrix</h3>
      <p className="text-gray-500 text-xs mt-0.5">Severity → response chain · SLA · ISO 55000 aligned</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead><tr className="border-b border-gray-800">
          {['Severity','Response SLA','Level 1 — Immediate','Level 2 — Escalate','Level 3 — Critical','Notification Channel'].map(h => (
            <th key={h} className="py-2.5 px-4 text-left text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {ESCALATION_MATRIX.map(r => (
            <tr key={r.sev} className="border-b border-gray-800 hover:bg-gray-800/30">
              <td className="py-3 px-4">
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: ESC_COL[r.sev].bg, color: ESC_COL[r.sev].color }}>{r.sev}</span>
              </td>
              <td className="py-3 px-4 text-amber-400 text-xs font-mono font-semibold">{r.sla}</td>
              <td className="py-3 px-4 text-white text-xs">{r.l1}</td>
              <td className="py-3 px-4 text-gray-300 text-xs">{r.l2}</td>
              <td className="py-3 px-4 text-gray-400 text-xs">{r.l3}</td>
              <td className="py-3 px-4 text-gray-500 text-xs">{r.channel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ── REQ-12: Anomaly Detection Heatmap ────────────────────────────────────────
const ANOMALY_ASSETS = ['C-101','E-212','P-205','T-405','K-302','V-305','G-302','F-101'];
const ANOMALY_DAYS   = ['Day −6','Day −5','Day −4','Day −3','Day −2','Yesterday','Today'];
const ANOMALY_SCORES: Record<string, number[]> = {
  'C-101': [0.30, 0.40, 0.52, 0.70, 0.80, 0.92, 0.97],
  'E-212': [0.20, 0.30, 0.50, 0.60, 0.70, 0.80, 0.91],
  'P-205': [0.10, 0.20, 0.30, 0.42, 0.52, 0.62, 0.78],
  'T-405': [0.10, 0.20, 0.22, 0.30, 0.42, 0.52, 0.71],
  'K-302': [0.02, 0.05, 0.08, 0.10, 0.12, 0.14, 0.15],
  'V-305': [0.20, 0.22, 0.28, 0.32, 0.38, 0.40, 0.42],
  'G-302': [0.10, 0.12, 0.18, 0.28, 0.38, 0.50, 0.62],
  'F-101': [0.02, 0.08, 0.12, 0.18, 0.22, 0.28, 0.38],
};

const anomalyBg   = (v: number) => v >= 0.9 ? '#7f1d1d' : v >= 0.7 ? '#7c2d12' : v >= 0.5 ? '#713f12' : v >= 0.3 ? '#1a2e05' : '#0f172a';
const anomalyText = (v: number) => v >= 0.9 ? '#f87171' : v >= 0.7 ? '#fb923c' : v >= 0.5 ? '#fbbf24' : v >= 0.3 ? '#86efac' : '#374151';

const AnomalyHeatmap: React.FC = () => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
      <div>
        <h3 className="text-white font-semibold text-sm">REQ-12 · Anomaly Detection Heatmap</h3>
        <p className="text-gray-500 text-xs mt-0.5">Equipment × Time · LSTM anomaly score · 7-day rolling window</p>
      </div>
      <div className="flex items-center gap-3 text-xs">
        {[['≥0.9','#f87171','Critical'],['≥0.7','#fb923c','High'],['≥0.5','#fbbf24','Med'],['<0.3','#86efac','Low']].map(([t,c,l]) => (
          <span key={l} className="flex items-center gap-1.5 text-gray-400">
            <span className="w-3 h-3 rounded inline-block" style={{ background: c }}/>{l} ({t})
          </span>
        ))}
      </div>
    </div>
    <div className="p-4 overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="py-1.5 px-3 text-left text-gray-500 font-normal w-20">Asset</th>
            {ANOMALY_DAYS.map(d => <th key={d} className="py-1.5 px-1 text-gray-500 font-normal text-center whitespace-nowrap">{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {ANOMALY_ASSETS.map(asset => (
            <tr key={asset}>
              <td className="py-1 px-3 font-mono font-bold text-purple-400">{asset}</td>
              {ANOMALY_SCORES[asset].map((score, j) => (
                <td key={j} className="py-1 px-1">
                  <div className="rounded text-center py-1.5 font-bold" style={{ background: anomalyBg(score), color: anomalyText(score), minWidth: 52, fontSize: 11 }}>
                    {score.toFixed(2)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ── REQ-10: Multi-Site Benchmarking ──────────────────────────────────────────
const MultiSiteBenchmark: React.FC = () => {
  const sorted = [...RELIABILITY_SITES].sort((a, b) => b.oee - a.oee);
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <div>
          <h3 className="text-white font-semibold text-sm">REQ-10 · Multi-Site Benchmarking</h3>
          <p className="text-gray-500 text-xs mt-0.5">OEE · MTBF · MTTR ranked by performance · ISO 55001</p>
        </div>
        <span className="text-xs bg-blue-900/30 text-blue-400 border border-blue-900/50 px-3 py-1 rounded-full">5 refineries</span>
      </div>
      <div className="p-5 space-y-4">
        {sorted.map((s, i) => (
          <div key={s.site} className="flex items-center gap-4">
            <span className="text-gray-600 text-xs w-5 text-right font-bold">#{i+1}</span>
            <span className="text-gray-300 text-xs w-36 truncate">{s.site}</span>
            <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
              <div className="h-2 rounded-full transition-all" style={{ width: `${s.oee}%`, background: s.oee >= 85 ? '#4ade80' : s.oee >= 75 ? '#fbbf24' : '#ef4444' }}/>
            </div>
            <span className="text-xs font-bold w-16 text-right" style={{ color: s.oee >= 85 ? '#4ade80' : s.oee >= 75 ? '#fbbf24' : '#ef4444' }}>OEE {s.oee}%</span>
            <span className="text-blue-400 text-xs w-20 text-right font-mono">MTBF {s.mtbf}h</span>
            <span className="text-green-400 text-xs w-18 text-right font-mono">MTTR {s.mttr}h</span>
            <span className={`text-xs font-semibold w-14 text-right ${s.trend > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {s.trend > 0 ? '↑' : '↓'} {Math.abs(s.trend)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── REQ-19: AI Feedback Loop & Accuracy Tracker ───────────────────────────────
const PREDICTION_FEEDBACK = [
  { id:'PRED-4821', asset:'C-101', predicted:'Bearing failure',  conf:97.3, outcome:'CONFIRMED', actual:'Bearing failure confirmed on inspection', date:'2026-03-28' },
  { id:'PRED-4817', asset:'E-414', predicted:'Fouling risk',     conf:88.2, outcome:'CONFIRMED', actual:'Fouling found — efficiency −22%',         date:'2026-03-25' },
  { id:'PRED-4812', asset:'P-301', predicted:'Seal failure',     conf:74.1, outcome:'FALSE POS', actual:'No failure — vibration from cavitation',   date:'2026-03-20' },
  { id:'PRED-4809', asset:'T-405', predicted:'Blade erosion',    conf:71.6, outcome:'CONFIRMED', actual:'Blade erosion confirmed via borescope',    date:'2026-03-18' },
  { id:'PRED-4801', asset:'K-102', predicted:'Valve leak',       conf:65.4, outcome:'MISSED',    actual:'Valve failed — not predicted by model',    date:'2026-03-15' },
];
const OUTCOME_STYLE: Record<string,{bg:string;color:string}> = {
  'CONFIRMED': {bg:'#052e16',color:'#4ade80'},
  'FALSE POS': {bg:'#431407',color:'#fb923c'},
  'MISSED':    {bg:'#450a0a',color:'#f87171'},
};

const AIFeedbackPanel: React.FC = () => {
  const conf  = PREDICTION_FEEDBACK.filter(p => p.outcome === 'CONFIRMED').length;
  const fp    = PREDICTION_FEEDBACK.filter(p => p.outcome === 'FALSE POS').length;
  const miss  = PREDICTION_FEEDBACK.filter(p => p.outcome === 'MISSED').length;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <div>
          <h3 className="text-white font-semibold text-sm">REQ-19 · AI Feedback Loop & Accuracy Tracker</h3>
          <p className="text-gray-500 text-xs mt-0.5">Prediction outcomes · Model self-correction · Rolling 30-day</p>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="text-green-400 font-bold">{conf} Confirmed</span>
          <span className="text-amber-400 font-bold">{fp} False Pos</span>
          <span className="text-red-400 font-bold">{miss} Missed</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-gray-800">
            {['Prediction ID','Asset','Prediction','Confidence','Outcome','Actual Result','Date'].map(h => (
              <th key={h} className="py-2.5 px-4 text-left text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {PREDICTION_FEEDBACK.map(p => (
              <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                <td className="py-2.5 px-4 text-purple-400 text-xs font-mono">{p.id}</td>
                <td className="py-2.5 px-4 text-white text-xs font-mono font-bold">{p.asset}</td>
                <td className="py-2.5 px-4 text-gray-300 text-xs">{p.predicted}</td>
                <td className="py-2.5 px-4 text-xs font-bold" style={{ color: p.conf>=90?'#4ade80':p.conf>=70?'#fbbf24':'#f87171' }}>{p.conf}%</td>
                <td className="py-2.5 px-4">
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background:OUTCOME_STYLE[p.outcome].bg, color:OUTCOME_STYLE[p.outcome].color }}>{p.outcome}</span>
                </td>
                <td className="py-2.5 px-4 text-gray-400 text-xs">{p.actual}</td>
                <td className="py-2.5 px-4 text-gray-600 text-xs">{p.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── REQ-18: Contractor & Crew Planner ────────────────────────────────────────
const CREW = [
  { name:'Ahmed Al-Rashid', role:'Lead Rotating Equipment Eng.', certs:['API 510','ISO 13373'], avail:'Available',  wos:2, site:'Ruwais, UAE'     },
  { name:'Maria Santos',    role:'Mechanical Technician L3',     certs:['ASME','LOTO'],         avail:'Assigned',   wos:1, site:'Houston, USA'    },
  { name:'James Okafor',    role:'Safety Officer',               certs:['HSE L3','PTW'],        avail:'Available',  wos:3, site:'Rotterdam, NL'   },
  { name:'Li Wei',          role:'OEM Specialist (MAN)',         certs:['MAN Certified'],       avail:'In Transit', wos:1, site:'Ruwais, UAE'     },
  { name:'Priya Mehta',     role:'Reliability Engineer',         certs:['CMRP','ISO 55001'],    avail:'Available',  wos:0, site:'Jamnagar, India' },
  { name:'Carlos Ruiz',     role:'Mechanical Technician L2',     certs:['LOTO','Rigging'],      avail:'On Leave',   wos:0, site:'Castellon, ES'   },
];
const AVAIL_COL: Record<string,string> = { Available:'#4ade80', Assigned:'#fbbf24', 'In Transit':'#fb923c', 'On Leave':'#9ca3af' };

const CrewPlanner: React.FC = () => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
      <div>
        <h3 className="text-white font-semibold text-sm">REQ-18 · Contractor & Crew Planner</h3>
        <p className="text-gray-500 text-xs mt-0.5">Current roster · Certifications · WO assignments</p>
      </div>
      <div className="flex gap-4 text-xs">
        <span style={{ color:'#4ade80' }}>{CREW.filter(c => c.avail==='Available').length} Available</span>
        <span style={{ color:'#fbbf24' }}>{CREW.filter(c => c.avail==='Assigned'||c.avail==='In Transit').length} Deployed</span>
        <span className="text-gray-500">{CREW.filter(c => c.avail==='On Leave').length} On Leave</span>
      </div>
    </div>
    <div className="divide-y divide-gray-800">
      {CREW.map(c => (
        <div key={c.name} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-800/30 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {c.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">{c.name}</p>
            <p className="text-gray-500 text-xs">{c.role} · {c.site}</p>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {c.certs.map(cert => <span key={cert} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{cert}</span>)}
          </div>
          <span className="text-xs font-bold w-20 text-right" style={{ color: AVAIL_COL[c.avail] }}>{c.avail}</span>
          <div className="text-center w-10">
            <p className="text-white text-sm font-bold">{c.wos}</p>
            <p className="text-gray-600 text-xs">WOs</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── REQ-13: Root Cause Analysis Module ───────────────────────────────────────
const RCAPanel: React.FC = () => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
    <div className="px-5 py-3 border-b border-gray-800">
      <h3 className="text-white font-semibold text-sm">REQ-13 · Root Cause Analysis — C-101 Bearing Failure</h3>
      <p className="text-gray-500 text-xs mt-0.5">5-Why methodology · AI-assisted · WO-2026-0847</p>
    </div>
    <div className="p-5 grid grid-cols-2 gap-6">
      <div>
        <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-3">5-Why Analysis</p>
        {[
          ['Why 1?','Compressor C-101 bearing failing','Vibration 8.4 mm/s · alarm 7.1 mm/s exceeded'],
          ['Why 2?','Bearing inner race fatigue crack','BPFI spike at 87 Hz — 97.3% model confidence'],
          ['Why 3?','Lube oil film breakdown at bearing','Oil pressure 2.1 bar — target ≥ 2.5 bar'],
          ['Why 4?','Lube oil filter LF-7A blocked','Filter ΔP: 2.4 bar — maintenance threshold 1.8 bar'],
          ['Why 5?','Filter change interval exceeded 18d','Last PM: 23 Jan 2026 · interval 90d · actual 108d'],
        ].map(([why, what, evidence]) => (
          <div key={why} className="mb-3 flex gap-3">
            <span className="text-purple-500 font-bold text-xs flex-shrink-0 w-10 pt-0.5">{why}</span>
            <div className="flex-1 bg-gray-800/60 rounded-lg p-3">
              <p className="text-white text-xs font-semibold">{what}</p>
              <p className="text-gray-500 text-xs mt-0.5">{evidence}</p>
            </div>
          </div>
        ))}
      </div>
      <div>
        <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-3">Root Cause & Corrective Actions</p>
        <div className="bg-red-950/30 border border-red-900/40 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-xs font-bold mb-1">Root Cause Identified</p>
          <p className="text-gray-300 text-sm leading-relaxed">PM interval overrun caused lube oil starvation, accelerating bearing inner-race fatigue failure.</p>
        </div>
        <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-2">Corrective Actions</p>
        <div className="space-y-2">
          {[
            ['Immediate', 'Replace bearing + full lube oil flush',   '#ef4444'],
            ['Short-term','Reduce PM interval: 90d → 60d (C-series)','#f59e0b'],
            ['Long-term', 'Install online oil ΔP + viscosity sensor', '#60a5fa'],
            ['Systemic',  'CMMS alert at 80% of PM interval',         '#a78bfa'],
          ].map(([type, action, color]) => (
            <div key={type} className="flex items-start gap-3 bg-gray-800/40 rounded-lg p-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded flex-shrink-0" style={{ background:`${color}22`, color }}>{type}</span>
              <p className="text-gray-300 text-xs">{action}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ── REQ-15: Maintenance Budget vs Actuals ────────────────────────────────────
const BUDGET_DATA = [
  { site:'Ruwais, UAE',     budget:12.4, actual:14.1, variance:+1.7 },
  { site:'Houston, USA',    budget:8.2,  actual:7.6,  variance:-0.6 },
  { site:'Rotterdam, NL',   budget:6.8,  actual:6.2,  variance:-0.6 },
  { site:'Ras Tanura, KSA', budget:9.1,  actual:10.4, variance:+1.3 },
  { site:'Jamnagar, India', budget:5.4,  actual:4.8,  variance:-0.6 },
];

const BudgetActuals: React.FC = () => {
  const maxVal = 16;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <div>
          <h3 className="text-white font-semibold text-sm">REQ-15 · Maintenance Budget vs Actuals ($M)</h3>
          <p className="text-gray-500 text-xs mt-0.5">YTD 2026 · All sites · Variance analysis</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-gray-400"><span className="w-3 h-2 rounded bg-blue-500/50 inline-block"/>Budget</span>
          <span className="flex items-center gap-1.5 text-gray-400"><span className="w-3 h-2 rounded bg-purple-500/80 inline-block"/>Actual</span>
        </div>
      </div>
      <div className="p-5 space-y-5">
        {BUDGET_DATA.map(d => (
          <div key={d.site}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-300 w-32">{d.site}</span>
              <span className={`font-bold ${d.variance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {d.variance > 0 ? '+' : ''}{d.variance}M · {d.variance > 0 ? '↑ Over' : '↓ Under'}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-xs w-12 text-right">Budget</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2.5 overflow-hidden">
                  <div className="h-2.5 rounded-full bg-blue-500/50" style={{ width:`${(d.budget/maxVal)*100}%` }}/>
                </div>
                <span className="text-gray-400 text-xs w-10">${d.budget}M</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-xs w-12 text-right">Actual</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2.5 overflow-hidden">
                  <div className="h-2.5 rounded-full" style={{ width:`${(d.actual/maxVal)*100}%`, background: d.variance > 0 ? '#ef4444aa' : '#a855f7' }}/>
                </div>
                <span className="text-xs w-10 font-bold" style={{ color: d.variance > 0 ? '#f87171' : '#c084fc' }}>${d.actual}M</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── REQ-14: Spare Parts Criticality Matrix ────────────────────────────────────
const PARTS_MATRIX_ITEMS = [
  { part:'Bearing 7B-2241-ZZ', leftPct:22, topPct:18, quad:'HL' },
  { part:'Impeller IP-100-8',  leftPct:78, topPct:22, quad:'HH' },
  { part:'Seal Kit MS-400',    leftPct:26, topPct:38, quad:'HL' },
  { part:'Coupling CH-SGT8',   leftPct:82, topPct:42, quad:'HH' },
  { part:'Lube Filter LF-7A',  leftPct:20, topPct:72, quad:'LL' },
  { part:'O-Ring Kit OR-HT',   leftPct:28, topPct:80, quad:'LL' },
];

const SpareCriticalityMatrix: React.FC = () => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
    <div className="px-5 py-3 border-b border-gray-800">
      <h3 className="text-white font-semibold text-sm">REQ-14 · Spare Parts Criticality Matrix</h3>
      <p className="text-gray-500 text-xs mt-0.5">Criticality × Lead Time · Strategic stockholding positions</p>
    </div>
    <div className="p-5">
      <div className="relative rounded-xl overflow-hidden border border-gray-800" style={{ height: 300 }}>
        {/* Quadrant backgrounds */}
        <div style={{ position:'absolute', inset:0, display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr' }}>
          <div style={{ background:'#1c0a2e', borderRight:'1px solid #374151', borderBottom:'1px solid #374151' }}/>
          <div style={{ background:'#200a0a', borderBottom:'1px solid #374151' }}/>
          <div style={{ background:'#0a1c0a', borderRight:'1px solid #374151' }}/>
          <div style={{ background:'#0a0a1c' }}/>
        </div>
        {/* Quadrant labels */}
        <div style={{ position:'absolute', top:8, left:8, fontSize:9, color:'#a78bfa', fontWeight:700 }}>
          HIGH CRIT · SHORT LEAD<br/><span style={{ color:'#6b7280', fontWeight:400 }}>Buffer stock</span>
        </div>
        <div style={{ position:'absolute', top:8, right:8, fontSize:9, color:'#f87171', fontWeight:700, textAlign:'right' }}>
          HIGH CRIT · LONG LEAD<br/><span style={{ color:'#6b7280', fontWeight:400 }}>Strategic reserve</span>
        </div>
        <div style={{ position:'absolute', bottom:28, left:8, fontSize:9, color:'#4ade80', fontWeight:700 }}>
          LOW CRIT · SHORT LEAD<br/><span style={{ color:'#6b7280', fontWeight:400 }}>Just-in-time</span>
        </div>
        <div style={{ position:'absolute', bottom:28, right:8, fontSize:9, color:'#60a5fa', fontWeight:700, textAlign:'right' }}>
          LOW CRIT · LONG LEAD<br/><span style={{ color:'#6b7280', fontWeight:400 }}>Consignment</span>
        </div>
        {/* Parts dots */}
        {PARTS_MATRIX_ITEMS.map(p => (
          <div key={p.part} style={{ position:'absolute', left:`${p.leftPct}%`, top:`${p.topPct}%`, transform:'translate(-50%,-50%)' }}>
            <div style={{ width:12, height:12, borderRadius:'50%', background:'#a855f7', boxShadow:'0 0 6px #a855f7' }}/>
            <p style={{ color:'#e5e7eb', fontSize:9, whiteSpace:'nowrap', marginTop:2 }}>{p.part}</p>
          </div>
        ))}
        {/* Axis labels */}
        <div style={{ position:'absolute', bottom:4, left:0, right:0, textAlign:'center', fontSize:10, color:'#4b5563' }}>← Short Lead Time · Long Lead Time →</div>
        <div style={{ position:'absolute', top:0, bottom:24, left:2, display:'flex', alignItems:'center', writingMode:'vertical-rl', fontSize:10, color:'#4b5563' }}>High Criticality ↑</div>
      </div>
    </div>
  </div>
);

// ── REQ-17: Oil Analysis & Lubrication Tracker ───────────────────────────────
const OIL_SAMPLES = [
  { asset:'C-101', date:'2026-04-05', visc:'HIGH',  ferrous:'CRITICAL', water:'OK',    tbn:'LOW',  status:'critical', action:'Immediate oil change + bearing inspect'     },
  { asset:'E-212', date:'2026-04-08', visc:'OK',    ferrous:'HIGH',    water:'OK',    tbn:'OK',   status:'warning',  action:'Schedule oil change within 5 days'           },
  { asset:'P-205', date:'2026-04-10', visc:'OK',    ferrous:'OK',      water:'TRACE', tbn:'OK',   status:'advisory', action:'Monitor water ingress source'                 },
  { asset:'T-405', date:'2026-04-09', visc:'OK',    ferrous:'OK',      water:'OK',    tbn:'OK',   status:'ok',       action:'No action — next sample in 30d'              },
  { asset:'K-302', date:'2026-04-11', visc:'OK',    ferrous:'OK',      water:'OK',    tbn:'OK',   status:'ok',       action:'No action — next sample in 30d'              },
];
const OIL_PARAM_COL: Record<string,string> = { CRITICAL:'#f87171', HIGH:'#fb923c', LOW:'#fbbf24', TRACE:'#fbbf24', OK:'#4ade80' };

const OilAnalysisPanel: React.FC = () => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
      <div>
        <h3 className="text-white font-semibold text-sm">REQ-17 · Oil Analysis & Lubrication Tracker</h3>
        <p className="text-gray-500 text-xs mt-0.5">ISO 4406 · Ferrography · ASTM D445 viscosity · TBN depletion</p>
      </div>
      <span className="text-xs bg-purple-900/30 text-purple-400 border border-purple-900/50 px-2 py-1 rounded">Shell / Mobil OEM spec</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead><tr className="border-b border-gray-800">
          {['Asset','Sample Date','Viscosity','Ferrous','Water','TBN','Status','Recommended Action'].map(h => (
            <th key={h} className="py-2.5 px-4 text-left text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {OIL_SAMPLES.map(s => (
            <tr key={s.asset} className="border-b border-gray-800 hover:bg-gray-800/30">
              <td className="py-3 px-4 text-purple-400 font-mono text-sm font-bold">{s.asset}</td>
              <td className="py-3 px-4 text-gray-400 text-xs">{s.date}</td>
              {[s.visc, s.ferrous, s.water, s.tbn].map((v, i) => (
                <td key={i} className="py-3 px-4">
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: `${OIL_PARAM_COL[v] ?? '#9ca3af'}22`, color: OIL_PARAM_COL[v] ?? '#9ca3af' }}>{v}</span>
                </td>
              ))}
              <td className="py-3 px-4">
                <span className="text-xs font-bold capitalize" style={{ color: s.status==='critical'?'#f87171':s.status==='warning'?'#fb923c':s.status==='advisory'?'#fbbf24':'#4ade80' }}>
                  {s.status.toUpperCase()}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-400 text-xs">{s.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ── REQ-07: Health Trend & Degradation Forecast ──────────────────────────────
const HEALTH_TREND: Record<string, { past: number[]; forecast: number[] }> = {
  'C-101': { past: [82,79,76,72,67,62,55,48,42,38], forecast: [32,24,15,5]  },
  'E-212': { past: [88,86,83,80,77,73,68,62,56,52], forecast: [45,37,28,18] },
  'P-205': { past: [94,93,91,89,86,83,79,74,69,64], forecast: [58,51,43,34] },
  'T-405': { past: [91,90,89,87,85,83,80,77,74,72], forecast: [68,63,57,51] },
  'K-302': { past: [98,97,97,96,95,94,93,92,91,91], forecast: [90,89,88,86] },
};

const HealthTrendPanel: React.FC<{ assetId: string }> = ({ assetId }) => {
  const d = HEALTH_TREND[assetId];
  if (!d) return null;
  const W = 680, H = 160, PL = 40, PR = 30, PT = 16, PB = 28;
  const cW = W - PL - PR, cH = H - PT - PB;
  const total = d.past.length + d.forecast.length;
  const xS = (i: number) => PL + (i / (total - 1)) * cW;
  const yS = (v: number) => PT + cH - (v / 100) * cH;
  const pastPts  = d.past.map((v,i) => `${xS(i)},${yS(v)}`).join(' ');
  const fcastPts = [d.past[d.past.length-1], ...d.forecast]
    .map((v,i) => `${xS(d.past.length - 1 + i)},${yS(v)}`).join(' ');
  const todayX = xS(d.past.length - 1);
  const alarmY = yS(60), critY = yS(40);

  return (
    <div className="bg-gray-900 border border-indigo-900/40 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <div>
          <h4 className="text-white font-semibold text-sm">REQ-07 · Health Trend & Degradation Forecast — {assetId}</h4>
          <p className="text-gray-500 text-xs mt-0.5">180-day history · AI degradation model · RUL projection</p>
        </div>
        <div className="flex gap-5 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-4 border-t border-indigo-400 inline-block"/>Historical</span>
          <span className="flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-amber-400 inline-block"/>Forecast</span>
          <span className="flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-amber-400/50 inline-block"/>Alarm 60%</span>
          <span className="flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-red-400/50 inline-block"/>Critical 40%</span>
        </div>
      </div>
      <div className="p-4">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height: H }}>
          {[0,25,50,75,100].map(v => {
            const y = yS(v);
            return <g key={v}>
              <line x1={PL} y1={y} x2={W-PR} y2={y} stroke="#1f2937" strokeWidth="1"/>
              <text x={PL-4} y={y+3} fill="#4b5563" fontSize="8" textAnchor="end">{v}%</text>
            </g>;
          })}
          <line x1={PL} y1={alarmY} x2={W-PR} y2={alarmY} stroke="#fbbf24" strokeWidth="1" strokeDasharray="4,3"/>
          <text x={W-PR+2} y={alarmY+3} fill="#fbbf24" fontSize="7">60%</text>
          <line x1={PL} y1={critY} x2={W-PR} y2={critY} stroke="#ef4444" strokeWidth="1" strokeDasharray="4,3"/>
          <text x={W-PR+2} y={critY+3} fill="#ef4444" fontSize="7">40%</text>
          <polyline points={pastPts}  fill="none" stroke="#818cf8" strokeWidth="2"/>
          <polyline points={fcastPts} fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="5,4"/>
          <line x1={todayX} y1={PT} x2={todayX} y2={H-PB} stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4,3"/>
          <text x={todayX} y={PT-3} fill="#a78bfa" fontSize="7" textAnchor="middle">TODAY</text>
          {d.past.map((v,i) => <circle key={i} cx={xS(i)} cy={yS(v)} r="3" fill="#818cf8"/>)}
          <text x={PL}     y={H-4} fill="#4b5563" fontSize="7" textAnchor="start">−180d</text>
          <text x={todayX} y={H-4} fill="#a78bfa" fontSize="7" textAnchor="middle">Today</text>
          <text x={W-PR}   y={H-4} fill="#fbbf24" fontSize="7" textAnchor="end">+60d</text>
        </svg>
      </div>
    </div>
  );
};

// ── REQ-09: Regulatory Compliance Tracker ────────────────────────────────────
const COMPLIANCE_ITEMS = [
  { reg:'API 510 — Pressure Vessel Inspection', site:'Ruwais',     status:'compliant', next:'2026-09-15', daysLeft:156, inspector:'DNV GL',          score:96 },
  { reg:'API 570 — Piping Inspection',          site:'Houston',    status:'due-soon',  next:'2026-05-01', daysLeft:19,  inspector:'Bureau Veritas',   score:88 },
  { reg:'ISO 13374 — Condition Monitoring',     site:'Rotterdam',  status:'compliant', next:'2026-11-30', daysLeft:232, inspector:'Internal',          score:94 },
  { reg:'ASME B31.3 — Process Piping',          site:'Ras Tanura', status:'overdue',   next:'2026-03-30', daysLeft:-13, inspector:"Lloyd's Register",  score:71 },
  { reg:'PSM / RMP — Process Safety',           site:'Whiting',    status:'compliant', next:'2026-08-20', daysLeft:130, inspector:'OSHA',              score:91 },
  { reg:'API 580 — Risk-Based Inspection',      site:'Jamnagar',   status:'compliant', next:'2026-10-10', daysLeft:181, inspector:'TÜV SÜD',           score:97 },
  { reg:'ISO 45001 — OHS Management',           site:'All Sites',  status:'due-soon',  next:'2026-04-30', daysLeft:18,  inspector:'BSI',               score:83 },
];
const COMP_CHIP: Record<string,{bg:string;color:string;label:string}> = {
  compliant: {bg:'#052e16',color:'#4ade80',label:'COMPLIANT'},
  'due-soon':{bg:'#2a1e00',color:'#fbbf24',label:'DUE SOON'},
  overdue:   {bg:'#450a0a',color:'#f87171',label:'OVERDUE'},
};

const ComplianceTab: React.FC = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-3">
      {[
        [String(COMPLIANCE_ITEMS.filter(i => i.status==='compliant').length), 'COMPLIANT', 'text-green-400','border-green-900/50'],
        [String(COMPLIANCE_ITEMS.filter(i => i.status==='due-soon').length),  'DUE SOON',  'text-amber-400','border-amber-900/50'],
        [String(COMPLIANCE_ITEMS.filter(i => i.status==='overdue').length),   'OVERDUE',   'text-red-400',  'border-red-900/50'],
      ].map(([v,l,t,b]) => (
        <div key={l} className={`bg-gray-900 border ${b} rounded-xl p-4`}>
          <p className={`text-2xl font-bold ${t}`}>{v}</p>
          <p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">{l}</p>
        </div>
      ))}
    </div>
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800">
        <h3 className="text-white font-semibold">Regulatory Compliance Tracker</h3>
        <p className="text-gray-500 text-xs mt-0.5">API · ASME · ISO · PSM standards · Real-time compliance status</p>
      </div>
      <div className="divide-y divide-gray-800">
        {COMPLIANCE_ITEMS.map(item => {
          const chip = COMP_CHIP[item.status];
          return (
            <div key={item.reg} className="px-5 py-4 hover:bg-gray-800/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background:chip.bg, color:chip.color }}>{chip.label}</span>
                    <p className="text-white text-sm font-semibold">{item.reg}</p>
                  </div>
                  <p className="text-gray-500 text-xs">{item.site} · Inspector: {item.inspector}</p>
                </div>
                <div className="text-right flex-shrink-0 w-28">
                  <p className={`text-sm font-bold ${item.daysLeft < 0 ? 'text-red-400' : item.daysLeft < 30 ? 'text-amber-400' : 'text-white'}`}>
                    {item.daysLeft < 0 ? `${Math.abs(item.daysLeft)}d overdue` : `${item.daysLeft}d left`}
                  </p>
                  <p className="text-gray-600 text-xs">{item.next}</p>
                </div>
                <div className="flex-shrink-0 w-32">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-600">Score</span>
                    <span className="font-bold" style={{ color: item.score>=90?'#4ade80':item.score>=75?'#fbbf24':'#f87171' }}>{item.score}%</span>
                  </div>
                  <div className="bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div className="h-1.5 rounded-full" style={{ width:`${item.score}%`, background:item.score>=90?'#4ade80':item.score>=75?'#fbbf24':'#ef4444' }}/>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

// ── REQ-23: Live Demo / Guided Tour Mode ─────────────────────────────────────
const TOUR_STEPS: { tab: TabId; title: string; desc: string }[] = [
  { tab:'dashboard',        title:'Global Operations Dashboard',        desc:'Monitor all 40 BP refineries worldwide. The AI Failure Prediction Gantt shows 90-day predicted failures for 14 critical assets, and Multi-Site Benchmarking ranks sites by OEE, MTBF, and MTTR.' },
  { tab:'live-alerts',      title:'Live Alert Intelligence',            desc:'AI-prioritised alerts powered by LSTM + XGBoost. The Anomaly Heatmap shows 7-day rolling scores for 8 assets, while the Escalation Matrix defines who to call, when, and how for every severity level.' },
  { tab:'equipment-health', title:'Equipment Health Centre',            desc:'Vibration FFT Spectrum Analyser (ISO 13373-3), Health Degradation Forecast with AI RUL projection, Oil Analysis & Lubrication Tracker, and the 5×5 Risk Matrix — all per asset.' },
  { tab:'ai-advisor',       title:'RefinerAI Advisor — Claude Opus 4.6',desc:'Chat with Claude Opus 4.6 about any equipment, failure, spare part, or work order. Streaming responses, adaptive thinking, and full refinery domain expertise built in.' },
  { tab:'work-orders',      title:'AI Work Orders, RCA & Crew Planner', desc:'Auto-generated work orders with OEM procedures. Root Cause Analysis runs 5-Why on top failures. Crew Planner shows live roster, certifications, and WO assignments across all sites.' },
  { tab:'spare-parts',      title:'Spare Parts — Criticality Matrix',   desc:'AI-prioritised parts inventory with stock levels, reorder urgency, and supplier lead times. The Criticality Matrix plots every part by criticality vs lead time for strategic stockholding decisions.' },
  { tab:'roi',              title:'ROI Analytics & Budget Tracker',     desc:'Track BP\'s 40% unplanned downtime reduction target (currently 38.2%). MTBF/MTTR/OEE fleet KPIs, Maintenance Budget vs Actuals across all sites, and quarterly savings trend.' },
  { tab:'ml-models',        title:'ML Models & AI Feedback Loop',       desc:'Six production models — LSTM, XGBoost, Prophet, Random Forest, CNN, Isolation Forest. The AI Feedback Loop tracks confirmed predictions, false positives, and missed failures for continuous model improvement.' },
  { tab:'reliability',      title:'FMEA Failure Mode Library',          desc:'IEC 60812 FMEA table with RPN scoring (Severity × Occurrence × Detection). All critical failure modes, causes, current controls, and recommended corrective actions across equipment types.' },
  { tab:'compliance',       title:'Regulatory Compliance Tracker',      desc:'API 510/570, ASME B31.3, ISO 13374, PSM, and ISO 45001 compliance status for every site. Real-time compliance scores, next inspection dates, and overdue alerts.' },
  { tab:'energy',           title:'Energy Consumption Monitor',         desc:'GJ/tonne energy intensity and carbon footprint per site. Bar chart vs targets, YTD reduction tracking, and steam/power consumption — aligned with BP\'s net-zero decarbonisation roadmap.' },
  { tab:'field-ops',        title:'Inspection Route Optimiser',         desc:'AI-optimised inspection routes minimise travel distance and maximise coverage. Live status per route, inspector assignments, and a digital inspection checklist with CMMS upload.' },
  { tab:'tar',              title:'TAR Shutdown Planning',              desc:'Turnaround schedule for 2026: three planned shutdowns totalling $29.4M. Gantt view with month gridlines, plus work scope count, duration, and budget per event.' },
];

interface TourOverlayProps { onClose: () => void; onTabChange: (tab: TabId) => void; }

const TourOverlay: React.FC<TourOverlayProps> = ({ onClose, onTabChange }) => {
  const [step, setStep] = useState(0);
  const current = TOUR_STEPS[step];

  useEffect(() => { onTabChange(current.tab); }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (next: number) => { setStep(next); };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-end', justifyContent:'center', paddingBottom:36 }}>
      <div style={{ background:'#0f172a', border:'1px solid #3730a3', borderRadius:16, padding:'28px 32px', maxWidth:580, width:'90%', boxShadow:'0 0 60px #7c3aed33' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
          <div>
            <p style={{ fontSize:10, color:'#7c3aed', textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:700, marginBottom:6 }}>
              Live Tour · Step {step + 1} of {TOUR_STEPS.length}
            </p>
            <p style={{ color:'#fff', fontSize:17, fontWeight:700, lineHeight:1.3 }}>{current.title}</p>
          </div>
          <button onClick={onClose} style={{ color:'#6b7280', fontSize:20, background:'none', border:'none', cursor:'pointer', marginLeft:16, lineHeight:1 }}>✕</button>
        </div>
        {/* Description */}
        <p style={{ color:'#9ca3af', fontSize:13, lineHeight:1.65, marginBottom:20 }}>{current.desc}</p>
        {/* Progress bar */}
        <div style={{ display:'flex', gap:3, marginBottom:20 }}>
          {TOUR_STEPS.map((_, i) => (
            <div key={i} style={{ height:3, flex:1, borderRadius:2, background: i <= step ? '#7c3aed' : '#1f2937', cursor:'pointer', transition:'background .2s' }} onClick={() => go(i)}/>
          ))}
        </div>
        {/* Buttons */}
        <div style={{ display:'flex', gap:10 }}>
          {step > 0 && (
            <button onClick={() => go(step - 1)} style={{ flex:1, padding:'10px', borderRadius:8, background:'#1f2937', border:'1px solid #374151', color:'#9ca3af', cursor:'pointer', fontSize:13 }}>← Previous</button>
          )}
          <button
            onClick={() => step < TOUR_STEPS.length - 1 ? go(step + 1) : onClose()}
            style={{ flex:2, padding:'10px', borderRadius:8, background:'#7c3aed', border:'none', color:'#fff', cursor:'pointer', fontWeight:600, fontSize:13 }}
          >
            {step < TOUR_STEPS.length - 1 ? 'Next →' : '✓ Finish Tour'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── REQ-22: TAR Shutdown Planning ────────────────────────────────────────────
const TAR_ITEMS = [
  { id:'TAR-2026-01', site:'Ruwais, UAE',     unit:'CDU-1',      start:'2026-06-01', end:'2026-06-28', days:28, status:'planned',   cost:'$8.4M',  scope:124 },
  { id:'TAR-2026-02', site:'Houston, USA',    unit:'VDU + HDS',  start:'2026-08-10', end:'2026-09-15', days:36, status:'planned',   cost:'$14.2M', scope:218 },
  { id:'TAR-2026-03', site:'Rotterdam, NL',   unit:'Reformer-2', start:'2026-09-20', end:'2026-10-12', days:22, status:'planned',   cost:'$6.8M',  scope:87  },
  { id:'TAR-2025-04', site:'Ras Tanura, KSA', unit:'PFCC Unit',  start:'2025-11-01', end:'2025-11-30', days:30, status:'completed', cost:'$11.1M', scope:196 },
  { id:'TAR-2025-03', site:'Jamnagar, India', unit:'Coker Unit', start:'2025-09-15', end:'2025-10-08', days:23, status:'completed', cost:'$9.3M',  scope:143 },
];

const TARTab: React.FC = () => {
  const upcoming = TAR_ITEMS.filter(t => t.status === 'planned');
  const W = 640, HDR = 32, ROW_H = 36;
  const H = HDR + upcoming.length * ROW_H + 8;
  const rangeStart = new Date('2026-05-01').getTime();
  const rangeEnd   = new Date('2026-10-31').getTime();
  const totalMs    = rangeEnd - rangeStart;
  const xPct = (d: string) => Math.max(0, Math.min(100, (new Date(d).getTime() - rangeStart) / totalMs * 100));
  const MONTHS = ['May','Jun','Jul','Aug','Sep','Oct'];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          [String(upcoming.length),                                         'PLANNED 2026',       'text-blue-400',  'border-blue-900/50'  ],
          ['$29.4M',                                                        'PLANNED BUDGET',     'text-white',     'border-gray-800'     ],
          [String(upcoming.reduce((s,t) => s+t.scope, 0)),                  'WORK SCOPES',        'text-purple-400','border-purple-900/50'],
          [String(TAR_ITEMS.filter(t => t.status==='completed').length),    'COMPLETED 2025',     'text-green-400', 'border-green-900/50' ],
        ].map(([v,l,t,b]) => (
          <div key={l} className={`bg-gray-900 border ${b} rounded-xl p-4`}>
            <p className={`text-2xl font-bold ${t}`}>{v}</p>
            <p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      {/* Gantt */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold">REQ-22 · TAR Shutdown Planning — 2026 Schedule</h3>
          <p className="text-gray-500 text-xs mt-0.5">May–Oct 2026 horizon · Planned turnarounds</p>
        </div>
        <div className="p-5">
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height: H }}>
            {/* Month labels + gridlines */}
            {MONTHS.map((m, i) => {
              const x = (i / (MONTHS.length - 1)) * W;
              return (
                <g key={m}>
                  <line x1={x} y1={HDR} x2={x} y2={H} stroke="#1f2937" strokeWidth="1"/>
                  <text x={x+4} y={18} fill="#4b5563" fontSize="9">{m} 2026</text>
                </g>
              );
            })}
            {/* TAR bars */}
            {upcoming.map((tar, i) => {
              const x1 = xPct(tar.start) / 100 * W;
              const x2 = xPct(tar.end)   / 100 * W;
              const y  = HDR + i * ROW_H + 4;
              return (
                <g key={tar.id}>
                  <rect x={x1} y={y} width={Math.max(6, x2-x1)} height={ROW_H-8} fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1" rx="4"/>
                  <text x={x1+6} y={y+11} fill="#93c5fd" fontSize="8" fontWeight="bold">{tar.id}</text>
                  <text x={x1+6} y={y+22} fill="#60a5fa" fontSize="7">{tar.site} · {tar.unit} · {tar.days}d · {tar.cost}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4">
        {TAR_ITEMS.map(t => (
          <div key={t.id} className={`bg-gray-900 border ${t.status==='completed' ? 'border-green-900/40' : 'border-blue-900/40'} rounded-xl p-4`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white font-semibold text-sm">{t.id}</p>
                <p className="text-gray-500 text-xs">{t.site} · {t.unit}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${t.status==='completed' ? 'bg-green-900/40 text-green-400' : 'bg-blue-900/40 text-blue-400'}`}>
                {t.status.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs mb-2">
              <div><p className="text-gray-600">Duration</p><p className="text-white font-semibold">{t.days} days</p></div>
              <div><p className="text-gray-600">Budget</p><p className="text-white font-semibold">{t.cost}</p></div>
              <div><p className="text-gray-600">Work Scopes</p><p className="text-white font-semibold">{t.scope}</p></div>
            </div>
            <p className="text-gray-600 text-xs">{t.start} → {t.end}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── REQ-21: Energy Consumption Monitor ───────────────────────────────────────
const ENERGY_SITES = [
  { site:'Ruwais, UAE',     gjt:4.82, carbon:0.28, target:4.50, power:842,  steam:1240, trend:+0.12 },
  { site:'Houston, USA',    gjt:4.21, carbon:0.24, target:4.00, power:612,  steam:980,  trend:-0.08 },
  { site:'Rotterdam, NL',   gjt:3.98, carbon:0.21, target:4.00, power:541,  steam:820,  trend:-0.15 },
  { site:'Ras Tanura, KSA', gjt:4.44, carbon:0.26, target:4.20, power:720,  steam:1100, trend:+0.04 },
  { site:'Jamnagar, India', gjt:3.76, carbon:0.19, target:3.80, power:498,  steam:760,  trend:-0.18 },
];

const EnergyTab: React.FC = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-3">
      {[
        ['4.24 GJ/t',  'Fleet Energy Intensity',    'YTD 2026 average',          'text-blue-400',  'border-blue-900/50'  ],
        ['0.24 tCO₂',  'Carbon Intensity',          'tCO₂ per tonne processed',  'text-green-400', 'border-green-900/50' ],
        ['−8.2%',      'YTD Reduction',             'vs 2025 baseline',          'text-purple-400','border-purple-900/50'],
        ['$12.4M',     'Energy Cost Savings',       'vs unoptimised baseline',   'text-amber-400', 'border-amber-900/50' ],
      ].map(([v,l,s,t,b]) => (
        <div key={l} className={`bg-gray-900 border ${b} rounded-xl p-4`}>
          <p className={`text-2xl font-bold ${t}`}>{v}</p>
          <p className="text-white text-xs font-semibold mt-0.5">{l}</p>
          <p className="text-gray-600 text-xs">{s}</p>
        </div>
      ))}
    </div>
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800">
        <h3 className="text-white font-semibold">REQ-21 · Energy Consumption Monitor — Per Site</h3>
        <p className="text-gray-500 text-xs mt-0.5">GJ/tonne · Carbon intensity · Power & steam · BP decarbonisation tracking</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-gray-800">
            {['Site','GJ / Tonne','Target','vs Target','Carbon (tCO₂/t)','Power (MW)','Steam (t/h)','Trend'].map(h => (
              <th key={h} className="py-2.5 px-4 text-left text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {ENERGY_SITES.map(s => {
              const vs  = ((s.gjt - s.target) / s.target * 100).toFixed(1);
              const over = s.gjt > s.target;
              return (
                <tr key={s.site} className="border-b border-gray-800 hover:bg-gray-800/30">
                  <td className="py-3 px-4 text-white text-sm whitespace-nowrap">{s.site}</td>
                  <td className="py-3 px-4 text-blue-400 text-sm font-bold font-mono">{s.gjt}</td>
                  <td className="py-3 px-4 text-gray-500 text-sm font-mono">{s.target}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-bold ${over ? 'text-red-400' : 'text-green-400'}`}>
                      {over ? '↑' : '↓'} {Math.abs(Number(vs))}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-green-400 text-sm font-mono">{s.carbon}</td>
                  <td className="py-3 px-4 text-gray-300 text-sm">{s.power} MW</td>
                  <td className="py-3 px-4 text-gray-300 text-sm">{s.steam} t/h</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold ${s.trend < 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {s.trend < 0 ? '↓' : '↑'} {Math.abs(s.trend)} GJ/t
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    {/* Energy bar chart */}
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h4 className="text-white font-semibold text-sm mb-4">GJ/Tonne vs Target — All Sites</h4>
      <div className="space-y-3">
        {ENERGY_SITES.map(s => {
          const over = s.gjt > s.target;
          const maxVal = 5.5;
          return (
            <div key={s.site} className="flex items-center gap-3">
              <span className="text-gray-400 text-xs w-36 truncate flex-shrink-0">{s.site}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden relative">
                <div className="h-3 rounded-full" style={{ width:`${(s.gjt/maxVal)*100}%`, background: over ? '#ef4444aa' : '#3b82f6' }}/>
                <div className="absolute top-0 bottom-0 border-r-2 border-amber-400" style={{ left:`${(s.target/maxVal)*100}%` }}/>
              </div>
              <span className={`text-xs font-bold w-14 text-right ${over ? 'text-red-400' : 'text-blue-400'}`}>{s.gjt} GJ/t</span>
              <span className="text-gray-600 text-xs w-14 text-right">tgt {s.target}</span>
            </div>
          );
        })}
      </div>
      <p className="text-gray-600 text-xs mt-3">│ amber line = site target</p>
    </div>
  </div>
);

// ── REQ-20: Inspection Route Optimiser (Field Ops tab) ───────────────────────
const INSPECTION_ROUTES = [
  { id:'RT-01', name:'North Unit Rotating Equipment', assets:['C-101','P-205','K-302'], inspector:'Ahmed Al-Rashid', duration:'4h', distance:'2.4 km', status:'In Progress', priority:'critical' },
  { id:'RT-02', name:'South Heat Exchanger Loop',     assets:['E-212','E-501','E-314'], inspector:'Maria Santos',    duration:'3h', distance:'1.8 km', status:'Scheduled',   priority:'high'     },
  { id:'RT-03', name:'Gas Turbine & Compressor Train',assets:['T-405','G-302','K-201'], inspector:'Li Wei',          duration:'5h', distance:'3.1 km', status:'Scheduled',   priority:'high'     },
  { id:'RT-04', name:'Vessel & Storage Tank Circuit', assets:['V-305','T-103','F-101'], inspector:'James Okafor',    duration:'2h', distance:'1.2 km', status:'Completed',   priority:'medium'   },
];
const ROUTE_PRI: Record<string,{bg:string;color:string}> = {
  critical:{bg:'#450a0a',color:'#f87171'}, high:{bg:'#431407',color:'#fb923c'}, medium:{bg:'#1a2e05',color:'#4ade80'},
};
const ROUTE_ST: Record<string,string> = { 'In Progress':'#fbbf24', Scheduled:'#60a5fa', Completed:'#4ade80' };

const FieldOpsTab: React.FC = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-3">
      {[
        [String(INSPECTION_ROUTES.length),                                              'ROUTES TODAY',  'text-white',   'border-gray-800'],
        [String(INSPECTION_ROUTES.filter(r => r.status==='In Progress').length),        'IN PROGRESS',   'text-amber-400','border-amber-900/50'],
        [String(INSPECTION_ROUTES.filter(r => r.status==='Scheduled').length),          'SCHEDULED',     'text-blue-400', 'border-blue-900/50'],
        [String(INSPECTION_ROUTES.filter(r => r.status==='Completed').length),          'COMPLETED',     'text-green-400','border-green-900/50'],
      ].map(([v,l,t,b]) => (
        <div key={l} className={`bg-gray-900 border ${b} rounded-xl p-4`}>
          <p className={`text-2xl font-bold ${t}`}>{v}</p>
          <p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">{l}</p>
        </div>
      ))}
    </div>
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800">
        <h3 className="text-white font-semibold">REQ-20 · Inspection Route Optimiser</h3>
        <p className="text-gray-500 text-xs mt-0.5">AI-optimised inspection sequences · Shortest path · Priority weighted</p>
      </div>
      <div className="divide-y divide-gray-800">
        {INSPECTION_ROUTES.map(route => (
          <div key={route.id} className="px-5 py-4 hover:bg-gray-800/30 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-purple-400 font-mono text-xs font-bold">{route.id}</span>
                  <p className="text-white font-semibold text-sm">{route.name}</p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background:ROUTE_PRI[route.priority].bg, color:ROUTE_PRI[route.priority].color }}>{route.priority.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-5 text-xs text-gray-500">
                  <span>Inspector: <span className="text-gray-300">{route.inspector}</span></span>
                  <span>Route: <span className="text-purple-400 font-mono">{route.assets.join(' → ')}</span></span>
                  <span>Distance: <span className="text-white">{route.distance}</span></span>
                  <span>Est. time: <span className="text-white">{route.duration}</span></span>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded flex-shrink-0"
                style={{ background:`${ROUTE_ST[route.status]}22`, color:ROUTE_ST[route.status] }}>
                {route.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
    {/* Inspection checklist for active route */}
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h4 className="text-white font-semibold text-sm mb-3">Active Route RT-01 · Inspection Checklist</h4>
      <div className="grid grid-cols-2 gap-2">
        {[
          ['✓','C-101 · Vibration check (ISO 13373-3)','text-green-400'],
          ['✓','C-101 · Bearing temperature reading','text-green-400'],
          ['✓','C-101 · Lube oil pressure & level','text-green-400'],
          ['○','P-205 · Seal flush pressure check','text-gray-500'],
          ['○','P-205 · Motor current reading','text-gray-500'],
          ['○','K-302 · Inlet filter ΔP reading','text-gray-500'],
          ['○','K-302 · Discharge temperature','text-gray-500'],
          ['○','Route sign-off & CMMS upload','text-gray-500'],
        ].map(([icon, task, col]) => (
          <div key={task} className="flex items-center gap-2 bg-gray-800/40 rounded-lg px-3 py-2">
            <span className={`font-bold flex-shrink-0 ${col}`}>{icon}</span>
            <span className="text-gray-300 text-xs">{task}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── REQ-08: FMEA Failure Mode Library ────────────────────────────────────────
const FMEA_DATA = [
  { type:'Centrifugal Compressor', mode:'Bearing Failure',   effect:'Compressor shutdown, production loss',  cause:'Lube oil starvation / fatigue',        control:'Vibration monitoring, oil analysis',  s:5, o:5, d:3, action:'Increase PM frequency, add backup lube circuit' },
  { type:'Centrifugal Compressor', mode:'Impeller Fouling',  effect:'Reduced throughput',                   cause:'Process fluid contamination',          control:'ΔP monitoring, periodic inspection',  s:3, o:4, d:3, action:'Install upstream filter, increase wash frequency' },
  { type:'Heat Exchanger',         mode:'Tube Fouling',      effect:'Reduced heat transfer, efficiency loss',cause:'Scale / biological growth',            control:'Efficiency monitoring',               s:3, o:5, d:2, action:'Chemical dosing, hydro-jetting schedule' },
  { type:'Heat Exchanger',         mode:'Tube Rupture',      effect:'Process leak, HSE risk',               cause:'Corrosion / erosion',                  control:'API 510 inspection, UT scanning',     s:5, o:2, d:2, action:'RBI intervals, cathodic protection' },
  { type:'Centrifugal Pump',       mode:'Mechanical Seal Failure', effect:'Product leak, fire risk',        cause:'Dry run / misalignment',               control:'Seal flush monitoring',               s:5, o:3, d:2, action:'Upgrade to Plan 53B seal system' },
  { type:'Gas Turbine',            mode:'Blade Erosion',     effect:'Power reduction, unplanned outage',   cause:'Inlet air contamination',              control:'Borescope, vibration monitoring',      s:5, o:2, d:3, action:'Enhanced inlet filtration, annual borescope' },
  { type:'Separator Vessel',       mode:'Overpressure',      effect:'Vessel rupture, HSE catastrophe',     cause:'PSV failure / instrumentation fault',  control:'PSV testing, PLC interlocks',          s:5, o:1, d:1, action:'Redundant PSV, SIL-2 interlock review' },
];

const FMEATab: React.FC = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-3">
      {[
        ['7','FAILURE MODES','text-white','border-gray-800'],
        [String(FMEA_DATA.filter(f => f.s*f.o*f.d >= 15).length),'CRITICAL RPN ≥15','text-red-400','border-red-900/50'],
        [String(FMEA_DATA.filter(f => { const r=f.s*f.o*f.d; return r>=10&&r<15; }).length),'HIGH RPN 10–14','text-amber-400','border-amber-900/50'],
        ['IEC 60812','FMEA STANDARD','text-purple-400','border-purple-900/50'],
      ].map(([v,l,t,b]) => (
        <div key={l} className={`bg-gray-900 border ${b} rounded-xl p-4`}>
          <p className={`text-2xl font-bold ${t}`}>{v}</p>
          <p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">{l}</p>
        </div>
      ))}
    </div>
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800">
        <h3 className="text-white font-semibold">FMEA Failure Mode Library</h3>
        <p className="text-gray-500 text-xs mt-0.5">Severity × Occurrence × Detection = RPN · AI-scored and ranked</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-gray-800">
            {['Equipment Type','Failure Mode','Effect','Cause','Current Control','S','O','D','RPN','Recommended Action'].map(h => (
              <th key={h} className="py-2.5 px-3 text-left text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {FMEA_DATA.map((f, i) => {
              const rpn = f.s * f.o * f.d;
              const rpnCol = rpn >= 15 ? '#f87171' : rpn >= 10 ? '#fb923c' : rpn >= 5 ? '#fbbf24' : '#4ade80';
              return (
                <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/30">
                  <td className="py-2.5 px-3 text-purple-400 text-xs font-semibold whitespace-nowrap">{f.type}</td>
                  <td className="py-2.5 px-3 text-white text-xs font-semibold whitespace-nowrap">{f.mode}</td>
                  <td className="py-2.5 px-3 text-gray-300 text-xs">{f.effect}</td>
                  <td className="py-2.5 px-3 text-gray-400 text-xs">{f.cause}</td>
                  <td className="py-2.5 px-3 text-gray-500 text-xs">{f.control}</td>
                  <td className="py-2.5 px-3 text-center text-red-400 text-xs font-bold">{f.s}</td>
                  <td className="py-2.5 px-3 text-center text-amber-400 text-xs font-bold">{f.o}</td>
                  <td className="py-2.5 px-3 text-center text-blue-400 text-xs font-bold">{f.d}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background:`${rpnCol}22`, color:rpnCol }}>{rpn}</span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-400 text-xs">{f.action}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ── Tab content router ────────────────────────────────────────────────────────
const TabContent: React.FC<{ tab: TabId }> = ({ tab }) => {
  switch (tab) {
    case 'dashboard':        return <DashboardTab />;
    case 'live-alerts':      return <LiveAlertsTab />;
    case 'equipment-health': return <EquipmentHealthTab />;
    case 'digital-twin':     return <DigitalTwinTab />;
    case 'ai-advisor':       return <AiAdvisorTab />;
    case 'ml-models':        return <MLModelsTab />;
    case 'spare-parts':      return <SparePartsTab />;
    case 'work-orders':      return <WorkOrdersTab />;
    case 'roi':              return <ROITab />;
    case 'reliability':      return <FMEATab />;
    case 'compliance':       return <ComplianceTab />;
    case 'field-ops':        return <FieldOpsTab />;
    case 'energy':           return <EnergyTab />;
    case 'tar':              return <TARTab />;
    default:                 return null;
  }
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const RefinerAIPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [tourOpen, setTourOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#030712', color: '#f9fafb', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {tourOpen && <TourOverlay onClose={() => setTourOpen(false)} onTabChange={tab => setActiveTab(tab)} />}

      {/* ── App Header ──────────────────────────────────────────────────────── */}
      <header style={{ background: '#0f0f1a', borderBottom: '1px solid #1f2937' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
            {/* Logo + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' }}>
                RA
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#fff', lineHeight: 1.2 }}>RefinerAI</p>
                <p style={{ fontSize: 11, color: '#6b7280' }}>Predictive Maintenance Intelligence</p>
              </div>
            </div>

            {/* Live badge + controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#22c55e', background: '#052e16', border: '1px solid #15803d', padding: '4px 12px', borderRadius: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}/>
                LIVE
              </span>
              <button
                onClick={() => setTourOpen(true)}
                style={{ fontSize: 12, color: '#a78bfa', background: '#1e1b4b', border: '1px solid #3730a3', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
              >
                ▶ Live Tour
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                style={{ fontSize: 12, color: '#9ca3af', background: '#1f2937', border: '1px solid #374151', padding: '6px 14px', borderRadius: 6, cursor: 'pointer' }}
              >
                ← Back to EAIOS
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* ── Sidebar + Content ────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px', display: 'flex', gap: 24 }}>

        {/* Sidebar */}
        <aside style={{ width: 200, flexShrink: 0 }}>
          {/* Operations */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 8 }}>Operations</p>
            {[
              { id: 'dashboard',        label: 'Dashboard',    icon: '◈' },
              { id: 'live-alerts',      label: 'Alerts',       icon: '⚡', badge: 14 },
              { id: 'equipment-health', label: 'Equipment',    icon: '⊙', badge: 3 },
              { id: 'spare-parts',      label: 'Spare Parts',  icon: '☰' },
            ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id as TabId)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '7px 10px', borderRadius: 6, marginBottom: 2, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all .15s',
                  background: activeTab === item.id ? '#1e1b4b' : 'transparent',
                  color: activeTab === item.id ? '#a78bfa' : '#9ca3af',
                  border: activeTab === item.id ? '1px solid #3730a3' : '1px solid transparent',
                }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{item.icon}</span>{item.label}
                </span>
                {item.badge && <span style={{ fontSize: 10, background: '#7c3aed', color: '#fff', borderRadius: 10, padding: '1px 6px', fontWeight: 700 }}>{item.badge}</span>}
              </button>
            ))}
          </div>

          {/* AI & Models */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 8 }}>AI & Models</p>
            {[
              { id: 'ai-advisor',  label: 'AI Advisor',  icon: '◎' },
              { id: 'ml-models',   label: 'ML Models',   icon: '▣' },
              { id: 'digital-twin',label: 'Digital Twin',icon: '◎' },
            ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id as TabId)}
                style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '7px 10px', borderRadius: 6, marginBottom: 2, fontSize: 13, fontWeight: 500, cursor: 'pointer', gap: 8, transition: 'all .15s',
                  background: activeTab === item.id ? '#1e1b4b' : 'transparent',
                  color: activeTab === item.id ? '#a78bfa' : '#9ca3af',
                  border: activeTab === item.id ? '1px solid #3730a3' : '1px solid transparent',
                }}>
                <span>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>

          {/* Reliability */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 8 }}>Reliability</p>
            {[
              { id: 'reliability', label: 'FMEA Library',  icon: '⊞' },
              { id: 'compliance',  label: 'Compliance',    icon: '✓' },
            ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id as TabId)}
                style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '7px 10px', borderRadius: 6, marginBottom: 2, fontSize: 13, fontWeight: 500, cursor: 'pointer', gap: 8, transition: 'all .15s',
                  background: activeTab === item.id ? '#1e1b4b' : 'transparent',
                  color: activeTab === item.id ? '#a78bfa' : '#9ca3af',
                  border: activeTab === item.id ? '1px solid #3730a3' : '1px solid transparent',
                }}>
                <span>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>

          {/* Field & Sustainability */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 8 }}>Field & Sustainability</p>
            {[
              { id: 'field-ops', label: 'Field Ops',  icon: '⊕' },
              { id: 'energy',    label: 'Energy',     icon: '⚡' },
              { id: 'tar',       label: 'TAR Planning',icon: '⌛' },
            ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id as TabId)}
                style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '7px 10px', borderRadius: 6, marginBottom: 2, fontSize: 13, fontWeight: 500, cursor: 'pointer', gap: 8, transition: 'all .15s',
                  background: activeTab === item.id ? '#1e1b4b' : 'transparent',
                  color: activeTab === item.id ? '#a78bfa' : '#9ca3af',
                  border: activeTab === item.id ? '1px solid #3730a3' : '1px solid transparent',
                }}>
                <span>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>

          {/* Planning */}
          <div>
            <p style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 8 }}>Planning</p>
            {[
              { id: 'work-orders', label: 'Work Orders',   icon: '☐' },
              { id: 'roi',         label: 'ROI Analytics', icon: '✏' },
            ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id as TabId)}
                style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '7px 10px', borderRadius: 6, marginBottom: 2, fontSize: 13, fontWeight: 500, cursor: 'pointer', gap: 8, transition: 'all .15s',
                  background: activeTab === item.id ? '#1e1b4b' : 'transparent',
                  color: activeTab === item.id ? '#a78bfa' : '#9ca3af',
                  border: activeTab === item.id ? '1px solid #3730a3' : '1px solid transparent',
                }}>
                <span>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <TabContent tab={activeTab} />
        </main>
      </div>
    </div>
  );
};

export default RefinerAIPage;
