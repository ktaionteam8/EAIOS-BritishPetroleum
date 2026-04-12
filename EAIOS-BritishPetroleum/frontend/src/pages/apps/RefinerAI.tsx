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
  | 'roi';

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
  }
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const RefinerAIPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  return (
    <div style={{ minHeight: '100vh', background: '#030712', color: '#f9fafb', fontFamily: 'Inter, system-ui, sans-serif' }}>

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
