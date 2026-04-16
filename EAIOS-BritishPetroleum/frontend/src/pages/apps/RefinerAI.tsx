import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as API from '../../api/client';
import { getAuthToken } from '../../context/AuthContext';
import { AuditLogPanel } from '../../components/AuditLogPanel';
import { BPAssetMap } from '../../components/BPAssetMap';
import { REFINER_AI_MOCK_LOGS } from '../../data/refinerAiAuditLogs';
import { REFINER_AI_EXTENDED_LOGS } from '../../data/refinerAiAuditLogs_extended';

const ALL_REFINER_AI_AUDIT_LOGS = [...REFINER_AI_MOCK_LOGS, ...REFINER_AI_EXTENDED_LOGS];

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
  | 'tar'
  | 'castrol'
  | 'offshore'
  | 'ot-data'
  | 'adoption'
  | 'wave-tracker'
  | 'edge-ai';

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

// ── A-01: Alert-to-Action Data Structures ────────────────────────────────────
interface ShapSignal {
  name: string;
  values: number[];
  contribution: number;
  unit: string;
}
interface HistoricalAnalogue {
  site: string;
  date: string;
  outcome: string;
  daysToFailure: number;
  match: number;
}
interface AlertData {
  id: string;
  severity: 'critical' | 'warning' | 'advisory';
  title: string;
  site: string;
  details: string;
  failureMode: string;
  probability: number;
  etfDays: number;
  etfMin: number;
  etfMax: number;
  recommendation: 'replace' | 'inspect' | 'monitor';
  shapSignals: ShapSignal[];
  analogues: HistoricalAnalogue[];
  time: string;
}
type AlertDecision = 'active' | 'accepted' | 'modified' | 'overridden';
interface AuditEntry {
  id: string;
  alertId: string;
  alertTitle: string;
  decision: 'accepted' | 'modified' | 'overridden';
  timestamp: string;
  user: string;
  reasonCode: string;
  woNumber: string;
}

const SEV_BG:     Record<string, string> = { critical: '#3b0a0a', warning: '#2d1400', advisory: '#0c1a2e' };
const SEV_BORDER: Record<string, string> = { critical: '#7f1d1d', warning: '#78350f', advisory: '#1e3a5f' };
const RECOMMEND_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  replace: { label: '⚡ REPLACE IMMEDIATELY', color: '#ef4444', bg: '#3b0a0a' },
  inspect: { label: '🔍 INSPECT WITHIN 24H',  color: '#f59e0b', bg: '#2d1400' },
  monitor: { label: '📡 MONITOR CLOSELY',      color: '#60a5fa', bg: '#0c1a2e' },
};
const OVERRIDE_REASONS = [
  'False alarm — normal operating variation',
  'Already actioned by another engineer',
  'Scheduled at upcoming TAR',
  'Duplicate of existing work order',
  'Equipment taken offline',
  'Other',
];

const ALERT_DATA: AlertData[] = [
  {
    id: 'ALT-001', severity: 'critical',
    title: 'Bearing Failure Predicted — Compressor C-101',
    site: 'Ruwais, UAE', details: 'Loop 4A · Vibration 8.4 mm/s',
    failureMode: 'Inner Race Bearing Fatigue (BPFI)',
    probability: 97, etfDays: 2, etfMin: 1, etfMax: 3, recommendation: 'replace',
    shapSignals: [
      { name: 'BPFI Vibration (87 Hz)', values: [1.2,1.4,1.6,2.1,2.8,3.4,4.1,5.2,6.3,7.1,7.8,8.4], contribution: 0.68, unit: 'mm/s' },
      { name: 'Bearing Temperature',    values: [72,73,74,76,79,83,89,95,101,108,114,119],           contribution: 0.21, unit: '°C'   },
      { name: 'Lube Oil Pressure',      values: [4.8,4.8,4.7,4.7,4.6,4.5,4.4,4.3,4.2,4.1,4.0,3.9], contribution: 0.11, unit: 'bar'  },
    ],
    analogues: [
      { site: 'Rotterdam, NL',   date: 'Mar 2024', outcome: 'Bearing replaced, 6h downtime',      daysToFailure: 1, match: 94 },
      { site: 'Whiting, USA',    date: 'Sep 2023', outcome: 'Catastrophic failure, 4d downtime',   daysToFailure: 2, match: 87 },
      { site: 'Ras Tanura, KSA', date: 'Jan 2024', outcome: 'Early replacement, 2h downtime',      daysToFailure: 3, match: 81 },
    ],
    time: '2m ago',
  },
  {
    id: 'ALT-002', severity: 'warning',
    title: 'Fouling Shutdown Risk — Heat Exchanger E-212',
    site: 'Houston, USA', details: 'VDU Train B · Efficiency -18%',
    failureMode: 'Shell-Side Fouling (Crude Deposit)',
    probability: 92, etfDays: 3, etfMin: 2, etfMax: 5, recommendation: 'inspect',
    shapSignals: [
      { name: 'Fouling Factor',  values: [0.8,0.9,1.0,1.2,1.5,1.8,2.1,2.5,2.9,3.3,3.6,3.9], contribution: 0.59, unit: 'm²K/W' },
      { name: 'Efficiency Loss', values: [4,5,6,7,9,11,12,13,15,16,17,18],                   contribution: 0.28, unit: '%'     },
      { name: 'Shell ΔT',        values: [18,19,20,21,23,24,25,26,27,28,29,30],               contribution: 0.13, unit: '°C'    },
    ],
    analogues: [
      { site: 'Gelsenkirchen, DE', date: 'Jun 2024', outcome: 'Chemical clean, 8h offline',   daysToFailure: 3, match: 91 },
      { site: 'Castellon, ES',     date: 'Nov 2023', outcome: 'Mechanical clean, 12h offline', daysToFailure: 4, match: 79 },
      { site: 'Cherry Point, USA', date: 'Feb 2024', outcome: 'Emergency clean, 24h offline',  daysToFailure: 2, match: 73 },
    ],
    time: '15m ago',
  },
  {
    id: 'ALT-003', severity: 'warning',
    title: 'Vibration Anomaly — Pump P-205',
    site: 'Houston, USA', details: 'CDU Train B · Impeller imbalance',
    failureMode: 'Impeller Cavitation / Imbalance',
    probability: 78, etfDays: 8, etfMin: 6, etfMax: 12, recommendation: 'monitor',
    shapSignals: [
      { name: 'Impeller BPF (65 Hz)', values: [0.8,0.9,1.0,1.1,1.3,1.5,1.6,1.7,1.8,1.9,2.1,2.2], contribution: 0.52, unit: 'mm/s' },
      { name: 'Sub-sync Vibration',   values: [0.2,0.3,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0,1.1,1.2], contribution: 0.31, unit: 'mm/s' },
      { name: 'Discharge Pressure',   values: [6.2,6.1,6.1,6.0,5.9,5.8,5.7,5.7,5.6,5.5,5.4,5.3], contribution: 0.17, unit: 'bar'  },
    ],
    analogues: [
      { site: 'Jamnagar, India', date: 'Aug 2024', outcome: 'Impeller trimmed, 4h downtime',   daysToFailure: 7,  match: 85 },
      { site: 'Ruwais, UAE',     date: 'Apr 2023', outcome: 'Bearings replaced, monitored',     daysToFailure: 10, match: 78 },
      { site: 'Houston, USA',    date: 'Dec 2023', outcome: 'Process adjustment resolved',       daysToFailure: 14, match: 71 },
    ],
    time: '1h ago',
  },
  {
    id: 'ALT-004', severity: 'advisory',
    title: 'Blade Erosion Detected — Turbine T-405',
    site: 'Ras Tanura, KSA', details: 'Power Gen Unit 3 · IR signature anomaly',
    failureMode: 'Compressor Blade Erosion (Stage 3)',
    probability: 72, etfDays: 14, etfMin: 10, etfMax: 21, recommendation: 'inspect',
    shapSignals: [
      { name: 'IR Blade Temp (Stage 3)', values: [680,685,691,698,705,712,719,726,733,740,746,751], contribution: 0.61, unit: '°C' },
      { name: 'Compressor Efficiency',   values: [88,87,87,86,86,85,85,84,83,83,82,82],             contribution: 0.24, unit: '%'  },
      { name: 'Acoustic Emission',       values: [12,13,13,14,15,16,17,18,19,21,23,25],              contribution: 0.15, unit: 'dB' },
    ],
    analogues: [
      { site: 'Rotterdam, NL',   date: 'Jan 2025', outcome: 'Blade cleaning, 12h offline',    daysToFailure: 12, match: 88 },
      { site: 'Ras Tanura, KSA', date: 'Jul 2023', outcome: 'Full overhaul, 5d offline',       daysToFailure: 11, match: 82 },
      { site: 'Whiting, USA',    date: 'Oct 2024', outcome: 'Borescope inspection, no action', daysToFailure: 18, match: 76 },
    ],
    time: '2h ago',
  },
];

// ── Live-data hooks ───────────────────────────────────────────────────────────
/** Map API AlertDetail → local AlertData, falling back to existing if fields missing */
function mapApiAlert(a: API.AlertDetail): AlertData {
  return {
    id: a.alert_code,
    severity: a.severity as AlertData['severity'],
    title: a.title,
    site: a.site_id,           // site name resolved server-side in future
    details: a.details ?? '',
    failureMode: a.failure_mode,
    probability: Math.round(a.probability * 100),
    etfDays: a.etf_days,
    etfMin: a.etf_min,
    etfMax: a.etf_max,
    recommendation: a.recommendation as AlertData['recommendation'],
    shapSignals: (a.shap_signals ?? []).map(s => ({
      name: s.signal_name,
      values: s.values as number[],
      contribution: s.contribution,
      unit: s.unit,
    })),
    analogues: (a.analogues ?? []).map(an => ({
      site: an.site_name,
      date: an.event_date,
      outcome: an.outcome,
      daysToFailure: an.days_to_failure,
      match: an.match_score,
    })),
    time: 'live',
  };
}

/** Fetch all alert details from the backend and merge with ALERT_DATA fallback */
function useApiAlerts(): AlertData[] {
  const [alerts, setAlerts] = useState<AlertData[]>(ALERT_DATA);
  useEffect(() => {
    API.fetchAlerts({ status: 'active' })
      .then(list =>
        Promise.all(list.map(a => API.fetchAlert(a.id)))
      )
      .then(details => {
        if (details.length > 0) setAlerts(details.map(mapApiAlert));
      })
      .catch(() => { /* keep hardcoded fallback */ });
  }, []);
  return alerts;
}

/** Fetch dashboard stats, returns null while loading */
function useApiDashboard() {
  const [data, setData] = useState<API.DashboardOut | null>(null);
  useEffect(() => {
    API.fetchDashboard().then(setData).catch(() => {});
  }, []);
  return data;
}

/** Fetch equipment list with hardcoded fallback */
const EQ_FALLBACK: API.Equipment[] = [
  { id: '1', tag: 'C-101', name: 'Centrifugal Compressor · MAN Turbomachinery Series-7', equipment_type: 'compressor', site_id: 'Ruwais, UAE',     health_score: 38, rul_hours: 48,   ai_status: 'critical' },
  { id: '2', tag: 'E-212', name: 'Shell & Tube Exchanger · Lummus 400v Series',           equipment_type: 'exchanger',  site_id: 'Houston, USA',     health_score: 52, rul_hours: 72,   ai_status: 'critical' },
  { id: '3', tag: 'P-205', name: 'Centrifugal Pump · KSB Multitec 100-8',                 equipment_type: 'pump',       site_id: 'Houston, USA',     health_score: 64, rul_hours: 192,  ai_status: 'warning'  },
  { id: '4', tag: 'T-405', name: 'Gas Turbine · GE Onsite-100A',                          equipment_type: 'turbine',    site_id: 'Ras Tanura, KSA',  health_score: 72, rul_hours: 336,  ai_status: 'warning'  },
  { id: '5', tag: 'K-302', name: 'Centrifugal Compressor · Siemens SGT-800',              equipment_type: 'compressor', site_id: 'Jamnagar, India',  health_score: 91, rul_hours: 1080, ai_status: 'healthy'  },
];
function useApiEquipment(): API.Equipment[] {
  const [equipment, setEquipment] = useState<API.Equipment[]>(EQ_FALLBACK);
  useEffect(() => {
    API.fetchEquipment()
      .then(list => { if (list.length > 0) setEquipment(list); })
      .catch(() => {});
  }, []);
  return equipment;
}

// ── A-01: SHAP Sparkline mini-chart ──────────────────────────────────────────
const ShapSparkline: React.FC<{ values: number[]; color: string }> = ({ values, color }) => {
  const W = 88, H = 28;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - 4 - ((v - min) / range) * (H - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const lastX = W;
  const lastY = H - 4 - ((values[values.length - 1] - min) / range) * (H - 8);
  return (
    <svg width={W} height={H} style={{ display: 'block', overflow: 'visible', flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity="0.75" />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
};

// ── A-01/02/03/04/06: Alert-to-Action Card ───────────────────────────────────
interface AlertCardProps {
  alert: AlertData;
  decision: AlertDecision;
  onAccept:  (id: string) => void;
  onModify:  (id: string, action: string, timing: string) => void;
  onOverride:(id: string, reason: string) => void;
  woNumber:  string;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, decision, onAccept, onModify, onOverride, woNumber }) => {
  const [showAnalogues, setShowAnalogues] = useState(false);
  const [overrideOpen,  setOverrideOpen]  = useState(false);
  const [modifyOpen,    setModifyOpen]    = useState(false);
  const [overrideReason, setOverrideReason] = useState(OVERRIDE_REASONS[0]);
  const [modifyAction,   setModifyAction]   = useState<'replace' | 'inspect' | 'monitor'>(alert.recommendation);
  const [modifyTiming,   setModifyTiming]   = useState('Within 24 hours');

  const sevColor  = SEV_COLOR[alert.severity];
  const sevBg     = SEV_BG[alert.severity];
  const sevBorder = SEV_BORDER[alert.severity];
  const rec       = RECOMMEND_STYLE[alert.recommendation];
  const isDone    = decision !== 'active';
  const shapColors = ['#a78bfa', '#60a5fa', '#34d399'];

  return (
    <div className={`rounded-xl border overflow-hidden transition-opacity ${isDone ? 'opacity-60' : ''}`}
         style={{ borderColor: sevBorder, background: sevBg }}>

      {/* Decision status banner */}
      {isDone && (
        <div className="flex items-center gap-2 px-5 py-2 text-xs font-semibold border-b" style={{ borderColor: sevBorder }}>
          {decision === 'accepted'   && <><span className="text-green-400">✓ ACCEPTED</span><span className="text-gray-500 mx-1">→</span><span className="text-gray-400">SAP WO created: {woNumber}</span></>}
          {decision === 'modified'   && <><span className="text-blue-400">✎ MODIFIED & ACCEPTED</span><span className="text-gray-500 mx-1">→</span><span className="text-gray-400">SAP WO: {woNumber}</span></>}
          {decision === 'overridden' && <><span className="text-gray-400">✕ OVERRIDDEN</span><span className="text-gray-500 ml-2">— reason logged as negative training example</span></>}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-2">
        <div className="flex items-start gap-3 min-w-0">
          <span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background:sevColor, boxShadow:`0 0 6px ${sevColor}`, flexShrink:0, marginTop:5 }} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: sevColor }}>{alert.severity}</span>
              <span className="text-gray-600 text-xs">·</span>
              <span className="text-gray-500 text-xs font-mono">{alert.id}</span>
            </div>
            <p className="text-white font-semibold text-sm leading-tight mt-0.5">{alert.title}</p>
            <p className="text-gray-400 text-xs mt-0.5">{alert.site} · {alert.details}</p>
          </div>
        </div>
        <span className="text-gray-600 text-xs whitespace-nowrap flex-shrink-0 pt-1">{alert.time}</span>
      </div>

      {/* A-01: Failure mode + probability + ETF */}
      <div className="px-5 pb-3 grid grid-cols-3 gap-3">
        <div className="bg-black/30 rounded-lg px-3 py-2">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Failure Mode</p>
          <p className="text-white text-xs font-semibold leading-snug">{alert.failureMode}</p>
        </div>
        <div className="bg-black/30 rounded-lg px-3 py-2">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Failure Probability</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width:`${alert.probability}%`, background:sevColor }} />
            </div>
            <span className="text-white text-sm font-bold">{alert.probability}%</span>
          </div>
        </div>
        <div className="bg-black/30 rounded-lg px-3 py-2">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Est. Time to Failure</p>
          <p className="text-white text-sm font-bold">{alert.etfDays}d</p>
          <p className="text-gray-500 text-xs">[{alert.etfMin}–{alert.etfMax}d, 80% CI]</p>
        </div>
      </div>

      {/* Recommendation badge */}
      <div className="px-5 pb-3">
        <span className="inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-lg" style={{ color:rec.color, background:rec.bg }}>
          {rec.label}
        </span>
      </div>

      {/* A-01: SHAP Evidence */}
      <div className="px-5 pb-4 border-t border-white/5 pt-3">
        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">SHAP Evidence — Top 3 Sensor Signals</p>
        <div className="space-y-2.5">
          {alert.shapSignals.map((sig, idx) => {
            const col = shapColors[idx];
            const pct = Math.round(sig.contribution * 100);
            const current = sig.values[sig.values.length - 1];
            return (
              <div key={sig.name} className="flex items-center gap-3">
                <div className="w-44 flex-shrink-0">
                  <p className="text-xs text-gray-300 leading-tight truncate">{sig.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width:`${pct}%`, background:col }} />
                    </div>
                    <span className="text-xs font-mono font-bold" style={{ color:col }}>{pct}%</span>
                  </div>
                </div>
                <ShapSparkline values={sig.values} color={col} />
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold font-mono" style={{ color:col }}>
                    {current > 100 ? current.toFixed(0) : current.toFixed(1)} {sig.unit}
                  </p>
                  <p className="text-gray-600 text-xs">now</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* A-02: Decision gate buttons */}
      {!isDone && !overrideOpen && !modifyOpen && (
        <div className="px-5 pb-4 flex items-center gap-2 flex-wrap border-t border-white/5 pt-3">
          <button onClick={() => onAccept(alert.id)}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-green-900/50 text-green-400 border border-green-800 hover:bg-green-800/60 transition-colors">
            ✓ Accept → SAP WO
          </button>
          <button onClick={() => setModifyOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-blue-900/30 text-blue-400 border border-blue-800 hover:bg-blue-800/40 transition-colors">
            ✎ Modify
          </button>
          <button onClick={() => setOverrideOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 transition-colors">
            ✕ Override
          </button>
          <button onClick={() => setShowAnalogues(v => !v)}
            className="ml-auto text-xs text-gray-500 hover:text-gray-300 transition-colors">
            {showAnalogues ? '▲' : '▼'} {alert.analogues.length} analogues
          </button>
        </div>
      )}

      {/* A-03: Override reason code */}
      {overrideOpen && !isDone && (
        <div className="px-5 pb-4 border-t border-white/5 pt-3">
          <p className="text-xs text-gray-400 font-semibold mb-2">Override Reason (required — recorded as negative training example)</p>
          <select value={overrideReason} onChange={e => setOverrideReason(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-2 mb-3 focus:outline-none focus:border-gray-500">
            {OVERRIDE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <button onClick={() => { onOverride(alert.id, overrideReason); setOverrideOpen(false); }}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 transition-colors">
              Confirm Override
            </button>
            <button onClick={() => setOverrideOpen(false)} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* A-04: Modify workflow */}
      {modifyOpen && !isDone && (
        <div className="px-5 pb-4 border-t border-white/5 pt-3">
          <p className="text-xs text-gray-400 font-semibold mb-2">Modify Recommendation</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Action</p>
              <select value={modifyAction} onChange={e => setModifyAction(e.target.value as 'replace' | 'inspect' | 'monitor')}
                className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-gray-500">
                <option value="replace">Replace Component</option>
                <option value="inspect">Inspect &amp; Assess</option>
                <option value="monitor">Monitor Closely</option>
              </select>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Timing</p>
              <select value={modifyTiming} onChange={e => setModifyTiming(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-gray-500">
                {['Within 4 hours','Within 24 hours','Within 48 hours','Within 7 days','Within 14 days','At next planned outage'].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { onModify(alert.id, modifyAction, modifyTiming); setModifyOpen(false); }}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-blue-900/40 text-blue-400 border border-blue-800 hover:bg-blue-800/50 transition-colors">
              ✓ Confirm &amp; Create SAP WO
            </button>
            <button onClick={() => setModifyOpen(false)} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* A-06: Historical Analogues */}
      {showAnalogues && (
        <div className="px-5 pb-4 border-t border-white/5 pt-3">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">Historical Analogues — Similar Failures in BP History</p>
          <div className="space-y-2">
            {alert.analogues.map((a, i) => (
              <div key={i} className="flex items-center justify-between bg-black/30 rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs text-white font-semibold">{a.site} · {a.date}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.outcome}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-xs font-bold" style={{ color: a.daysToFailure <= 3 ? '#ef4444' : '#f59e0b' }}>{a.daysToFailure}d to failure</p>
                  <p className="text-xs text-gray-500">{a.match}% match</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Equipment Row ─────────────────────────────────────────────────────────────
interface EquipmentRowProps {
  tag: string; name: string; site: string;
  health: number; rul: string;
  aiStatus: 'CRITICAL' | 'WARNING' | 'HEALTHY';
  action: string;
  onAction: () => void;
}
const STATUS_COLOR = { CRITICAL: '#ef4444', WARNING: '#f59e0b', HEALTHY: '#22c55e' };
const EquipmentRow: React.FC<EquipmentRowProps> = ({ tag, name, site, health, rul, aiStatus, action, onAction }) => (
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
      <button onClick={onAction} className="text-xs text-purple-400 border border-purple-800 px-3 py-1 rounded hover:bg-purple-900/30 transition-colors">{action}</button>
    </td>
  </tr>
);

// ── Action Modals (Dispatch / Schedule) ──────────────────────────────────────
interface ActionTarget { tag: string; name: string; equipmentId: string; siteId: string; }

const DispatchModal: React.FC<{ target: ActionTarget; onClose: () => void }> = ({ target, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [woNumber, setWoNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const handleDispatch = async () => {
    setLoading(true); setError(null);
    try {
      const wo = await API.createWorkOrder({ title: `Emergency: ${target.tag} — ${target.name}`, equipment_id: target.equipmentId, site_id: target.siteId, priority: 'critical', description: `AI-generated emergency dispatch. Asset in CRITICAL state — immediate intervention required.`, ai_generated: true });
      setWoNumber(wo.wo_number);
    } catch { setError('Failed to create work order. Please try again.'); setLoading(false); }
  };
  const overlay: React.CSSProperties = { position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center' };
  const card: React.CSSProperties    = { background:'#0f172a', border:'1px solid #7f1d1d', borderRadius:16, padding:'28px 32px', maxWidth:520, width:'90%', boxShadow:'0 0 60px #ef444433' };
  return (
    <div style={overlay}>
      <div style={card}>
        {woNumber ? (
          <>
            <p style={{ color:'#22c55e', fontSize:18, fontWeight:700, marginBottom:8 }}>✓ Work Order Dispatched</p>
            <p style={{ color:'#9ca3af', fontSize:13, marginBottom:8 }}>Emergency WO <span style={{ color:'#a78bfa', fontFamily:'monospace' }}>{woNumber}</span> created and dispatched to site crew.</p>
            <p style={{ color:'#9ca3af', fontSize:12, marginBottom:20 }}>Asset: <strong style={{ color:'#fff' }}>{target.tag} — {target.name}</strong></p>
            <button onClick={onClose} style={{ width:'100%', padding:'10px', borderRadius:8, background:'#15803d', border:'none', color:'#fff', cursor:'pointer', fontWeight:600, fontSize:13 }}>Close</button>
          </>
        ) : (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
              <div><p style={{ fontSize:10, color:'#ef4444', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:700, marginBottom:4 }}>Emergency Dispatch</p><p style={{ color:'#fff', fontSize:16, fontWeight:700 }}>{target.tag} — {target.name}</p></div>
              <button onClick={onClose} style={{ color:'#6b7280', fontSize:18, background:'none', border:'none', cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ background:'#1f2937', borderRadius:8, padding:'12px 14px', marginBottom:16 }}>
              <p style={{ color:'#f87171', fontSize:12, fontWeight:600, marginBottom:4 }}>⚠ CRITICAL — Immediate Action Required</p>
              <p style={{ color:'#9ca3af', fontSize:12 }}>An emergency work order will be created with <strong style={{ color:'#fff' }}>CRITICAL priority</strong> and dispatched to the on-site maintenance crew immediately.</p>
            </div>
            {error && <p style={{ color:'#f87171', fontSize:12, marginBottom:12 }}>{error}</p>}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={onClose} style={{ flex:1, padding:'10px', borderRadius:8, background:'#1f2937', border:'1px solid #374151', color:'#9ca3af', cursor:'pointer', fontSize:13 }}>Cancel</button>
              <button onClick={handleDispatch} disabled={loading} style={{ flex:2, padding:'10px', borderRadius:8, background: loading ? '#374151' : '#dc2626', border:'none', color:'#fff', cursor: loading ? 'wait' : 'pointer', fontWeight:600, fontSize:13 }}>{loading ? 'Dispatching…' : '⚡ Dispatch Now'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const SCHED_WINDOWS = ['Next 7 days', 'Next 14 days', 'Next TAR window'];

const ScheduleModal: React.FC<{ target: ActionTarget; onClose: () => void }> = ({ target, onClose }) => {
  const [windowIdx, setWindowIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [woNumber, setWoNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const handleSchedule = async () => {
    setLoading(true); setError(null);
    try {
      const wo = await API.createWorkOrder({ title: `Scheduled Maintenance: ${target.tag} — ${target.name}`, equipment_id: target.equipmentId, site_id: target.siteId, priority: 'high', description: `AI-recommended maintenance within ${SCHED_WINDOWS[windowIdx]}. Asset in WARNING state.`, ai_generated: true });
      setWoNumber(wo.wo_number);
    } catch { setError('Failed to create work order. Please try again.'); setLoading(false); }
  };
  const overlay: React.CSSProperties = { position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center' };
  const card: React.CSSProperties    = { background:'#0f172a', border:'1px solid #78350f', borderRadius:16, padding:'28px 32px', maxWidth:520, width:'90%', boxShadow:'0 0 60px #f59e0b33' };
  return (
    <div style={overlay}>
      <div style={card}>
        {woNumber ? (
          <>
            <p style={{ color:'#22c55e', fontSize:18, fontWeight:700, marginBottom:8 }}>✓ Maintenance Scheduled</p>
            <p style={{ color:'#9ca3af', fontSize:13, marginBottom:8 }}>Work order <span style={{ color:'#a78bfa', fontFamily:'monospace' }}>{woNumber}</span> scheduled for {SCHED_WINDOWS[windowIdx]}.</p>
            <p style={{ color:'#9ca3af', fontSize:12, marginBottom:20 }}>Asset: <strong style={{ color:'#fff' }}>{target.tag} — {target.name}</strong></p>
            <button onClick={onClose} style={{ width:'100%', padding:'10px', borderRadius:8, background:'#15803d', border:'none', color:'#fff', cursor:'pointer', fontWeight:600, fontSize:13 }}>Close</button>
          </>
        ) : (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
              <div><p style={{ fontSize:10, color:'#f59e0b', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:700, marginBottom:4 }}>Schedule Maintenance</p><p style={{ color:'#fff', fontSize:16, fontWeight:700 }}>{target.tag} — {target.name}</p></div>
              <button onClick={onClose} style={{ color:'#6b7280', fontSize:18, background:'none', border:'none', cursor:'pointer' }}>✕</button>
            </div>
            <p style={{ color:'#9ca3af', fontSize:12, marginBottom:14 }}>Select maintenance window:</p>
            <div style={{ display:'flex', gap:8, marginBottom:20 }}>
              {SCHED_WINDOWS.map((w, i) => (
                <button key={w} onClick={() => setWindowIdx(i)} style={{ flex:1, padding:'8px 6px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .15s', background: windowIdx === i ? '#78350f' : '#1f2937', border: windowIdx === i ? '1px solid #f59e0b' : '1px solid #374151', color: windowIdx === i ? '#fbbf24' : '#9ca3af' }}>{w}</button>
              ))}
            </div>
            {error && <p style={{ color:'#f87171', fontSize:12, marginBottom:12 }}>{error}</p>}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={onClose} style={{ flex:1, padding:'10px', borderRadius:8, background:'#1f2937', border:'1px solid #374151', color:'#9ca3af', cursor:'pointer', fontSize:13 }}>Cancel</button>
              <button onClick={handleSchedule} disabled={loading} style={{ flex:2, padding:'10px', borderRadius:8, background: loading ? '#374151' : '#d97706', border:'none', color:'#fff', cursor: loading ? 'wait' : 'pointer', fontWeight:600, fontSize:13 }}>{loading ? 'Scheduling…' : '📅 Schedule Maintenance'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

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
          <h3 className="text-white font-semibold text-sm">Failure Prediction Timeline — 90-Day Horizon</h3>
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
// ── Block F: Multi-Site Enterprise Intelligence ───────────────────────────────

// F-01/02/03/04: Site benchmark data
const SITE_BENCHMARK = [
  { site: 'Ras Tanura, KSA',  region:'MENA',  prod:410000, efficiency:94.2, energyInt:5.2, mCostBbl:0.38, aiScore:91, status:'healthy'  },
  { site: 'Jamnagar, India',  region:'APAC',  prod:280000, efficiency:91.7, energyInt:6.1, mCostBbl:0.42, aiScore:87, status:'healthy'  },
  { site: 'Rotterdam, NL',    region:'Europe',prod:195000, efficiency:88.3, energyInt:7.4, mCostBbl:0.61, aiScore:78, status:'warning'  },
  { site: 'Houston, USA',     region:'NAM',   prod:172000, efficiency:85.1, energyInt:8.2, mCostBbl:0.74, aiScore:72, status:'warning'  },
  { site: 'Ruwais, UAE',      region:'MENA',  prod:160000, efficiency:78.4, energyInt:9.8, mCostBbl:1.12, aiScore:61, status:'critical' },
];

// F-06: Enterprise reliability score trend (12-month rolling)
const ENT_RELIABILITY = [82,83,84,83,85,86,87,88,89,90,91,92];

const EnterpriseIntelligencePanel: React.FC = () => {
  const W = 480, H = 60, PL = 8, PR = 8;
  const cW = W - PL - PR;
  const minR = Math.min(...ENT_RELIABILITY) - 2;
  const maxR = Math.max(...ENT_RELIABILITY) + 2;
  const xR = (i: number) => PL + (i / (ENT_RELIABILITY.length - 1)) * cW;
  const yR = (v: number) => H - 8 - ((v - minR) / (maxR - minR)) * (H - 16);
  const relPts = ENT_RELIABILITY.map((v,i) => `${xR(i).toFixed(1)},${yR(v).toFixed(1)}`).join(' ');

  const statusColor = { healthy:'#22c55e', warning:'#f59e0b', critical:'#ef4444' };
  const sorted = [...SITE_BENCHMARK].sort((a,b) => b.aiScore - a.aiScore);

  return (
    <div className="space-y-4">
      {/* F-06: Enterprise reliability trend */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white font-semibold text-sm">Enterprise Reliability Score — 12-Month Trend</h3>
            <p className="text-gray-500 text-xs">Fleet-weighted average · Target ≥ 90</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-400">{ENT_RELIABILITY[ENT_RELIABILITY.length-1]}</p>
            <p className="text-gray-500 text-xs">Current score</p>
          </div>
        </div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height: H }}>
          <line x1={PL} y1={yR(90)} x2={W-PR} y2={yR(90)} stroke="#22c55e" strokeWidth="1" strokeDasharray="4,3" />
          <text x={W-PR+2} y={yR(90)+3} fill="#22c55e" fontSize="8">Target 90</text>
          <polyline points={relPts} fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinejoin="round" />
          {ENT_RELIABILITY.map((v,i) => (
            <circle key={i} cx={xR(i)} cy={yR(v)} r="3" fill={i === ENT_RELIABILITY.length-1 ? '#60a5fa' : '#60a5fa'} opacity={i === ENT_RELIABILITY.length-1 ? 1 : 0.4} />
          ))}
        </svg>
      </div>

      {/* F-01/02/03/04/05: Site comparison table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">Multi-Site Performance Benchmark</h3>
          <p className="text-gray-500 text-xs">Production efficiency · Energy intensity · Maintenance cost · AI adoption score</p>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-gray-800">
            {['Rank','Site','Region','Prod (BOPD)','Efficiency %','Energy Int (GJ/t)','Maint $/bbl','AI Score','Priority'].map(h => (
              <th key={h} className="px-3 py-2 text-left text-gray-500 uppercase tracking-wide font-semibold">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {sorted.map((s,i) => (
              <tr key={s.site} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                <td className="px-3 py-2 text-gray-500 font-mono">#{i+1}</td>
                <td className="px-3 py-2 text-white font-semibold">{s.site}</td>
                <td className="px-3 py-2 text-gray-400">{s.region}</td>
                <td className="px-3 py-2 text-white font-mono">{s.prod.toLocaleString()}</td>
                <td className="px-3 py-2">
                  <span className="font-mono font-bold" style={{ color: s.efficiency>=90 ? '#22c55e' : s.efficiency>=85 ? '#f59e0b' : '#ef4444' }}>{s.efficiency}%</span>
                </td>
                <td className="px-3 py-2">
                  <span className="font-mono" style={{ color: s.energyInt<=6 ? '#22c55e' : s.energyInt<=8 ? '#f59e0b' : '#ef4444' }}>{s.energyInt}</span>
                </td>
                <td className="px-3 py-2">
                  <span className="font-mono" style={{ color: s.mCostBbl<=0.5 ? '#22c55e' : s.mCostBbl<=0.8 ? '#f59e0b' : '#ef4444' }}>${s.mCostBbl.toFixed(2)}</span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full">
                      <div className="h-full rounded-full" style={{ width:`${s.aiScore}%`, background: statusColor[s.status as keyof typeof statusColor] }} />
                    </div>
                    <span className="font-mono font-bold" style={{ color: statusColor[s.status as keyof typeof statusColor] }}>{s.aiScore}</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  {s.status === 'critical' && <span className="text-xs bg-red-900/40 text-red-400 border border-red-800 rounded px-2 py-0.5 font-bold">PRIORITY</span>}
                  {s.status === 'warning'  && <span className="text-xs bg-amber-900/40 text-amber-400 border border-amber-800 rounded px-2 py-0.5">IMPROVE</span>}
                  {s.status === 'healthy'  && <span className="text-xs text-gray-600">Maintain</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DashboardTab: React.FC = () => {
  const dash = useApiDashboard();
  const s = dash?.stats;
  return (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KPICard label="Equipment Monitored"  value={s ? s.total_equipment.toLocaleString() : '6,842'}                     sub={s ? `${s.critical_count} critical · ${s.warning_count} warning` : '↑ 312 newly onboarded'}   accent="text-blue-400"   border="border-blue-900/50"   />
      <KPICard label="Active Alerts"        value={s ? String(s.active_alerts) : '14'}                                    sub={s ? `${s.open_work_orders} open work orders` : '↑ 3 from yesterday'}                           accent="text-orange-400" border="border-orange-900/50" />
      <KPICard label="Avoided Cost (USD)"   value={s ? `$${(s.avoided_cost_usd / 1e6).toFixed(1)}M` : '$2.4M'}           sub="AI-driven interventions YTD"                                                                    accent="text-green-400"  border="border-green-900/50"  />
      <KPICard label="Fleet OEE"            value={s ? `${s.fleet_oee_pct.toFixed(1)}%` : '94.7%'}                       sub="↑ Target: 95%"                                                                                  accent="text-purple-400" border="border-purple-900/50" />
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

    {/* BP Global Asset Map */}
    <BPAssetMap />

    {/* REQ-04 — Failure Prediction Gantt */}
    <FailurePredictionGantt />

    {/* REQ-10 — Multi-Site Benchmarking */}
    <MultiSiteBenchmark />

    {/* Block F — Enterprise Intelligence Panel */}
    <EnterpriseIntelligencePanel />

    {/* Block P — Cross-Domain Orchestration */}
    <CrossDomainPanel />
  </div>
  );
};

// ── Live Alerts Tab ───────────────────────────────────────────────────────────
const LiveAlertsTab: React.FC = () => {
  const liveAlerts = useApiAlerts();        // ← live data from backend
  const [decisions,  setDecisions]  = useState<Record<string, AlertDecision>>({});
  const [woNumbers,  setWoNumbers]  = useState<Record<string, string>>({});
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [pushNotifs, setPushNotifs] = useState<PushNotification[]>([]);
  const [showAudit,  setShowAudit]  = useState(false);

  // A-07: fire push banners when alerts load (probability > 80%)
  useEffect(() => {
    setPushNotifs(
      liveAlerts
        .filter(a => a.probability > 80)
        .map(a => ({ id: `push-${a.id}`, title: a.title, probability: a.probability, etfDays: a.etfDays, site: a.site, severity: a.severity }))
    );
  }, [liveAlerts]);

  const dismissNotif = useCallback((id: string) => {
    setPushNotifs(prev => prev.filter(n => n.id !== id));
  }, []);

  const genWO  = () => `WO-${Date.now().toString().slice(-6)}`;
  const nowStr = () => new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit' });

  const handleAccept = (id: string) => {
    const wo  = genWO();
    const alr = liveAlerts.find(a => a.id === id);
    setDecisions(p => ({ ...p, [id]: 'accepted' }));
    setWoNumbers(p => ({ ...p, [id]: wo }));
    setAuditTrail(p => [...p, { id:`AUD-${Date.now()}`, alertId:id, alertTitle: alr?.title ?? id, decision:'accepted',  timestamp:nowStr(), user:'Engineer A. Rahman', reasonCode:'',    woNumber:wo }]);
    // Persist decision to backend
    API.postDecision(id, { user_id: 'user-eng-ruw', decision: 'accepted', reason_code: '' }).catch(() => {});
  };

  const handleModify = (id: string, action: string, timing: string) => {
    const wo  = genWO();
    const alr = liveAlerts.find(a => a.id === id);
    setDecisions(p => ({ ...p, [id]: 'modified' }));
    setWoNumbers(p => ({ ...p, [id]: wo }));
    setAuditTrail(p => [...p, { id:`AUD-${Date.now()}`, alertId:id, alertTitle: alr?.title ?? id, decision:'modified',  timestamp:nowStr(), user:'Engineer A. Rahman', reasonCode:`${action} — ${timing}`, woNumber:wo }]);
    API.postDecision(id, { user_id: 'user-eng-ruw', decision: 'modified', modified_action: action, modified_timing: timing }).catch(() => {});
  };

  const handleOverride = (id: string, reason: string) => {
    const alr = liveAlerts.find(a => a.id === id);
    setDecisions(p => ({ ...p, [id]: 'overridden' }));
    setAuditTrail(p => [...p, { id:`AUD-${Date.now()}`, alertId:id, alertTitle: alr?.title ?? id, decision:'overridden', timestamp:nowStr(), user:'Engineer A. Rahman', reasonCode:reason, woNumber:'' }]);
    API.postDecision(id, { user_id: 'user-eng-ruw', decision: 'overridden', reason_code: reason }).catch(() => {});
  };

  const accepted   = auditTrail.filter(e => e.decision === 'accepted').length;
  const modified   = auditTrail.filter(e => e.decision === 'modified').length;
  const overridden = auditTrail.filter(e => e.decision === 'overridden').length;

  return (
    <div className="space-y-4">

      {/* A-07: Push notification banners */}
      {pushNotifs.length > 0 && (
        <div className="space-y-2">
          {pushNotifs.map(n => (
            <PushNotificationBanner key={n.id} notif={n} onDismiss={dismissNotif} />
          ))}
        </div>
      )}

      {/* KPI strip — live counters */}
      <div className="grid grid-cols-5 gap-3">
        {([
          [String(liveAlerts.filter(a => a.severity === 'critical').length), 'CRITICAL',      'text-red-400',    'border-red-900/50'   ],
          [String(liveAlerts.filter(a => a.severity === 'warning').length),  'WARNING',       'text-amber-400',  'border-amber-900/50' ],
          [String(liveAlerts.filter(a => a.severity === 'advisory').length), 'ADVISORY',      'text-blue-400',   'border-blue-900/50'  ],
          [String(accepted + modified),                                       'ACTIONED TODAY','text-green-400',  'border-green-900/50' ],
          [String(overridden),                                                'OVERRIDDEN',    'text-gray-400',   'border-gray-800'     ],
        ] as [string,string,string,string][]).map(([v,l,t,b]) => (
          <div key={l} className={`bg-gray-900 border ${b} rounded-xl p-4`}>
            <p className={`text-2xl font-bold ${t}`}>{v}</p>
            <p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      {/* A-08: Alert fatigue meter */}
      <AlertFatigueMeter total={liveAlerts.length} accepted={accepted} modified={modified} overridden={overridden} />

      {/* A-01/02/03/04/06: Alert-to-Action Cards */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold">Active Alerts — Alert-to-Action</h3>
            <p className="text-gray-500 text-xs">SHAP-explained predictions · Accept / Modify / Override · Tier 1 Human Safety Gate</p>
          </div>
          <span className="text-xs bg-purple-900/40 text-purple-400 px-2 py-1 rounded font-mono">LSTM + XGBOOST</span>
        </div>
        <div className="space-y-4">
          {liveAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              decision={decisions[alert.id] ?? 'active'}
              onAccept={handleAccept}
              onModify={handleModify}
              onOverride={handleOverride}
              woNumber={woNumbers[alert.id] ?? ''}
            />
          ))}
        </div>
      </div>

      {/* A-05: Audit Trail */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
          <div>
            <h3 className="text-white font-semibold text-sm">Alert-to-Action Audit Trail</h3>
            <p className="text-gray-500 text-xs">{auditTrail.length} decision{auditTrail.length !== 1 ? 's' : ''} logged · BSEE / HSE / EU AI Act compliant</p>
          </div>
          <button onClick={() => setShowAudit(v => !v)} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            {showAudit ? '▲ Hide' : '▼ Show'}
          </button>
        </div>
        {showAudit && (
          auditTrail.length === 0
            ? <p className="text-gray-600 text-xs text-center py-8">No decisions logged yet — accept, modify, or override an alert above to populate the trail</p>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Audit ID','Time','User','Alert','Decision','Reason / WO'].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-gray-500 font-semibold uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {auditTrail.map(entry => (
                      <tr key={entry.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="px-4 py-2 text-gray-600 font-mono">{entry.id.slice(-10)}</td>
                        <td className="px-4 py-2 text-gray-400 font-mono">{entry.timestamp}</td>
                        <td className="px-4 py-2 text-gray-300">{entry.user}</td>
                        <td className="px-4 py-2 text-gray-300 max-w-xs truncate">{entry.alertTitle.split('—')[0].trim()}</td>
                        <td className="px-4 py-2">
                          <span className={`font-bold ${entry.decision === 'accepted' ? 'text-green-400' : entry.decision === 'modified' ? 'text-blue-400' : 'text-gray-500'}`}>
                            {entry.decision.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-400 max-w-xs truncate">
                          {entry.woNumber
                            ? <span className="text-purple-400 font-mono">{entry.woNumber}</span>
                            : <span className="text-gray-500">{entry.reasonCode}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        )}
      </div>

      {/* REQ-12 — Anomaly Detection Heatmap (existing) */}
      <AnomalyHeatmap />

      {/* REQ-16 — Alert Escalation Matrix (existing) */}
      <EscalationMatrix />
    </div>
  );
};

// ── A-07: Push Notification Banner ───────────────────────────────────────────
interface PushNotification {
  id: string;
  title: string;
  probability: number;
  etfDays: number;
  site: string;
  severity: 'critical' | 'warning' | 'advisory';
}

const PushNotificationBanner: React.FC<{
  notif: PushNotification;
  onDismiss: (id: string) => void;
}> = ({ notif, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(notif.id), 8000);
    return () => clearTimeout(t);
  }, [notif.id, onDismiss]);

  const col = SEV_COLOR[notif.severity];
  return (
    <div className="flex items-start gap-3 rounded-xl p-4 border animate-pulse"
         style={{ background: SEV_BG[notif.severity], borderColor: SEV_BORDER[notif.severity] }}>
      <div className="w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0"
           style={{ background: `${col}22`, borderColor: col }}>
        <span style={{ fontSize: 14 }}>🔔</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: col }}>
          PUSH — {notif.probability}% PROBABILITY · ETF: {notif.etfDays}d
        </p>
        <p className="text-white text-sm font-semibold mt-0.5 leading-tight">{notif.title}</p>
        <p className="text-gray-400 text-xs mt-0.5">{notif.site} · Auto-dismisses in 8s</p>
      </div>
      <button onClick={() => onDismiss(notif.id)} className="text-gray-600 hover:text-gray-300 text-xl leading-none flex-shrink-0">×</button>
    </div>
  );
};

// ── A-08: Alert Fatigue Meter ─────────────────────────────────────────────────
interface AlertFatigueMeterProps {
  total: number;
  accepted: number;
  modified: number;
  overridden: number;
}

const AlertFatigueMeter: React.FC<AlertFatigueMeterProps> = ({ total, accepted, modified, overridden }) => {
  const actioned    = accepted + modified;
  const actionRate  = total > 0 ? Math.round((actioned    / total) * 100) : 0;
  const dismissRate = total > 0 ? Math.round((overridden  / total) * 100) : 0;
  const fatigued    = dismissRate > 40;
  return (
    <div className={`bg-gray-900 border rounded-xl p-5 ${fatigued ? 'border-red-900/60' : 'border-gray-800'}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-white font-semibold text-sm">Alert Fatigue Monitor</h3>
          <p className="text-gray-500 text-xs">Today · Engineer decision-rate tracking · flags if dismiss rate &gt;40%</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${fatigued ? 'bg-red-900/40 text-red-400 border-red-800' : 'bg-green-900/40 text-green-400 border-green-800'}`}>
          {fatigued ? '⚠ HIGH FATIGUE' : '✓ OK'}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {([['Total Alerts', total, 'text-gray-300'], ['Accepted', actioned, 'text-green-400'], ['Overridden', overridden, 'text-gray-400'], ['Pending', Math.max(0, total - actioned - overridden), 'text-amber-400']] as [string,number,string][]).map(([l, v, c]) => (
          <div key={l} className="bg-gray-800/50 rounded-lg px-3 py-2 text-center">
            <p className={`text-xl font-bold ${c}`}>{v}</p>
            <p className="text-gray-600 text-xs mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {([['Action Rate', actionRate, fatigued ? '#9ca3af' : '#22c55e', 'text-green-400'], ['Dismiss Rate', dismissRate, dismissRate > 40 ? '#ef4444' : '#9ca3af', dismissRate > 40 ? 'text-red-400' : 'text-gray-400']] as [string,number,string,string][]).map(([label, pct, barColor, textColor]) => (
          <div key={label} className="flex items-center gap-3">
            <p className="text-xs text-gray-500 w-24 flex-shrink-0">{label}</p>
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background: barColor }} />
            </div>
            <p className={`text-xs font-mono w-10 text-right ${textColor}`}>{pct}%</p>
          </div>
        ))}
      </div>
      {fatigued && (
        <p className="text-red-400 text-xs mt-3 bg-red-900/20 rounded-lg px-3 py-2">
          ⚠ Dismiss rate exceeds 40% — review alert sensitivity settings or model false-positive rate
        </p>
      )}
    </div>
  );
};

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
          <h4 className="text-white font-semibold text-sm">Risk Matrix (5×5) — Equipment Criticality</h4>
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

// ── Block E: Predictive Maintenance Enhancements ─────────────────────────────

// E-03: RUL confidence interval data per asset
const RUL_CONFIDENCE: Record<string, { low: number; mid: number; high: number; unit: string }> = {
  'C-101': { low: 36,  mid: 48,  high: 62,  unit: 'h' },
  'E-212': { low: 54,  mid: 72,  high: 96,  unit: 'h' },
  'P-205': { low: 5,   mid: 8,   high: 11,  unit: 'd' },
  'T-405': { low: 10,  mid: 14,  high: 19,  unit: 'd' },
  'K-302': { low: 38,  mid: 45,  high: 55,  unit: 'd' },
};

// E-04: Fleet-wide health heatmap (site vs asset class)
const FLEET_HEATMAP: { site: string; compressors: number; pumps: number; exchangers: number; turbines: number }[] = [
  { site: 'Ruwais, UAE',     compressors: 38, pumps: 76, exchangers: 82, turbines: 91 },
  { site: 'Houston, USA',    compressors: 72, pumps: 52, exchangers: 64, turbines: 88 },
  { site: 'Ras Tanura, KSA', compressors: 91, pumps: 89, exchangers: 94, turbines: 95 },
  { site: 'Jamnagar, India', compressors: 87, pumps: 83, exchangers: 78, turbines: 91 },
  { site: 'Rotterdam, NL',   compressors: 63, pumps: 71, exchangers: 69, turbines: 84 },
];

// E-01: Failure signature library
const FAILURE_SIGS = [
  { mode: 'Inner Race Bearing Fault', signals: ['Vibration 3× BPFI', 'Temp +12°C above baseline', 'Oil metallic particles ↑'], assets: ['C-101','C-204'], status: 'ACTIVE' },
  { mode: 'Pump Cavitation',          signals: ['Broadband vibration noise floor ↑', 'Flow pulsation >5%', 'Suction pressure variance'], assets: ['P-205','P-301'], status: 'ACTIVE' },
  { mode: 'Heat Exchanger Fouling',   signals: ['ΔP across tubes +18%', 'HTC degradation 15%/month', 'Outlet temp rising'], assets: ['E-212'], status: 'ACTIVE' },
  { mode: 'Turbine Blade Erosion',    signals: ['Exhaust temp spread >40°C', 'Efficiency drop 3%', 'Blade resonance peak'], assets: ['T-405'], status: 'MONITOR' },
];

// E-08: PM KPI scorecard
const PM_KPIS = [
  { kpi: 'Mean Time Between Failures',   value: '847h',   target: '720h',  trend: '+18%', ok: true },
  { kpi: 'Mean Time to Repair',          value: '6.2h',   target: '8h',    trend: '-22%', ok: true },
  { kpi: 'Planned Maintenance %',        value: '78%',    target: '85%',   trend: '+5pp', ok: false },
  { kpi: 'PdM Coverage (asset pool)',    value: '89%',    target: '95%',   trend: '+4pp', ok: false },
  { kpi: 'False Positive Rate',          value: '8.1%',   target: '<10%',  trend: '-1.4pp', ok: true },
  { kpi: 'Avoidable Downtime Prevented', value: '14,820h',target: '12,000h',trend: '+23%', ok: true },
];

const RulConfidenceBar: React.FC<{ assetId: string }> = ({ assetId }) => {
  const rul = RUL_CONFIDENCE[assetId];
  if (!rul) return null;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">RUL Confidence Interval — {assetId}</p>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden">
            <div className="absolute inset-y-0 rounded-full bg-indigo-900/50"
              style={{ left:`${(rul.low/rul.high)*100 - 10}%`, right:`${100-(rul.high/rul.high)*100}%` }} />
            <div className="absolute inset-y-0 w-1 bg-indigo-400 rounded"
              style={{ left: `${(rul.mid/rul.high)*100 - 1}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Pessimistic: {rul.low}{rul.unit}</span>
            <span className="text-indigo-400 font-bold">Median: {rul.mid}{rul.unit}</span>
            <span>Optimistic: {rul.high}{rul.unit}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-indigo-400 font-mono">{rul.mid}{rul.unit}</p>
          <p className="text-gray-500 text-xs">P50 RUL estimate</p>
        </div>
      </div>
    </div>
  );
};

const FleetHeatmap: React.FC = () => {
  const cols = ['compressors','pumps','exchangers','turbines'] as const;
  const heatColor = (v: number) => v >= 85 ? '#22c55e' : v >= 65 ? '#f59e0b' : '#ef4444';
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800">
        <h3 className="text-white font-semibold text-sm">Fleet-Wide Health Heatmap</h3>
        <p className="text-gray-500 text-xs">Average health index by site × asset class</p>
      </div>
      <table className="w-full text-xs">
        <thead><tr className="border-b border-gray-800">
          <th className="px-4 py-2 text-left text-gray-500 uppercase tracking-wide">Site</th>
          {cols.map(c => <th key={c} className="px-4 py-2 text-center text-gray-500 uppercase tracking-wide">{c}</th>)}
        </tr></thead>
        <tbody>
          {FLEET_HEATMAP.map(row => (
            <tr key={row.site} className="border-b border-gray-800/50">
              <td className="px-4 py-2 text-gray-300">{row.site}</td>
              {cols.map(c => {
                const v = row[c];
                return (
                  <td key={c} className="px-4 py-2 text-center">
                    <span className="inline-block rounded px-2 py-1 font-mono font-bold text-xs"
                      style={{ background: heatColor(v)+'22', color: heatColor(v) }}>{v}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Equipment Health Tab ──────────────────────────────────────────────────────
const EquipmentHealthTab: React.FC = () => {
  const [fftAsset,    setFftAsset]    = useState('C-101');
  const [healthAsset, setHealthAsset] = useState('C-101');
  const [actionTarget, setActionTarget] = useState<(ActionTarget & { type: 'dispatch' | 'schedule' }) | null>(null);
  const equipment = useApiEquipment();
  const healthy  = equipment.filter(e => e.ai_status === 'healthy').length;
  const warning  = equipment.filter(e => e.ai_status === 'warning').length;
  const critical = equipment.filter(e => e.ai_status === 'critical').length;
  return (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-3">
      <div className="bg-gray-900 border border-green-900/50 rounded-xl p-4"><p className="text-2xl font-bold text-green-400">{healthy.toLocaleString()}</p><p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">Healthy</p></div>
      <div className="bg-gray-900 border border-amber-900/50 rounded-xl p-4"><p className="text-2xl font-bold text-amber-400">{warning.toLocaleString()}</p><p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">Warning</p></div>
      <div className="bg-gray-900 border border-red-900/50 rounded-xl p-4"><p className="text-2xl font-bold text-red-400">{critical.toLocaleString()}</p><p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">Action Required</p></div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><p className="text-2xl font-bold text-white">{equipment.length.toLocaleString()}</p><p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">Total Assets</p></div>
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
          {equipment.map(e => {
            const status = e.ai_status.toUpperCase() as 'CRITICAL' | 'WARNING' | 'HEALTHY';
            const rul = e.rul_hours == null ? '—' : e.rul_hours < 24 ? `${e.rul_hours}h` : `${Math.round(e.rul_hours / 24)}d`;
            const action = status === 'CRITICAL' ? 'Dispatch' : status === 'WARNING' ? 'Schedule' : 'Monitor';
            return <EquipmentRow key={e.id} tag={e.tag} name={e.name} site={e.site_id} health={e.health_score} rul={rul} aiStatus={status} action={action}
              onAction={() => status !== 'HEALTHY' && setActionTarget({ type: status === 'CRITICAL' ? 'dispatch' : 'schedule', tag: e.tag, name: e.name, equipmentId: e.id, siteId: e.site_id })} />;
          })}
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
          <button key={id} onClick={() => setHealthAsset(id)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors font-mono ${healthAsset === id ? 'bg-indigo-900/50 text-indigo-300 border-indigo-700' : 'text-gray-500 border-gray-700 hover:border-gray-500'}`}>
            {id}
          </button>
        ))}
      </div>
      <HealthTrendPanel assetId={healthAsset} />
    </div>

    {/* REQ-17 — Oil Analysis & Lubrication Tracker */}
    <OilAnalysisPanel />

    {/* REQ-06 — Risk Matrix 5×5 */}
    <RiskMatrix5x5 />

    {/* E-03: RUL Confidence Interval */}
    <RulConfidenceBar assetId={healthAsset} />

    {/* E-04: Fleet Health Heatmap */}
    <FleetHeatmap />

    {/* E-01: Failure Signature Library */}
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800">
        <h3 className="text-white font-semibold text-sm">Multi-Modal Failure Signature Library</h3>
        <p className="text-gray-500 text-xs">Active failure modes matched across vibration, thermal, oil, and process signals</p>
      </div>
      <div className="divide-y divide-gray-800">
        {FAILURE_SIGS.map(f => (
          <div key={f.mode} className="px-5 py-4 flex items-start gap-4">
            <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded ${f.status==='ACTIVE'?'bg-red-900/40 text-red-400':'bg-amber-900/40 text-amber-400'}`}>{f.status}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold">{f.mode}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {f.signals.map(s => <span key={s} className="text-xs bg-gray-800 text-gray-400 rounded px-2 py-0.5">{s}</span>)}
              </div>
            </div>
            <div className="flex gap-1 flex-wrap justify-end">
              {f.assets.map(a => <span key={a} className="text-xs font-mono text-purple-400 bg-purple-900/20 border border-purple-800/30 rounded px-2 py-0.5">{a}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* E-08: PM KPI Scorecard */}
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800">
        <h3 className="text-white font-semibold text-sm">Predictive Maintenance KPI Scorecard</h3>
        <p className="text-gray-500 text-xs">Programme performance vs targets · Rolling 90-day period</p>
      </div>
      <div className="grid grid-cols-3 gap-0 divide-x divide-y divide-gray-800 border-t border-gray-800">
        {PM_KPIS.map(k => (
          <div key={k.kpi} className="px-4 py-3">
            <p className="text-gray-500 text-xs">{k.kpi}</p>
            <p className={`text-xl font-bold font-mono mt-0.5 ${k.ok ? 'text-green-400' : 'text-amber-400'}`}>{k.value}</p>
            <p className="text-gray-600 text-xs">Target: {k.target} · <span className={k.ok?'text-green-500':'text-amber-500'}>{k.trend}</span></p>
          </div>
        ))}
      </div>
    </div>
    {actionTarget?.type === 'dispatch' && <DispatchModal target={actionTarget} onClose={() => setActionTarget(null)} />}
    {actionTarget?.type === 'schedule' && <ScheduleModal target={actionTarget} onClose={() => setActionTarget(null)} />}
  </div>
  );
};

// ── Digital Twin Tab ──────────────────────────────────────────────────────────
// ── Block K: Digital Twin Enhancements ───────────────────────────────────────

// K-01: Multi-asset twin registry
const TWIN_ASSETS = [
  { id:'C-101', name:'Compressor C-101',        type:'Centrifugal Compressor', site:'Ruwais',  fidelity:'High', lastSync:'2s ago',   status:'critical' },
  { id:'T-405', name:'Gas Turbine T-405',        type:'Gas Turbine',           site:'Ras Tanura',fidelity:'High', lastSync:'5s ago',   status:'warning'  },
  { id:'E-212', name:'Shell & Tube E-212',       type:'Heat Exchanger',         site:'Houston', fidelity:'Medium',lastSync:'12s ago',  status:'warning'  },
  { id:'P-205', name:'Centrifugal Pump P-205',   type:'Process Pump',           site:'Houston', fidelity:'Medium',lastSync:'8s ago',   status:'warning'  },
];

// K-03: Scenario testing (what-if)
const TWIN_SCENARIOS = [
  { scenario:'Reduce speed to 3,000 RPM (-16%)', outcome:'Vibration drops to ~4.1 mm/s · RUL extends to ~72h', impact:'positive', runTime:'1.4s' },
  { scenario:'Increase lube oil pressure to 3.5 bar', outcome:'Bearing temp falls 6°C · Health index improves to 52', impact:'positive', runTime:'0.9s' },
  { scenario:'Continue at current operating point',   outcome:'Bearing failure probability 97.3% within 48h',     impact:'negative', runTime:'0.2s' },
];

// K-04: Operating envelope parameters
const OP_ENVELOPE: { param: string; current: number; normal_lo: number; normal_hi: number; unit: string }[] = [
  { param:'Speed',                current:3580, normal_lo:2800, normal_hi:3200, unit:'RPM'   },
  { param:'Bearing Temperature',  current:94,   normal_lo:50,   normal_hi:80,   unit:'°C'    },
  { param:'Vibration RMS',        current:8.4,  normal_lo:0,    normal_hi:4.5,  unit:'mm/s'  },
  { param:'Lube Oil Pressure',    current:2.1,  normal_lo:2.8,  normal_hi:4.0,  unit:'bar'   },
  { param:'Discharge Pressure',   current:18.4, normal_lo:16.0, normal_hi:22.0, unit:'bar'   },
  { param:'Motor Current',        current:142,  normal_lo:95,   normal_hi:110,  unit:'A'     },
];

const DigitalTwinEnhancementsPanel: React.FC = () => {
  const [twinAssets, setTwinAssets] = useState(TWIN_ASSETS);
  const [scenarios, setScenarios] = useState(TWIN_SCENARIOS);
  useEffect(() => {
    API.fetchDigitalTwinRegistry().then(list => {
      if (list.length > 0) setTwinAssets(list.map(a => ({
        id: a.equipment_id, name: `Twin — ${a.equipment_id}`, type: a.twin_type,
        site: 'N/A', fidelity: a.fidelity.charAt(0).toUpperCase() + a.fidelity.slice(1),
        lastSync: a.last_sync, status: a.status,
      })));
    }).catch(() => {});
    API.fetchScenarios().then(list => {
      if (list.length > 0) setScenarios(list.map(s => ({
        scenario: s.name,
        outcome: s.description ?? `RUL delta: ${(s.rul_delta_hours ?? 0).toFixed(0)}h`,
        impact: s.impact === 'positive' ? 'positive' : 'negative',
        runTime: '1.0s',
      })));
    }).catch(() => {});
  }, []);
  return (
  <div className="space-y-4">
    {/* K-01: Twin registry */}
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800">
        <h3 className="text-white font-semibold text-sm">Digital Twin Asset Registry</h3>
        <p className="text-gray-500 text-xs">Live fidelity status · Sync frequency · Physics-based models</p>
      </div>
      <div className="grid grid-cols-4 divide-x divide-gray-800">
        {twinAssets.map(a => {
          const sc = { critical:'border-t-red-500 text-red-400', warning:'border-t-amber-500 text-amber-400', healthy:'border-t-green-500 text-green-400' };
          return (
            <div key={a.id} className={`p-4 border-t-2 ${a.status==='critical'?'border-t-red-500':a.status==='warning'?'border-t-amber-500':'border-t-green-500'}`}>
              <p className="text-white font-mono font-bold text-sm">{a.id}</p>
              <p className="text-gray-400 text-xs">{a.type}</p>
              <p className="text-gray-600 text-xs">{a.site}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-xs font-semibold ${sc[a.status as keyof typeof sc]}`}>{a.status.toUpperCase()}</span>
                <span className="text-gray-600 text-xs">{a.lastSync}</span>
              </div>
              <div className="mt-1">
                <span className={`text-xs px-1.5 py-0.5 rounded ${a.fidelity==='High'?'bg-purple-900/40 text-purple-400':'bg-gray-800 text-gray-500'}`}>{a.fidelity} Fidelity</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* K-04: Operating envelope */}
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-white font-semibold text-sm mb-3">Operating Envelope — C-101 Compressor</h3>
      <div className="space-y-2.5">
        {OP_ENVELOPE.map(p => {
          const range = p.normal_hi - p.normal_lo;
          const pct = Math.max(0, Math.min(100, ((p.current - p.normal_lo) / range) * 100));
          const inRange = p.current >= p.normal_lo && p.current <= p.normal_hi;
          const color = inRange ? '#22c55e' : '#ef4444';
          return (
            <div key={p.param} className="flex items-center gap-3">
              <span className="text-gray-400 text-xs w-40 flex-shrink-0">{p.param}</span>
              <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 bg-green-900/20 rounded-full" />
                <div className="absolute h-full w-1 rounded" style={{ left:`${Math.max(0,Math.min(100,((p.current - p.normal_lo)/(p.normal_hi-p.normal_lo))*100))}%`, background:color }} />
              </div>
              <span className="font-mono text-xs w-24 text-right" style={{ color }}>{p.current} {p.unit}</span>
              <span className="text-gray-600 text-xs w-28 text-right">[{p.normal_lo}–{p.normal_hi}]</span>
            </div>
          );
        })}
      </div>
    </div>

    {/* K-03: Scenario testing */}
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800">
        <h3 className="text-white font-semibold text-sm">Scenario Testing — What-If Analysis</h3>
        <p className="text-gray-500 text-xs">Physics-based simulation · Real-time scenario evaluation</p>
      </div>
      <div className="divide-y divide-gray-800">
        {scenarios.map((s,i) => (
          <div key={i} className="px-5 py-4 flex items-start gap-4">
            <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded mt-0.5 ${s.impact==='positive'?'bg-green-900/40 text-green-400':'bg-red-900/40 text-red-400'}`}>SIM {i+1}</span>
            <div className="flex-1">
              <p className="text-white text-xs font-semibold">{s.scenario}</p>
              <p className="text-gray-400 text-xs mt-0.5">{s.outcome}</p>
            </div>
            <span className="text-gray-500 text-xs flex-shrink-0">{s.runTime}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};

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

    {/* Block K: Digital Twin Enhancements */}
    <DigitalTwinEnhancementsPanel />
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

      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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

// ── Block H: AI Governance & Model Lifecycle ─────────────────────────────────

// H-01: Model registry
const MODEL_REGISTRY = [
  { id:'MDL-001', name:'Bearing Fault LSTM',     version:'v3.2.1', status:'production', trainedOn:'01 Apr 2026', drift:'OK',      approval:'approved', champion:true  },
  { id:'MDL-002', name:'Heat Exchanger XGBoost', version:'v2.8.0', status:'production', trainedOn:'15 Mar 2026', drift:'WARNING', approval:'approved', champion:true  },
  { id:'MDL-003', name:'Pump Cavitation CNN',     version:'v1.4.2', status:'staging',   trainedOn:'08 Apr 2026', drift:'OK',      approval:'pending',  champion:false },
  { id:'MDL-004', name:'Turbine Efficiency GBM',  version:'v4.0.0', status:'production', trainedOn:'22 Feb 2026', drift:'OK',      approval:'approved', champion:true  },
  { id:'MDL-005', name:'Anomaly Isolation Forest',version:'v2.1.3', status:'retired',   trainedOn:'10 Jan 2026', drift:'CRITICAL',approval:'revoked',  champion:false },
];

// H-02: Drift detection metrics
const DRIFT_METRICS = [
  { model:'Bearing Fault LSTM',     featureDrift:0.04, conceptDrift:0.02, psiScore:0.08, alert:false },
  { model:'Heat Exchanger XGBoost', featureDrift:0.18, conceptDrift:0.11, psiScore:0.22, alert:true  },
  { model:'Turbine Efficiency GBM', featureDrift:0.06, conceptDrift:0.03, psiScore:0.09, alert:false },
];

// H-05: Bias detection
const BIAS_METRICS = [
  { group:'Offshore Platforms',     fpr:0.08, tpr:0.91, disparity:'low',    ok:true  },
  { group:'Onshore Refineries',     fpr:0.07, tpr:0.94, disparity:'low',    ok:true  },
  { group:'Small Assets (<50kW)',   fpr:0.14, tpr:0.82, disparity:'medium', ok:false },
  { group:'High-temp Environment',  fpr:0.09, tpr:0.88, disparity:'low',    ok:true  },
];

// ── Block I: SHAP Explainability ─────────────────────────────────────────────

// I-01: Global SHAP feature importance
const SHAP_GLOBAL = [
  { feature: 'Bearing Temp (°C)',     importance: 0.31, direction: 'positive' },
  { feature: 'Vibration RMS (mm/s)',  importance: 0.27, direction: 'positive' },
  { feature: 'Lube Oil Viscosity',    importance: 0.18, direction: 'negative' },
  { feature: 'Speed Delta (RPM)',     importance: 0.12, direction: 'positive' },
  { feature: 'Discharge Pressure',   importance: 0.07, direction: 'positive' },
  { feature: 'Oil Particle Count',   importance: 0.05, direction: 'positive' },
];

// I-02: Individual prediction SHAP waterfall (C-101 latest prediction)
const SHAP_WATERFALL = [
  { feature: 'Baseline',             value:  0.14, cumulative:  0.14, isBase:true },
  { feature: 'Bearing Temp +94°C',   value: +0.31, cumulative:  0.45, isBase:false },
  { feature: 'Vibration 8.4mm/s',    value: +0.27, cumulative:  0.72, isBase:false },
  { feature: 'Oil Visc low 38cSt',   value: +0.18, cumulative:  0.90, isBase:false },
  { feature: 'Speed 580 RPM over',   value: +0.07, cumulative:  0.97, isBase:false },
  { feature: 'Oil particles 28/mL',  value: +0.00, cumulative:  0.97, isBase:false },
];

// I-06: Counterfactuals
const COUNTERFACTUALS = [
  { scenario:'If bearing temp → 78°C',   probChange: -0.34, feasibility: 'achievable', action: 'Increase cooling water flow 15%' },
  { scenario:'If vibration → 4.2mm/s',   probChange: -0.22, feasibility: 'achievable', action: 'Balance rotor at next window' },
  { scenario:'If oil changed to spec',    probChange: -0.19, feasibility: 'immediate',  action: 'Emergency oil flush procedure' },
];

const AIGovernancePanel: React.FC = () => {
  const driftC = { OK:'text-green-400', WARNING:'text-amber-400', CRITICAL:'text-red-400' };
  const statusC = { production:'bg-green-900/40 text-green-400', staging:'bg-blue-900/40 text-blue-400', retired:'bg-gray-800 text-gray-500' };
  return (
    <div className="space-y-4">
      {/* H-01: Model Registry */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">AI Model Registry & Lifecycle</h3>
          <p className="text-gray-500 text-xs">Version tracking · Drift monitoring · Approval status</p>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-gray-800">
            {['ID','Model','Version','Status','Trained','Drift','Approval','Champion'].map(h => (
              <th key={h} className="px-3 py-2 text-left text-gray-500 uppercase tracking-wide font-semibold">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {MODEL_REGISTRY.map(m => (
              <tr key={m.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                <td className="px-3 py-2 text-purple-400 font-mono">{m.id}</td>
                <td className="px-3 py-2 text-white">{m.name}</td>
                <td className="px-3 py-2 text-gray-400 font-mono">{m.version}</td>
                <td className="px-3 py-2"><span className={`text-xs font-bold px-2 py-0.5 rounded ${statusC[m.status as keyof typeof statusC]}`}>{m.status.toUpperCase()}</span></td>
                <td className="px-3 py-2 text-gray-400">{m.trainedOn}</td>
                <td className="px-3 py-2 font-bold"><span className={driftC[m.drift as keyof typeof driftC]}>{m.drift}</span></td>
                <td className="px-3 py-2">
                  <span className={`text-xs ${m.approval==='approved'?'text-green-400':m.approval==='pending'?'text-amber-400':'text-red-400'}`}>{m.approval.toUpperCase()}</span>
                </td>
                <td className="px-3 py-2">{m.champion ? <span className="text-yellow-400">★ Yes</span> : <span className="text-gray-600">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* H-02: Drift Detection */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">Model Drift Detection</h3>
          <p className="text-gray-500 text-xs">PSI / Feature drift / Concept drift — alert threshold PSI &gt; 0.2</p>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-gray-800">
            {['Model','Feature Drift','Concept Drift','PSI Score','Status'].map(h => (
              <th key={h} className="px-4 py-2 text-left text-gray-500 uppercase tracking-wide font-semibold">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {DRIFT_METRICS.map(d => (
              <tr key={d.model} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                <td className="px-4 py-2 text-white">{d.model}</td>
                <td className="px-4 py-2 font-mono" style={{ color: d.featureDrift>0.15?'#f59e0b':'#4ade80' }}>{d.featureDrift.toFixed(2)}</td>
                <td className="px-4 py-2 font-mono" style={{ color: d.conceptDrift>0.10?'#f59e0b':'#4ade80' }}>{d.conceptDrift.toFixed(2)}</td>
                <td className="px-4 py-2 font-mono font-bold" style={{ color: d.psiScore>0.20?'#ef4444':d.psiScore>0.10?'#f59e0b':'#4ade80' }}>{d.psiScore.toFixed(2)}</td>
                <td className="px-4 py-2">{d.alert ? <span className="text-amber-400 font-bold">⚠ RETRAIN REQUIRED</span> : <span className="text-green-400">✓ Stable</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* H-05: Bias detection */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">Bias Detection by Equipment Group</h3>
          <p className="text-gray-500 text-xs">Equal opportunity check · FPR / TPR across asset segments</p>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-gray-800">
            {['Equipment Group','FPR','TPR','Disparity','Status'].map(h => (
              <th key={h} className="px-4 py-2 text-left text-gray-500 uppercase tracking-wide font-semibold">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {BIAS_METRICS.map(b => (
              <tr key={b.group} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                <td className="px-4 py-2 text-gray-300">{b.group}</td>
                <td className="px-4 py-2 font-mono text-white">{(b.fpr*100).toFixed(1)}%</td>
                <td className="px-4 py-2 font-mono text-white">{(b.tpr*100).toFixed(1)}%</td>
                <td className="px-4 py-2"><span className={`font-semibold ${b.disparity==='low'?'text-green-400':'text-amber-400'}`}>{b.disparity.toUpperCase()}</span></td>
                <td className="px-4 py-2">{b.ok ? <span className="text-green-400">✓ Pass</span> : <span className="text-amber-400">⚠ Review</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SHAPPanel: React.FC = () => {
  const maxI = Math.max(...SHAP_GLOBAL.map(f=>f.importance));
  return (
    <div className="space-y-4">
      {/* I-01: Global feature importance */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-3">Global SHAP Feature Importance — Bearing Fault LSTM</h3>
        <div className="space-y-2">
          {SHAP_GLOBAL.map(f => (
            <div key={f.feature} className="flex items-center gap-3">
              <span className="text-gray-400 text-xs w-44 flex-shrink-0">{f.feature}</span>
              <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width:`${(f.importance/maxI)*100}%`, background: f.direction==='positive'?'#3b82f6':'#f59e0b' }} />
              </div>
              <span className="text-white text-xs font-mono w-10 text-right">{(f.importance*100).toFixed(0)}%</span>
            </div>
          ))}
          <p className="text-gray-600 text-xs mt-1">Blue = pushes probability up · Orange = pushes probability down</p>
        </div>
      </div>

      {/* I-02: SHAP Waterfall for C-101 */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="mb-3">
          <h3 className="text-white font-semibold text-sm">SHAP Waterfall — C-101 Latest Prediction</h3>
          <p className="text-gray-500 text-xs">Individual feature contributions → failure probability {(SHAP_WATERFALL[SHAP_WATERFALL.length-1].cumulative*100).toFixed(0)}%</p>
        </div>
        <div className="space-y-1.5">
          {SHAP_WATERFALL.map((s,i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-40 flex-shrink-0">{s.feature}</span>
              <div className="flex-1 relative h-5 bg-gray-800 rounded">
                <div className="absolute inset-y-0 rounded" style={{
                  left: s.isBase ? '0%' : `${(SHAP_WATERFALL[i-1]?.cumulative??0)*85}%`,
                  width: `${Math.abs(s.value)*85}%`,
                  background: s.isBase ? '#6b7280' : s.value > 0 ? '#ef4444' : '#22c55e',
                }} />
              </div>
              <span className="text-xs font-mono w-16 text-right" style={{ color: s.isBase?'#9ca3af':s.value>0?'#f87171':'#4ade80' }}>
                {s.isBase ? `${(s.value*100).toFixed(0)}%` : `${s.value>=0?'+':''}${(s.value*100).toFixed(0)}%`}
              </span>
              <span className="text-xs font-mono text-gray-500 w-12 text-right">{(s.cumulative*100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* I-06: Counterfactuals */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">Counterfactual Explanations</h3>
          <p className="text-gray-500 text-xs">What would need to change to reduce failure probability?</p>
        </div>
        <div className="divide-y divide-gray-800">
          {COUNTERFACTUALS.map(c => (
            <div key={c.scenario} className="px-5 py-4 flex items-start gap-4">
              <div className="flex-1">
                <p className="text-white text-xs font-semibold">{c.scenario}</p>
                <p className="text-gray-500 text-xs mt-0.5">Action: {c.action}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-green-400 font-bold text-sm">{(c.probChange*100).toFixed(0)}%</p>
                <span className={`text-xs ${c.feasibility==='immediate'?'text-green-400':c.feasibility==='achievable'?'text-blue-400':'text-amber-400'}`}>{c.feasibility}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Block L: Continuous Learning Loop ────────────────────────────────────────

// L-01: Active learning queue (uncertain predictions sent for labelling)
const ACTIVE_LEARNING_QUEUE = [
  { id:'AL-2026-0441', asset:'K-302 Compressor', site:'Jamnagar', modelConf:0.51, predictedClass:'Bearing Fault', requestedBy:'LSTM v3.2.1', age:'2h' },
  { id:'AL-2026-0440', asset:'P-415 Pump',       site:'Rotterdam', modelConf:0.54, predictedClass:'Cavitation',   requestedBy:'CNN v1.4.2',   age:'4h' },
  { id:'AL-2026-0439', asset:'E-304 Exchanger',  site:'Houston',   modelConf:0.48, predictedClass:'Fouling',       requestedBy:'XGBoost v2.8', age:'6h' },
];

// L-02: Retraining pipeline status
const RETRAIN_PIPELINE = [
  { step:'Data collection',     status:'done',    detail:'12,840 new labeled events added',   elapsed:'2h 14m' },
  { step:'Feature engineering', status:'done',    detail:'48 features computed, 3 new added', elapsed:'22m'    },
  { step:'Model training',      status:'running', detail:'Epoch 47/100 · Loss: 0.082',         elapsed:'38m'    },
  { step:'Validation',          status:'pending', detail:'Hold-out set evaluation',             elapsed:'—'      },
  { step:'A/B shadow testing',  status:'pending', detail:'Parallel production shadow run',      elapsed:'—'      },
  { step:'Production promotion',status:'pending', detail:'Pending approval from ML Lead',       elapsed:'—'      },
];

// L-04: Performance history (8 model versions)
const MODEL_PERF_HISTORY = [
  { version:'v2.8', accuracy:89.1, f1:0.881 },
  { version:'v2.9', accuracy:90.4, f1:0.896 },
  { version:'v3.0', accuracy:91.8, f1:0.912 },
  { version:'v3.1', accuracy:92.3, f1:0.918 },
  { version:'v3.2', accuracy:94.7, f1:0.941 },
];

// L-05: Feedback integration log
const FEEDBACK_LOG = [
  { ts:'11 Apr 14:22', type:'override',  alert:'C-101 Bearing Alert', feedback:'Confirmed — Bearing replaced, failure verified', impact:'+0.4% recall' },
  { ts:'10 Apr 09:15', type:'override',  alert:'P-205 Cavitation',    feedback:'False alarm — Normal flow variation', impact:'-0.2% FPR'   },
  { ts:'09 Apr 16:40', type:'label',     alert:'AL-2026-0435 K-302',  feedback:'Expert labelled: No fault detected',  impact:'Queued for retrain' },
];

const ContinuousLearningPanel: React.FC = () => {
  const W = 400, H = 80, PL = 8, PR = 24;
  const cW = W - PL - PR;
  const accs = MODEL_PERF_HISTORY.map(p => p.accuracy);
  const minA = Math.min(...accs) - 2, maxA = Math.max(...accs) + 2;
  const xA = (i:number) => PL + (i/(accs.length-1))*cW;
  const yA = (v:number) => H - 8 - ((v-minA)/(maxA-minA))*(H-16);
  const accPts = accs.map((v,i) => `${xA(i).toFixed(1)},${yA(v).toFixed(1)}`).join(' ');

  const stepC = { done:'text-green-400', running:'text-blue-400', pending:'text-gray-600' };
  const stepDot = { done:'#22c55e', running:'#60a5fa', pending:'#374151' };

  return (
    <div className="space-y-4">
      {/* L-04: Performance history sparkline */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white font-semibold text-sm">Model Accuracy — Version History</h3>
            <p className="text-gray-500 text-xs">Bearing Fault LSTM continuous improvement trajectory</p>
          </div>
          <div className="text-right">
            <p className="text-green-400 font-bold text-xl">{accs[accs.length-1]}%</p>
            <p className="text-gray-500 text-xs">Latest ({MODEL_PERF_HISTORY[MODEL_PERF_HISTORY.length-1].version})</p>
          </div>
        </div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height:H }}>
          <polyline points={accPts} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinejoin="round" />
          {accs.map((v,i) => (
            <g key={i}>
              <circle cx={xA(i)} cy={yA(v)} r="4" fill={i===accs.length-1?'#a78bfa':'#7c3aed'} opacity={i===accs.length-1?1:0.6} />
              <text x={xA(i)} y={H-1} fill="#4b5563" fontSize="8" textAnchor="middle">{MODEL_PERF_HISTORY[i].version}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* L-02: Retraining pipeline */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-3">Retraining Pipeline — Bearing Fault LSTM</h3>
        <div className="space-y-3">
          {RETRAIN_PIPELINE.map((s,i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5" style={{ background:stepDot[s.status as keyof typeof stepDot] }} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-xs font-semibold ${stepC[s.status as keyof typeof stepC]}`}>{s.step}</p>
                  {s.status === 'running' && <span className="text-xs bg-blue-900/40 text-blue-400 rounded px-1.5 py-0.5 animate-pulse">RUNNING</span>}
                </div>
                <p className="text-gray-500 text-xs">{s.detail}</p>
              </div>
              <span className="text-gray-600 text-xs flex-shrink-0">{s.elapsed}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* L-01: Active learning queue */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <h3 className="text-white font-semibold text-sm">Active Learning Queue</h3>
            <p className="text-gray-500 text-xs">Low-confidence predictions awaiting expert labelling</p>
          </div>
          <div className="divide-y divide-gray-800">
            {ACTIVE_LEARNING_QUEUE.map(q => (
              <div key={q.id} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-white text-xs font-semibold">{q.asset} <span className="text-gray-500">· {q.site}</span></p>
                  <p className="text-gray-500 text-xs">{q.predictedClass} · Conf: <span className="text-amber-400 font-bold">{Math.round(q.modelConf*100)}%</span></p>
                </div>
                <span className="text-gray-600 text-xs flex-shrink-0">{q.age}</span>
              </div>
            ))}
          </div>
        </div>

        {/* L-05: Feedback integration log */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <h3 className="text-white font-semibold text-sm">Feedback Integration Log</h3>
            <p className="text-gray-500 text-xs">Override / label feedback → model improvement</p>
          </div>
          <div className="divide-y divide-gray-800">
            {FEEDBACK_LOG.map((f,i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-white text-xs font-semibold">{f.alert}</p>
                  <span className={`text-xs ${f.type==='override'?'text-amber-400':'text-blue-400'}`}>{f.type}</span>
                </div>
                <p className="text-gray-500 text-xs">{f.feedback}</p>
                <p className="text-green-400 text-xs font-semibold">{f.impact} · {f.ts}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MLModelsTab: React.FC = () => {
  const [liveModels, setLiveModels] = useState<API.MLModel[]>([]);
  useEffect(() => {
    API.fetchMLModels().then(list => { if (list.length > 0) setLiveModels(list); }).catch(() => {});
  }, []);
  const activeCount = liveModels.length > 0 ? liveModels.filter(m => m.status === 'production' || m.is_champion).length : 6;
  const avgAccuracy = liveModels.length > 0
    ? (liveModels.reduce((sum, m) => sum + (m.accuracy > 1 ? m.accuracy : m.accuracy * 100), 0) / liveModels.length).toFixed(1) + '%'
    : '94.7%';
  return (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-3">
      {[
        [String(activeCount), 'ACTIVE MODELS',    'text-purple-400', 'border-purple-900/50'],
        [avgAccuracy,          'AVG ACCURACY',      'text-green-400',  'border-green-900/50'],
        ['6,842',              'ASSETS MONITORED',  'text-blue-400',   'border-blue-900/50'],
        ['143K',               'TRAINING RECORDS',  'text-white',      'border-gray-800'],
      ].map(([v,l,t,b]) => (
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

    {/* Block H: AI Governance */}
    <AIGovernancePanel />

    {/* Block I: SHAP Explainability */}
    <SHAPPanel />

    {/* Block L: Continuous Learning Loop */}
    <ContinuousLearningPanel />

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
};

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

const SparePartsTab: React.FC = () => {
  const [parts,  setParts]  = useState(SPARE_PARTS);
  useEffect(() => {
    Promise.all([API.fetchSpareParts(), API.fetchStock()])
      .then(([apiParts, apiStock]) => {
        if (apiParts.length === 0) return;
        const stockMap = Object.fromEntries(apiStock.map(s => [s.part_id, s]));
        setParts(apiParts.map(p => {
          const s = stockMap[p.id];
          const onHand = s?.on_hand_qty ?? 0;
          const minQty = s?.min_qty ?? 1;
          const onOrder = s?.on_order_qty ?? 0;
          const status  = onHand === 0 ? 'critical' : onHand < minQty ? 'low' : 'ok';
          return { part: p.description, equipment: p.part_number, stock: onHand, min: minQty, ordered: onOrder, cost: p.unit_cost, status, urgency: onHand === 0 ? `${p.lead_time_days}d` : '—', supplier: '—' };
        }));
      })
      .catch(() => {});
  }, []);
  const critical   = parts.filter(p => p.status === 'critical').length;
  const low        = parts.filter(p => p.status === 'low').length;
  const orderValue = parts.reduce((sum, p) => sum + (p.ordered * p.cost), 0);
  return (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-3">
      <div className="bg-gray-900 border border-red-900/50   rounded-xl p-4"><p className="text-2xl font-bold text-red-400"  >{critical}</p><p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">Critical Low Stock</p></div>
      <div className="bg-gray-900 border border-amber-900/50 rounded-xl p-4"><p className="text-2xl font-bold text-amber-400">{low}</p><p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">Low Stock Items</p></div>
      <div className="bg-gray-900 border border-blue-900/50  rounded-xl p-4"><p className="text-2xl font-bold text-blue-400" >{orderValue > 0 ? `$${Math.round(orderValue / 1000)}K` : '$284K'}</p><p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">Open Order Value</p></div>
      <div className="bg-gray-900 border border-green-900/50 rounded-xl p-4"><p className="text-2xl font-bold text-green-400">$6.8M</p><p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">Downtime Avoided</p></div>
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
};

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

// ── B-03: Spare parts availability lookup ─────────────────────────────────────
const SAP_PARTS_AVAIL: Record<string, { partNo: string; qty: number; min: number; status: 'available' | 'low' | 'zero' }> = {
  'C-101': { partNo: '7B-2241-ZZ', qty: 2, min: 2, status: 'available' },
  'E-212': { partNo: 'HX-SEAL-884', qty: 0, min: 1, status: 'zero' },
  'P-205': { partNo: 'IMP-P205-TR', qty: 1, min: 2, status: 'low'   },
  'T-405': { partNo: 'BLD-T405-S3', qty: 4, min: 2, status: 'available' },
};

// ── B-01/02/05: SAP Integration Panel ────────────────────────────────────────
interface SapRecord {
  type: 'IW21' | 'IW31' | 'MMMR';
  id: string;
  desc: string;
  asset: string;
  time: string;
  s4Ready: boolean;
}
interface SAPIntegrationPanelProps {
  records: SapRecord[];
  totalAlerts: number;
}
const SAPIntegrationPanel: React.FC<SAPIntegrationPanelProps> = ({ records, totalAlerts }) => {
  const iw21  = records.filter(r => r.type === 'IW21').length;
  const iw31  = records.filter(r => r.type === 'IW31').length;
  const mmmr  = records.filter(r => r.type === 'MMMR').length;
  const autoRate = totalAlerts > 0 ? Math.round(((iw21) / totalAlerts) * 100) : 0;
  const s4Ready  = records.filter(r => r.s4Ready).length;
  return (
    <div className="bg-gray-900 border border-blue-900/40 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm">SAP PM / MM Integration</h3>
          <p className="text-gray-500 text-xs">Live BAPI simulation · IW21 · IW31 · MM reservations · S/4HANA migration ready</p>
        </div>
        <span className="text-xs bg-blue-900/30 text-blue-400 border border-blue-800 px-3 py-1 rounded font-mono">SAP ECC → S/4HANA</span>
      </div>
      {/* B-05: Automation rate KPI */}
      <div className="grid grid-cols-5 gap-3 p-5 border-b border-gray-800">
        {([
          ['IW21 Notifications', String(iw21), 'text-purple-400', 'Notification creation'],
          ['IW31 Work Orders',   String(iw31), 'text-blue-400',   'Order auto-generated'],
          ['MM Reservations',    String(mmmr), 'text-green-400',  'Material reserved'],
          ['S/4HANA Ready',      String(s4Ready), 'text-cyan-400','ODATA-aligned WOs'],
          ['Automation Rate',    `${autoRate}%`, autoRate >= 85 ? 'text-green-400' : 'text-amber-400', 'Target: >85%'],
        ] as [string,string,string,string][]).map(([l,v,c,sub]) => (
          <div key={l} className="bg-gray-800/50 rounded-lg px-3 py-3 text-center">
            <p className={`text-xl font-bold ${c}`}>{v}</p>
            <p className="text-gray-500 text-xs mt-0.5 uppercase tracking-wide">{l}</p>
            <p className="text-gray-600 text-xs mt-0.5">{sub}</p>
          </div>
        ))}
      </div>
      {/* SAP action log */}
      {records.length === 0 ? (
        <p className="text-gray-600 text-xs text-center py-6">No SAP actions yet — approve a work order above to trigger BAPI integration</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-gray-800">
              {['BAPI','SAP Object ID','Description','Asset','Time','S/4HANA'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-gray-500 uppercase tracking-wide font-semibold">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                  <td className="px-4 py-2"><span className="font-mono font-bold text-blue-400">{r.type}</span></td>
                  <td className="px-4 py-2 text-purple-400 font-mono">{r.id}</td>
                  <td className="px-4 py-2 text-gray-300">{r.desc}</td>
                  <td className="px-4 py-2 text-gray-400">{r.asset}</td>
                  <td className="px-4 py-2 text-gray-500">{r.time}</td>
                  <td className="px-4 py-2">
                    {r.s4Ready
                      ? <span className="text-cyan-400 font-semibold">✓ ODATA</span>
                      : <span className="text-gray-600">Legacy</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

function mapApiWO(w: API.WorkOrder): WO {
  const priorityMap: Record<string, WO['priority']> = { emergency: 'EMERGENCY', high: 'HIGH', medium: 'MEDIUM', low: 'LOW' };
  const statusMap:   Record<string, WO['status']>   = { open: 'Open', in_progress: 'In Progress', scheduled: 'Scheduled', completed: 'Completed' };
  return {
    id:          w.wo_number,
    equipment:   w.title,
    site:        w.site_id,
    priority:    priorityMap[w.priority?.toLowerCase() ?? 'medium'] ?? 'MEDIUM',
    status:      statusMap[w.status?.toLowerCase() ?? 'open'] ?? 'Open',
    cost:        w.cost_estimate != null ? `$${w.cost_estimate.toLocaleString()}` : '—',
    due:         w.due_date ? new Date(w.due_date).toLocaleDateString('en-GB') : '—',
    aiGenerated: w.ai_generated,
  };
}

const WorkOrdersTab: React.FC = () => {
  const [wos, setWos] = useState<WO[]>(INITIAL_WOS);
  const [toast, setToast] = useState<string | null>(null);
  const [prCounter, setPrCounter] = useState(1);
  // B-01/02/04: SAP BAPI records
  const [sapRecords, setSapRecords] = useState<SapRecord[]>([]);

  useEffect(() => {
    API.fetchWorkOrders()
      .then(list => { if (list.length > 0) setWos(list.map(mapApiWO)); })
      .catch(() => {});
  }, []);

  const featuredWO = wos.find(w => w.priority === 'EMERGENCY' && w.status === 'Open') ?? null;

  const handleApprove = (wo: WO) => {
    const prId  = `PR-2026-${String(prCounter).padStart(4, '0')}`;
    const nowT  = new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    const notifId = `N-${Date.now().toString().slice(-6)}`;
    const woSapId = `WO-SAP-${Date.now().toString().slice(-5)}`;
    const mmrId   = `MR-${Date.now().toString().slice(-5)}`;
    const assetTag = wo.equipment.split(' ')[0];
    setPrCounter(c => c + 1);
    setWos(prev => [
      ...prev.map(w => w.id === wo.id ? { ...w, status: 'In Progress' as const } : w),
      { id: prId, equipment: `${wo.equipment} [PR: Parts & Services]`, site: wo.site, priority: wo.priority, status: 'Completed' as const, cost: wo.cost, due: '—', isPR: true },
    ]);
    // B-01 IW21, B-02 IW31, B-04 MM reservation
    setSapRecords(prev => [
      ...prev,
      { type: 'IW21', id: notifId, desc: `PM Notification — ${wo.equipment}`, asset: assetTag, time: nowT, s4Ready: true },
      { type: 'IW31', id: woSapId, desc: `Work Order — Bearing Replacement`,  asset: assetTag, time: nowT, s4Ready: true },
      { type: 'MMMR', id: mmrId,   desc: `Material Reservation — Bearing Set`, asset: assetTag, time: nowT, s4Ready: true },
    ]);
    setToast(`✓ ${wo.id} dispatched — IW21 ${notifId} · IW31 ${woSapId} · MM ${mmrId} created`);
    setTimeout(() => setToast(null), 5000);
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
              {/* B-03: SAP MM spare parts availability */}
              {(() => {
                const assetTag = featuredWO.equipment.split(' ')[0];
                const partAvail = SAP_PARTS_AVAIL[assetTag];
                if (!partAvail) return null;
                const col = partAvail.status === 'available' ? '#22c55e' : partAvail.status === 'low' ? '#f59e0b' : '#ef4444';
                const label = partAvail.status === 'available' ? '✓ IN STOCK' : partAvail.status === 'low' ? '⚠ LOW STOCK' : '✕ ZERO STOCK';
                return (
                  <div className="rounded-lg p-3 mb-3 border" style={{ background:`${col}11`, borderColor:`${col}44` }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: col }}>SAP MM — Parts Availability Check</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Part No: {partAvail.partNo}</span>
                      <span className="font-bold" style={{ color: col }}>{label} ({partAvail.qty} on-hand)</span>
                    </div>
                  </div>
                );
              })()}
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

      {/* B-01/02/04/05/07: SAP Integration Panel */}
      <SAPIntegrationPanel records={sapRecords} totalAlerts={4} />

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
                    {/* B-07: S/4HANA badge */}
                    <span className="ml-1 text-xs text-cyan-600/70 font-mono">S/4</span>
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

const ROITab: React.FC = () => {
  const [kpi, setKpi] = useState<API.KpiSnapshot | null>(null);
  useEffect(() => {
    API.fetchKPIs('fleet')
      .then(list => { if (list.length > 0) setKpi(list[0]); })
      .catch(() => {});
  }, []);
  const mtbf = kpi?.mtbf_hours != null ? `${Math.round(kpi.mtbf_hours).toLocaleString()} h` : '1,173 h';
  const mttr = kpi?.mttr_hours != null ? `${kpi.mttr_hours.toFixed(2)} h` : '4.68 h';
  const oee  = kpi?.oee_pct    != null ? `${kpi.oee_pct.toFixed(1)} %`   : '81.4 %';
  return (
  <div className="space-y-4">

    {/* REQ-05 — MTBF / MTTR / OEE */}
    <div className="bg-gray-900 border border-blue-900/40 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <div>
          <h3 className="text-white font-semibold text-sm">Reliability KPIs — MTBF / MTTR / OEE</h3>
          <p className="text-gray-500 text-xs mt-0.5">Fleet-wide · ISO 55001 aligned · Rolling 12-month average</p>
        </div>
        <span className="text-xs bg-blue-900/30 text-blue-400 border border-blue-900/50 px-3 py-1 rounded-full">YTD 2026</span>
      </div>

      {/* Fleet KPIs */}
      <div className="grid grid-cols-3 divide-x divide-gray-800 border-b border-gray-800">
        {[
          ['MTBF', mtbf, 'Mean Time Between Failures', '↑ +148h vs last year', 'text-blue-400'],
          ['MTTR', mttr, 'Mean Time To Repair', '↓ −1.2h vs last year', 'text-green-400'],
          ['OEE',  oee,  'Overall Equipment Effectiveness', '↑ +3.8% vs last year', 'text-purple-400'],
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
};

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
      <h3 className="text-white font-semibold text-sm">Alert Escalation Matrix</h3>
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
        <h3 className="text-white font-semibold text-sm">Anomaly Detection Heatmap</h3>
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
          <h3 className="text-white font-semibold text-sm">Multi-Site Benchmarking</h3>
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
            <span className={`text-xs font-semibold w-14 text-right ${s.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
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
          <h3 className="text-white font-semibold text-sm">AI Feedback Loop & Accuracy Tracker</h3>
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
        <h3 className="text-white font-semibold text-sm">Contractor & Crew Planner</h3>
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
      <h3 className="text-white font-semibold text-sm">Root Cause Analysis — C-101 Bearing Failure</h3>
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
          <h3 className="text-white font-semibold text-sm">Maintenance Budget vs Actuals ($M)</h3>
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
      <h3 className="text-white font-semibold text-sm">Spare Parts Criticality Matrix</h3>
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
        <h3 className="text-white font-semibold text-sm">Oil Analysis & Lubrication Tracker</h3>
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
              {(['visc','ferrous','water','tbn'] as const).map(col => (
                <td key={col} className="py-3 px-4">
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: `${OIL_PARAM_COL[s[col]] ?? '#9ca3af'}22`, color: OIL_PARAM_COL[s[col]] ?? '#9ca3af' }}>{s[col]}</span>
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
          <h4 className="text-white font-semibold text-sm">Health Trend & Degradation Forecast — {assetId}</h4>
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

// ── Block N: Regulatory Compliance Enhancements ───────────────────────────────

// N-01: Evidence document tracking
const EVIDENCE_DOCS = [
  { docId:'EV-API510-2026-01', regulation:'API 510', site:'Ruwais',    doc:'Annual inspection report + UT thickness data', uploaded:'10 Apr 2026', status:'verified' },
  { docId:'EV-PSM-2026-04',    regulation:'PSM',     site:'Whiting',   doc:'Process Hazard Analysis (PHA) revalidation',  uploaded:'02 Apr 2026', status:'verified' },
  { docId:'EV-ISO45001-Q1',    regulation:'ISO 45001',site:'All Sites', doc:'Q1 2026 Safety KPI report + incident log',    uploaded:'01 Apr 2026', status:'pending'  },
  { docId:'EV-API570-HOU-01',  regulation:'API 570', site:'Houston',   doc:'Corrosion under insulation (CUI) survey',     uploaded:'—',           status:'missing'  },
];

// N-02: Regulatory change tracker
const REG_CHANGES = [
  { reg:'API RP 580 Rev 4',      effective:'01 Jul 2026', impact:'Risk-Based Inspection scope expanded to include offshore risers', action:'Update RBI programme by 30 Jun', status:'in-progress' },
  { reg:'EU Industrial Emissions',effective:'01 Jan 2027', impact:'NOx/SOx limits tightened 20% at Rotterdam refinery',           action:'Upgrade SCR units Q3 2026',     status:'planned'     },
  { reg:'OSHA PSM Modernisation',effective:'01 Sep 2026', impact:'Enhanced safeguards for highly hazardous chemicals',           action:'PSM revalidation required',      status:'not-started' },
];

// N-04: AI-generated compliance checklist
const AI_CHECKLIST = [
  { item:'API 570 piping inspection overdue — Bureau Veritas booking needed',     priority:'critical', status:'open',  owner:'Maintenance Lead Houston' },
  { item:'ISO 45001 Q1 evidence upload incomplete — safety KPI doc missing',      priority:'high',     status:'open',  owner:'HSSE Manager' },
  { item:'ASME B31.3 Ras Tanura — 13 days overdue — escalate to Engineering VP',  priority:'critical', status:'open',  owner:'VP Engineering MENA' },
  { item:'API 580 RBI programme review required before Jul 2026 deadline',         priority:'medium',   status:'in-progress', owner:'Reliability Engineer' },
];

const ComplianceEnhancementsPanel: React.FC = () => (
  <div className="space-y-4">
    {/* N-04: AI compliance checklist */}
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm">AI-Generated Compliance Action List</h3>
          <p className="text-gray-500 text-xs">Proactive AI monitoring · Auto-generated actions from regulation changes + deadlines</p>
        </div>
        <span className="text-xs bg-red-900/40 text-red-400 border border-red-800 rounded px-2 py-1 font-bold">
          {AI_CHECKLIST.filter(i=>i.priority==='critical').length} CRITICAL OPEN
        </span>
      </div>
      <div className="divide-y divide-gray-800">
        {AI_CHECKLIST.map((c,i) => {
          const pc = { critical:'text-red-400 bg-red-900/40', high:'text-amber-400 bg-amber-900/30', medium:'text-blue-400 bg-blue-900/30' };
          const sc = { open:'text-red-400', 'in-progress':'text-amber-400', closed:'text-green-400' };
          return (
            <div key={i} className="px-5 py-4 flex items-start gap-4">
              <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded mt-0.5 ${pc[c.priority as keyof typeof pc]}`}>{c.priority.toUpperCase()}</span>
              <div className="flex-1">
                <p className="text-white text-xs font-semibold">{c.item}</p>
                <p className="text-gray-500 text-xs mt-0.5">Owner: {c.owner}</p>
              </div>
              <span className={`flex-shrink-0 text-xs font-bold ${sc[c.status as keyof typeof sc]}`}>{c.status.toUpperCase()}</span>
            </div>
          );
        })}
      </div>
    </div>

    {/* N-01: Evidence document tracker */}
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800">
        <h3 className="text-white font-semibold text-sm">Evidence Document Tracker</h3>
        <p className="text-gray-500 text-xs">Audit-ready evidence vault · Upload status per regulation</p>
      </div>
      <table className="w-full text-xs">
        <thead><tr className="border-b border-gray-800">
          {['Doc ID','Regulation','Site','Document','Uploaded','Status'].map(h => (
            <th key={h} className="px-4 py-2 text-left text-gray-500 uppercase tracking-wide font-semibold">{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {EVIDENCE_DOCS.map(d => {
            const sc = { verified:'text-green-400', pending:'text-amber-400', missing:'text-red-400' };
            return (
              <tr key={d.docId} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                <td className="px-4 py-2 text-purple-400 font-mono">{d.docId}</td>
                <td className="px-4 py-2 text-white">{d.regulation}</td>
                <td className="px-4 py-2 text-gray-400">{d.site}</td>
                <td className="px-4 py-2 text-gray-300">{d.doc}</td>
                <td className="px-4 py-2 text-gray-400">{d.uploaded}</td>
                <td className="px-4 py-2 font-bold"><span className={sc[d.status as keyof typeof sc]}>{d.status.toUpperCase()}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    {/* N-02: Regulatory change tracker */}
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800">
        <h3 className="text-white font-semibold text-sm">Upcoming Regulatory Changes</h3>
        <p className="text-gray-500 text-xs">Horizon scanning · Change impact assessment · Action planning</p>
      </div>
      <div className="divide-y divide-gray-800">
        {REG_CHANGES.map((r,i) => {
          const sc = { 'in-progress':'text-amber-400', planned:'text-blue-400', 'not-started':'text-red-400' };
          return (
            <div key={i} className="px-5 py-4 flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white text-xs font-semibold">{r.reg}</p>
                  <span className="text-gray-500 text-xs">· Effective: {r.effective}</span>
                </div>
                <p className="text-gray-400 text-xs">Impact: {r.impact}</p>
                <p className="text-gray-500 text-xs mt-0.5">Action: {r.action}</p>
              </div>
              <span className={`flex-shrink-0 text-xs font-bold ${sc[r.status as keyof typeof sc]}`}>{r.status.toUpperCase()}</span>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

type ComplianceItem = typeof COMPLIANCE_ITEMS[0];
function mapAudit(a: API.ComplianceAudit): ComplianceItem {
  const today = new Date();
  const next = a.audit_date || '';
  const daysLeft = next ? Math.round((new Date(next).getTime() - today.getTime()) / 86400000) : 0;
  const raw = (a.status || '').toLowerCase();
  const status = raw === 'pass' || raw === 'compliant' ? 'compliant'
    : raw === 'warning' || raw === 'due-soon' ? 'due-soon'
    : raw === 'fail' || raw === 'overdue' ? 'overdue'
    : daysLeft < 0 ? 'overdue' : daysLeft < 30 ? 'due-soon' : 'compliant';
  return { reg: a.site_id, site: a.site_id, status, next, daysLeft, inspector: '—', score: Math.round(a.score_pct) };
}

const ComplianceTab: React.FC = () => {
  const [items, setItems] = useState<ComplianceItem[]>(COMPLIANCE_ITEMS);
  useEffect(() => {
    API.fetchComplianceAudits()
      .then(list => { if (list.length > 0) setItems(list.map(mapAudit)); })
      .catch(() => {});
  }, []);
  return (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-3">
      {[
        [String(items.filter(i => i.status==='compliant').length), 'COMPLIANT', 'text-green-400','border-green-900/50'],
        [String(items.filter(i => i.status==='due-soon').length),  'DUE SOON',  'text-amber-400','border-amber-900/50'],
        [String(items.filter(i => i.status==='overdue').length),   'OVERDUE',   'text-red-400',  'border-red-900/50'],
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
        {items.map(item => {
          const chip = COMP_CHIP[item.status] ?? COMP_CHIP['compliant'];
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

    {/* Block N: Compliance Enhancements */}
    <ComplianceEnhancementsPanel />
  </div>
  );
};

// ── REQ-23: Live Demo / Guided Tour Mode ─────────────────────────────────────
const TOUR_STEPS: { tab: TabId; title: string; desc: string }[] = [
  // Operations
  { tab:'dashboard',        title:'Global Operations Dashboard',        desc:'Monitor all 40 BP refineries worldwide. The AI Failure Prediction Gantt shows 90-day predicted failures for 14 critical assets, and Multi-Site Benchmarking ranks sites by OEE, MTBF, and MTTR.' },
  { tab:'live-alerts',      title:'Live Alert Intelligence',            desc:'AI-prioritised alerts powered by LSTM + XGBoost. The Anomaly Heatmap shows 7-day rolling scores for 8 assets, while the Escalation Matrix defines who to call, when, and how for every severity level.' },
  { tab:'equipment-health', title:'Equipment Health Centre',            desc:'Vibration FFT Spectrum Analyser (ISO 13373-3), Health Degradation Forecast with AI RUL projection, Oil Analysis & Lubrication Tracker, and the 5×5 Risk Matrix — all per asset.' },
  { tab:'spare-parts',      title:'Spare Parts — Criticality Matrix',   desc:'AI-prioritised parts inventory with stock levels, reorder urgency, and supplier lead times. The Criticality Matrix plots every part by criticality vs lead time for strategic stockholding decisions.' },
  // AI & Models
  { tab:'ai-advisor',       title:'RefinerAI Advisor — Claude Opus 4.6',desc:'Chat with Claude Opus 4.6 about any equipment, failure, spare part, or work order. Streaming responses, adaptive thinking, and full refinery domain expertise built in.' },
  { tab:'ml-models',        title:'ML Models & AI Feedback Loop',       desc:'Six production models — LSTM, XGBoost, Prophet, Random Forest, CNN, Isolation Forest. The AI Feedback Loop tracks confirmed predictions, false positives, and missed failures for continuous model improvement.' },
  { tab:'digital-twin',     title:'Digital Twin — Plant Simulation',    desc:'High-fidelity digital twins for every critical asset. Run what-if scenarios, compare operating envelope parameters, and predict RUL impact before making physical changes to the plant.' },
  // Reliability
  { tab:'reliability',      title:'FMEA Failure Mode Library',          desc:'IEC 60812 FMEA table with RPN scoring (Severity × Occurrence × Detection). All critical failure modes, causes, current controls, and recommended corrective actions across equipment types.' },
  { tab:'compliance',       title:'Regulatory Compliance Tracker',      desc:'API 510/570, ASME B31.3, ISO 13374, PSM, and ISO 45001 compliance status for every site. Real-time compliance scores, next inspection dates, and overdue alerts.' },
  // Field & Sustainability
  { tab:'field-ops',        title:'Inspection Route Optimiser',         desc:'AI-optimised inspection routes minimise travel distance and maximise coverage. Live status per route, inspector assignments, and a digital inspection checklist with CMMS upload.' },
  { tab:'energy',           title:'Energy Consumption Monitor',         desc:'GJ/tonne energy intensity and carbon footprint per site. Bar chart vs targets, YTD reduction tracking, and steam/power consumption — aligned with BP\'s net-zero decarbonisation roadmap.' },
  { tab:'tar',              title:'TAR Shutdown Planning',              desc:'Turnaround schedule for 2026: three planned shutdowns totalling $29.4M. Gantt view with month gridlines, plus work scope count, duration, and budget per event.' },
  // Specialty
  { tab:'castrol',          title:'Castrol Blending Quality Intelligence',desc:'Real-time in-process quality prediction for Castrol lubricant blends. AI forecasts viscosity, pour point, and TBN before the batch completes — reducing LIMS rework and lab testing cycles.' },
  { tab:'offshore',         title:'North Sea Offshore Operations',      desc:'Live platform monitoring for all North Sea assets. Subsea alert management, well integrity barrier status, weather workability windows, and vessel scheduling in one unified view.' },
  { tab:'ot-data',          title:'OT Data — PI Historian Integration', desc:'Operational technology data ingestion from Honeywell, ABB, and Emerson DCS systems. Quality scoring, tag normalisation, schema mapping, and live stream health monitoring.' },
  { tab:'adoption',         title:'User Adoption & Change Management',  desc:'Track EAIOS adoption across all 5 refinery sites. Training completion, response time metrics, champion leaderboard, and adoption barrier identification to drive behaviour change.' },
  { tab:'wave-tracker',     title:'Implementation Wave Tracker',        desc:'Programme delivery tracking across 3 implementation waves. Milestones, delivery risks, budget vs actuals, and completion percentage — keeping the BP digital transformation on schedule.' },
  { tab:'edge-ai',          title:'Edge AI — On-Premise Inference',     desc:'Deploy AI inference to Jetson Orin NX nodes on the plant floor. Sub-20ms latency benchmarks, model deployment status per node, and CPU/memory utilisation — zero cloud dependency for critical predictions.' },
  // Planning
  { tab:'work-orders',      title:'AI Work Orders, RCA & Crew Planner', desc:'Auto-generated work orders with OEM procedures. Root Cause Analysis runs 5-Why on top failures. Crew Planner shows live roster, certifications, and WO assignments across all sites.' },
  { tab:'roi',              title:'ROI Analytics & Budget Tracker',     desc:'Track BP\'s 40% unplanned downtime reduction target (currently 38.2%). MTBF/MTTR/OEE fleet KPIs, Maintenance Budget vs Actuals across all sites, and quarterly savings trend.' },
];

interface TourOverlayProps { onClose: () => void; onTabChange: (tab: TabId) => void; }

const TourOverlay: React.FC<TourOverlayProps> = ({ onClose, onTabChange }) => {
  const [step, setStep] = useState(0);
  const current = TOUR_STEPS[step];

  const go = (next: number) => {
    setStep(next);
    onTabChange(TOUR_STEPS[next].tab);
  };

  // Navigate to the first tab on mount
  useEffect(() => { onTabChange(TOUR_STEPS[0].tab); }, []); // intentional: mount only

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
// ── Block J: Maintenance Scheduling Copilot ───────────────────────────────────

// J-01: AI scheduling recommendations
const SCHEDULE_RECS = [
  { id:'REC-001', asset:'C-101 Compressor',  site:'Ruwais',   action:'Bearing replacement', window:'12-14 Apr',  risk:'critical', constraint:'Crew available, parts on-order ETA 13 Apr', aiConf:0.94 },
  { id:'REC-002', asset:'E-212 Exchanger',   site:'Houston',  action:'Tube bundle clean',   window:'15-16 Apr',  risk:'high',     constraint:'No conflicting unit outages', aiConf:0.87 },
  { id:'REC-003', asset:'P-205 Pump',        site:'Houston',  action:'Mechanical seal swap', window:'18-19 Apr', risk:'medium',   constraint:'Standby P-205B available',   aiConf:0.79 },
];

// J-02: Resource availability calendar (simplified)
const RESOURCE_CAL = [
  { crew:'Rotating Equipment (3 specialists)', available:'12-14 Apr', site:'Ruwais',  conflict:false },
  { crew:'Heat Exchanger Team (2 technicians)',available:'15 Apr',    site:'Houston', conflict:false },
  { crew:'Pump Repair (1 technician)',         available:'18 Apr',    site:'Houston', conflict:false },
  { crew:'Rotating Equipment (3 specialists)', available:'15-17 Apr', site:'Ruwais',  conflict:true  },
];

// J-03: Constraint analysis
const CONSTRAINTS = [
  { type:'Safety', constraint:'Hot-work permit required for C-101 bearing work', status:'ready', owner:'HSE Lead' },
  { type:'Permit', constraint:'PTW-2026-1841 issued for compressor entry', status:'ready', owner:'Shift Lead' },
  { type:'Parts',  constraint:'Bearing 7B-2241-ZZ ETA 13 Apr 09:00', status:'watch', owner:'Supply Chain' },
  { type:'Ops',    constraint:'CDU-1 throughput reduction 15% during work', status:'approved', owner:'Production' },
];

// J-04: Optimized schedule vs baseline
const SCHEDULE_COMPARISON = [
  { metric:'Total Planned Downtime',   baseline:'96h', optimized:'67h', saving:'29h',  pct:30 },
  { metric:'Maintenance Cost Savings', baseline:'$0',  optimized:'-$142K', saving:'$142K', pct:18 },
  { metric:'Risk Reduction Score',     baseline:'61',  optimized:'88',  saving:'+27',  pct:44 },
  { metric:'Crew Utilisation',         baseline:'62%', optimized:'84%', saving:'+22pp', pct:35 },
];

const MaintenanceCopilotPanel: React.FC = () => (
  <div className="space-y-4">
    {/* J-01: AI scheduling recommendations */}
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800">
        <h3 className="text-white font-semibold text-sm">AI Maintenance Scheduling Copilot</h3>
        <p className="text-gray-500 text-xs">Optimal maintenance windows · Resource / permit / parts constraint resolution</p>
      </div>
      <div className="divide-y divide-gray-800">
        {SCHEDULE_RECS.map(r => {
          const rc = { critical:'#ef4444', high:'#f59e0b', medium:'#60a5fa' };
          return (
            <div key={r.id} className="px-5 py-4 flex items-start gap-4">
              <span className="flex-shrink-0 text-xs font-mono text-gray-500 pt-0.5">{r.id}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white text-sm font-semibold">{r.asset}</p>
                  <span className="text-xs text-gray-500">· {r.site}</span>
                  <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background:rc[r.risk as keyof typeof rc]+'22', color:rc[r.risk as keyof typeof rc] }}>{r.risk.toUpperCase()}</span>
                </div>
                <p className="text-gray-300 text-xs">Action: {r.action} · Window: <span className="text-blue-400 font-semibold">{r.window}</span></p>
                <p className="text-gray-500 text-xs mt-0.5">{r.constraint}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-green-400 font-bold text-sm">{Math.round(r.aiConf*100)}%</p>
                <p className="text-gray-600 text-xs">AI confidence</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      {/* J-02: Resource availability */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">Crew Resource Calendar</h3>
          <p className="text-gray-500 text-xs">Conflict detection · 2-week horizon</p>
        </div>
        <div className="divide-y divide-gray-800">
          {RESOURCE_CAL.map((r,i) => (
            <div key={i} className="px-4 py-3 flex items-start gap-3">
              <span className={`flex-shrink-0 mt-0.5 text-xs ${r.conflict?'text-red-400':'text-green-400'}`}>{r.conflict?'⚠':'✓'}</span>
              <div className="flex-1">
                <p className="text-white text-xs font-semibold">{r.crew}</p>
                <p className="text-gray-500 text-xs">{r.site} · {r.available}</p>
              </div>
              {r.conflict && <span className="text-xs bg-red-900/40 text-red-400 rounded px-2 py-0.5">CONFLICT</span>}
            </div>
          ))}
        </div>
      </div>

      {/* J-03: Constraint analysis */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">Constraint Analysis</h3>
          <p className="text-gray-500 text-xs">Safety / permit / parts / ops readiness</p>
        </div>
        <div className="divide-y divide-gray-800">
          {CONSTRAINTS.map((c,i) => {
            const sc = { ready:'text-green-400', watch:'text-amber-400', approved:'text-blue-400' };
            return (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <span className={`flex-shrink-0 text-xs font-bold w-12 pt-0.5 ${sc[c.status as keyof typeof sc]}`}>{c.type}</span>
                <div className="flex-1">
                  <p className="text-white text-xs">{c.constraint}</p>
                  <p className="text-gray-500 text-xs">{c.owner}</p>
                </div>
                <span className={`flex-shrink-0 text-xs font-bold ${sc[c.status as keyof typeof sc]}`}>{c.status.toUpperCase()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>

    {/* J-04: Schedule optimization comparison */}
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-white font-semibold text-sm mb-3">Schedule Optimization Gains — AI vs Baseline</h3>
      <div className="grid grid-cols-4 gap-3">
        {SCHEDULE_COMPARISON.map(s => (
          <div key={s.metric} className="bg-gray-800/50 rounded-lg px-4 py-3">
            <p className="text-gray-500 text-xs mb-2">{s.metric}</p>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-green-400 font-bold text-xl">{s.optimized}</span>
              <span className="text-gray-600 text-xs line-through pb-0.5">{s.baseline}</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-green-500 rounded-full" style={{ width:`${s.pct}%` }} />
            </div>
            <p className="text-green-400 text-xs font-semibold">{s.saving} saved</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TAR_ITEMS = [
  { id:'TAR-2026-01', site:'Ruwais, UAE',     unit:'CDU-1',      start:'2026-06-01', end:'2026-06-28', days:28, status:'planned',   cost:'$8.4M',  scope:124 },
  { id:'TAR-2026-02', site:'Houston, USA',    unit:'VDU + HDS',  start:'2026-08-10', end:'2026-09-15', days:36, status:'planned',   cost:'$14.2M', scope:218 },
  { id:'TAR-2026-03', site:'Rotterdam, NL',   unit:'Reformer-2', start:'2026-09-20', end:'2026-10-12', days:22, status:'planned',   cost:'$6.8M',  scope:87  },
  { id:'TAR-2025-04', site:'Ras Tanura, KSA', unit:'PFCC Unit',  start:'2025-11-01', end:'2025-11-30', days:30, status:'completed', cost:'$11.1M', scope:196 },
  { id:'TAR-2025-03', site:'Jamnagar, India', unit:'Coker Unit', start:'2025-09-15', end:'2025-10-08', days:23, status:'completed', cost:'$9.3M',  scope:143 },
];

type TarItem = typeof TAR_ITEMS[0];
function mapTar(e: API.TarEvent): TarItem {
  const days = Math.round((new Date(e.end_date).getTime() - new Date(e.start_date).getTime()) / 86400000);
  const cost = e.budget_usd >= 1e6 ? `$${(e.budget_usd / 1e6).toFixed(1)}M` : `$${e.budget_usd.toLocaleString()}`;
  const status = (e.status || '').toLowerCase() === 'completed' ? 'completed' : 'planned';
  return { id: e.tar_code, site: e.site_id, unit: e.unit_name, start: e.start_date, end: e.end_date, days: e.duration_days ?? days, status, cost, scope: e.work_scope_count ?? 0 };
}

const TARTab: React.FC = () => {
  const [tarItems, setTarItems] = useState<TarItem[]>(TAR_ITEMS);
  const [liveBudget, setLiveBudget] = useState<number | null>(null);
  useEffect(() => {
    API.fetchTarEvents()
      .then(list => {
        if (list.length > 0) {
          setTarItems(list.map(mapTar));
          setLiveBudget(list.filter(e => e.status !== 'completed').reduce((s, e) => s + e.budget_usd, 0));
        }
      })
      .catch(() => {});
  }, []);
  const budgetLabel = liveBudget != null ? `$${(liveBudget / 1e6).toFixed(1)}M` : '$29.4M';
  const upcoming = tarItems.filter(t => t.status === 'planned');
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
          [budgetLabel,                                                      'PLANNED BUDGET',     'text-white',     'border-gray-800'     ],
          [String(upcoming.reduce((s,t) => s+t.scope, 0)),                  'WORK SCOPES',        'text-purple-400','border-purple-900/50'],
          [String(tarItems.filter(t => t.status==='completed').length),     'COMPLETED 2025',     'text-green-400', 'border-green-900/50' ],
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
          <h3 className="text-white font-semibold">TAR Shutdown Planning — 2026 Schedule</h3>
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

      {/* Block J: Maintenance Copilot */}
      <MaintenanceCopilotPanel />

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4">
        {tarItems.map(t => (
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

const EnergyTab: React.FC = () => {
  const [savingsTotal, setSavingsTotal] = useState<number | null>(null);
  useEffect(() => {
    API.fetchEnergySavings()
      .then(list => { if (list.length > 0) setSavingsTotal(list.reduce((s, e) => s + e.cost_avoided_usd, 0)); })
      .catch(() => {});
  }, []);
  const savingsLabel = savingsTotal != null ? `$${(savingsTotal / 1e6).toFixed(1)}M` : '$12.4M';
  return (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-3">
      {[
        ['4.24 GJ/t',   'Fleet Energy Intensity', 'YTD 2026 average',         'text-blue-400',   'border-blue-900/50'  ],
        ['0.24 tCO₂',   'Carbon Intensity',       'tCO₂ per tonne processed', 'text-green-400',  'border-green-900/50' ],
        ['−8.2%',       'YTD Reduction',          'vs 2025 baseline',         'text-purple-400', 'border-purple-900/50'],
        [savingsLabel,  'Energy Cost Savings',    'vs unoptimised baseline',  'text-amber-400',  'border-amber-900/50' ],
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
        <h3 className="text-white font-semibold">Energy Consumption Monitor — Per Site</h3>
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
};

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

const FieldOpsTab: React.FC = () => {
  const [routes, setRoutes] = useState(INSPECTION_ROUTES);
  useEffect(() => {
    API.fetchInspectionRoutes().then(list => {
      if (list.length > 0) setRoutes(list.map(r => ({
        id: r.route_code, name: r.name, assets: [] as string[],
        inspector: r.inspector_name ?? 'TBA',
        duration: r.estimated_duration_min ? `${r.estimated_duration_min}min` : 'N/A',
        distance: r.distance_km ? `${r.distance_km} km` : 'N/A',
        status: r.status === 'in-progress' ? 'In Progress' : r.status.charAt(0).toUpperCase() + r.status.slice(1),
        priority: r.priority,
      })));
    }).catch(() => {});
  }, []);
  return (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-3">
      {[
        [String(routes.length),                                              'ROUTES TODAY',  'text-white',   'border-gray-800'],
        [String(routes.filter(r => r.status==='In Progress').length),        'IN PROGRESS',   'text-amber-400','border-amber-900/50'],
        [String(routes.filter(r => r.status==='Scheduled').length),          'SCHEDULED',     'text-blue-400', 'border-blue-900/50'],
        [String(routes.filter(r => r.status==='Completed').length),          'COMPLETED',     'text-green-400','border-green-900/50'],
      ].map(([v,l,t,b]) => (
        <div key={l} className={`bg-gray-900 border ${b} rounded-xl p-4`}>
          <p className={`text-2xl font-bold ${t}`}>{v}</p>
          <p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">{l}</p>
        </div>
      ))}
    </div>
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800">
        <h3 className="text-white font-semibold">Inspection Route Optimiser</h3>
        <p className="text-gray-500 text-xs mt-0.5">AI-optimised inspection sequences · Shortest path · Priority weighted</p>
      </div>
      <div className="divide-y divide-gray-800">
        {routes.map(route => (
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
};

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

const FMEATab: React.FC = () => {
  const [fmeaData, setFmeaData] = useState(FMEA_DATA);
  useEffect(() => {
    API.fetchFMEA().then(list => {
      if (list.length > 0) setFmeaData(list.map(f => ({
        type: f.equipment_type, mode: f.failure_mode, effect: f.effect, cause: f.cause,
        control: f.current_controls, s: f.severity, o: f.occurrence, d: f.detection,
        action: f.recommended_action,
      })));
    }).catch(() => {});
  }, []);
  return (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-3">
      {[
        [String(fmeaData.length),'FAILURE MODES','text-white','border-gray-800'],
        [String(fmeaData.filter(f => f.s*f.o*f.d >= 15).length),'CRITICAL RPN ≥15','text-red-400','border-red-900/50'],
        [String(fmeaData.filter(f => { const r=f.s*f.o*f.d; return r>=10&&r<15; }).length),'HIGH RPN 10–14','text-amber-400','border-amber-900/50'],
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
            {fmeaData.map((f, i) => {
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
};

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
    case 'castrol':          return <CastrolTab />;
    case 'offshore':         return <OffshoreTab />;
    case 'ot-data':          return <OTDataTab />;
    case 'adoption':         return <AdoptionTab />;
    case 'wave-tracker':     return <WaveTrackerTab />;
    case 'edge-ai':          return <EdgeAITab />;
    default:                 return null;
  }
};

// ── Block C: Castrol Blending Quality Prediction ─────────────────────────────

// C-02: Active blend run data
const CASTROL_BLENDS = [
  { id: 'BL-2026-0441', grade: 'Castrol GTX 5W-30', tank: 'BT-04', vol: 12000, elapsed: 68, total: 100, site: 'Castellon, ES' },
  { id: 'BL-2026-0442', grade: 'Castrol Edge 0W-40', tank: 'BT-07', vol: 8500,  elapsed: 31, total: 100, site: 'Ellesmere Port, UK' },
];

// C-03/04: Quality prediction data per blend (12 prediction points over blend run)
interface BlendQuality { visc: number; pour: number; tbn: number; }
const CASTROL_QUALITY: Record<string, { predicted: BlendQuality[]; spec: BlendQuality }> = {
  'BL-2026-0441': {
    spec: { visc: 66.2, pour: -35, tbn: 8.5 },
    predicted: [
      {visc:65.0,pour:-33,tbn:8.1},{visc:65.2,pour:-33,tbn:8.2},{visc:65.5,pour:-34,tbn:8.3},
      {visc:65.8,pour:-34,tbn:8.4},{visc:66.0,pour:-34,tbn:8.4},{visc:66.1,pour:-35,tbn:8.5},
      {visc:66.2,pour:-35,tbn:8.5},{visc:66.3,pour:-35,tbn:8.6},{visc:66.4,pour:-36,tbn:8.6},
      {visc:66.2,pour:-35,tbn:8.5},{visc:66.1,pour:-35,tbn:8.5},{visc:66.2,pour:-35,tbn:8.5},
    ],
  },
  'BL-2026-0442': {
    spec: { visc: 72.1, pour: -40, tbn: 9.2 },
    predicted: [
      {visc:69.0,pour:-37,tbn:8.6},{visc:69.5,pour:-37,tbn:8.7},{visc:70.0,pour:-38,tbn:8.8},
      {visc:70.4,pour:-38,tbn:8.9},{visc:70.8,pour:-39,tbn:9.0},{visc:71.2,pour:-39,tbn:9.1},
      {visc:71.5,pour:-39,tbn:9.1},{visc:71.7,pour:-40,tbn:9.2},{visc:72.0,pour:-40,tbn:9.2},
      {visc:72.1,pour:-40,tbn:9.2},
    ],
  },
};

// C-07: Blend tank sensor readings
const CASTROL_SENSORS: Record<string, { temp: number; visc: number; density: number; dosingRate: number }> = {
  'BL-2026-0441': { temp: 68.4, visc: 66.2, density: 872.1, dosingRate: 2.14 },
  'BL-2026-0442': { temp: 71.1, visc: 71.5, density: 868.4, dosingRate: 2.87 },
};

// C-08: LIMS historical records
const LIMS_RECORDS = [
  { id: 'LI-2026-0440', grade: 'GTX 5W-30',  date: '11 Apr', result: 'PASS', visc: 66.1, pour: -35, tbn: 8.5, rework: false },
  { id: 'LI-2026-0439', grade: 'Edge 0W-40',  date: '10 Apr', result: 'FAIL', visc: 69.8, pour: -38, tbn: 8.8, rework: true  },
  { id: 'LI-2026-0438', grade: 'GTX 10W-40',  date: '09 Apr', result: 'PASS', visc: 98.2, pour: -25, tbn: 7.9, rework: false },
  { id: 'LI-2026-0437', grade: 'Classic 20W', date: '08 Apr', result: 'FAIL', visc: 141.0,pour: -15, tbn: 6.8, rework: true  },
  { id: 'LI-2026-0436', grade: 'GTX 5W-30',  date: '07 Apr', result: 'PASS', visc: 65.9, pour: -35, tbn: 8.4, rework: false },
];

// C-05: Corrective actions
const CASTROL_CORRECTIONS: Record<string, string[]> = {
  'BL-2026-0441': [],
  'BL-2026-0442': [
    'Increase VI improver dosing by 0.12% (current: 2.87 → target: 2.99 kg/min)',
    'Raise blend temperature 2°C to 73°C to improve homogeneity',
    'Extend mixing time by 8 minutes to reduce viscosity gradient',
  ],
};

// C-09: Additive dosing optimizer
const DOSING_OPTS = [
  { additive: 'VI Improver',        current: 2.14, optimal: 2.18, unit: 'kg/min', impact: '+0.8 cSt viscosity'  },
  { additive: 'Pour Point Depressant', current: 0.42, optimal: 0.45, unit: 'kg/min', impact: '-1°C pour point'  },
  { additive: 'Antioxidant Pkg',    current: 1.88, optimal: 1.88, unit: 'kg/min', impact: 'Optimal'             },
  { additive: 'Anti-wear Additive', current: 0.76, optimal: 0.79, unit: 'kg/min', impact: '+0.2 TBN'           },
];

const CastrolTab: React.FC = () => {
  const [blends, setBlends] = useState(CASTROL_BLENDS);
  const [selectedBlend, setSelectedBlend] = useState(CASTROL_BLENDS[0].id);
  useEffect(() => {
    API.fetchCastrolRuns().then(list => {
      if (list.length > 0) setBlends(list.map(r => ({
        id: r.batch_code, grade: r.grade_name, tank: 'N/A',
        vol: Math.round(r.target_volume_liters),
        elapsed: Math.round(r.progress_pct), total: 100, site: r.site_id,
      })));
    }).catch(() => {});
  }, []);
  const blend   = blends.find(b => b.id === selectedBlend) ?? blends[0];
  const quality = CASTROL_QUALITY[selectedBlend];
  const sensors = CASTROL_SENSORS[selectedBlend];
  const corrections = CASTROL_CORRECTIONS[selectedBlend] ?? [];
  const pct = Math.round((blend.elapsed / blend.total) * 100);
  const latest = quality.predicted[quality.predicted.length - 1];
  const offSpec = LIMS_RECORDS.filter(r => r.result === 'FAIL').length;
  const offSpecRate = Math.round((offSpec / LIMS_RECORDS.length) * 100);

  // C-04: SVG confidence timeline for viscosity
  const W = 480, H = 90, PL = 36, PR = 16, PT = 12, PB = 24;
  const cW = W - PL - PR, cH = H - PT - PB;
  const pts = quality.predicted;
  const viscVals = pts.map(p => p.visc);
  const minV = Math.min(...viscVals) - 2, maxV = Math.max(...viscVals) + 2;
  const xOf = (i: number) => PL + (i / (pts.length - 1)) * cW;
  const yOf = (v: number) => PT + cH - ((v - minV) / (maxV - minV)) * cH;
  const polyPts = pts.map((p, i) => `${xOf(i).toFixed(1)},${yOf(p.visc).toFixed(1)}`).join(' ');
  const specY = yOf(quality.spec.visc);

  return (
    <div className="space-y-5">
      {/* C-06: Off-spec rate KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {([
          [String(blends.length), 'ACTIVE BLENDS',   'text-blue-400',   'border-blue-900/50'  ],
          [`${offSpecRate}%`,             'OFF-SPEC RATE',    offSpecRate < 5 ? 'text-green-400' : 'text-red-400', offSpecRate < 5 ? 'border-green-900/50' : 'border-red-900/50'],
          ['2%',                          'TARGET OFF-SPEC',  'text-gray-400',   'border-gray-800'     ],
          [String(LIMS_RECORDS.filter(r => r.rework).length), 'REWORK BATCHES', 'text-amber-400', 'border-amber-900/50'],
        ] as [string,string,string,string][]).map(([v,l,t,b]) => (
          <div key={l} className={`bg-gray-900 border ${b} rounded-xl p-4`}>
            <p className={`text-2xl font-bold ${t}`}>{v}</p>
            <p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      {/* C-02: Blend selector + run monitor */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold">Active Blend Run Monitor</h3>
            <p className="text-gray-500 text-xs">Real-time in-process quality prediction · updated every 60s</p>
          </div>
          <div className="flex gap-2">
            {blends.map(b => (
              <button key={b.id} onClick={() => setSelectedBlend(b.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${selectedBlend === b.id ? 'bg-blue-900/40 text-blue-400 border-blue-800' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'}`}>
                {b.id}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-800/50 rounded-lg px-4 py-3">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Grade</p>
            <p className="text-white font-semibold text-sm">{blend.grade}</p>
            <p className="text-gray-500 text-xs">{blend.site} · Tank {blend.tank}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg px-4 py-3">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Blend Progress</p>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width:`${pct}%` }} />
              </div>
              <span className="text-white font-bold text-sm">{pct}%</span>
            </div>
            <p className="text-gray-500 text-xs">{blend.elapsed}% of {blend.vol.toLocaleString()}L complete</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg px-4 py-3">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Batch ID</p>
            <p className="text-white font-semibold text-sm font-mono">{blend.id}</p>
          </div>
        </div>

        {/* C-07: Blend tank sensors */}
        <div className="grid grid-cols-4 gap-3 mb-4 border-t border-gray-800 pt-4">
          <p className="col-span-4 text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Live Tank Sensors</p>
          {([
            ['Temperature',  `${sensors.temp}°C`, '#f59e0b'],
            ['Viscosity',    `${sensors.visc} cSt`, '#60a5fa'],
            ['Density',      `${sensors.density} kg/m³`, '#34d399'],
            ['Dosing Rate',  `${sensors.dosingRate} kg/min`, '#a78bfa'],
          ] as [string,string,string][]).map(([l,v,c]) => (
            <div key={l} className="bg-gray-800/50 rounded-lg px-3 py-2 text-center">
              <p className="text-lg font-bold font-mono" style={{ color:c }}>{v}</p>
              <p className="text-gray-500 text-xs mt-0.5">{l}</p>
            </div>
          ))}
        </div>

        {/* C-03: In-process quality prediction */}
        <div className="border-t border-gray-800 pt-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">In-Process Quality Prediction (vs Specification)</p>
          <div className="grid grid-cols-3 gap-3">
            {([
              ['Kinematic Viscosity', latest.visc.toFixed(1), quality.spec.visc.toFixed(1), 'cSt',  Math.abs(latest.visc - quality.spec.visc) < 1],
              ['Pour Point',         String(latest.pour),     String(quality.spec.pour),     '°C',   latest.pour <= quality.spec.pour],
              ['Total Base Number',  latest.tbn.toFixed(1),   quality.spec.tbn.toFixed(1),   'mgKOH/g', Math.abs(latest.tbn - quality.spec.tbn) < 0.3],
            ] as [string,string,string,string,boolean][]).map(([l,pred,spec,unit,ok]) => (
              <div key={l} className={`rounded-lg px-4 py-3 border ${ok ? 'bg-green-950/30 border-green-900/40' : 'bg-red-950/30 border-red-900/40'}`}>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">{l}</p>
                <p className={`text-xl font-bold font-mono ${ok ? 'text-green-400' : 'text-red-400'}`}>{pred} {unit}</p>
                <p className="text-gray-500 text-xs">Spec: {spec} {unit} · {ok ? '✓ ON TRACK' : '⚠ DRIFTING'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* C-04: Viscosity confidence timeline SVG */}
        <div className="border-t border-gray-800 pt-4 mt-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">Viscosity Prediction Trajectory (Full Blend Run)</p>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height: H }}>
            <line x1={PL} y1={specY} x2={W-PR} y2={specY} stroke="#22c55e" strokeWidth="1" strokeDasharray="5,3" />
            <text x={W-PR+2} y={specY+3} fill="#22c55e" fontSize="8">Spec {quality.spec.visc}</text>
            <polyline points={polyPts} fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinejoin="round" />
            {pts.map((p, i) => <circle key={i} cx={xOf(i)} cy={yOf(p.visc)} r="3" fill="#60a5fa" opacity={i === pts.length-1 ? 1 : 0.4} />)}
            {[0,25,50,75,100].map(v => {
              const x = PL + (v/100)*cW;
              return <text key={v} x={x} y={H-4} fill="#4b5563" fontSize="8" textAnchor="middle">{v}%</text>;
            })}
            <text x={8} y={H/2} fill="#4b5563" fontSize="8" textAnchor="middle" transform={`rotate(-90,8,${H/2})`}>cSt</text>
          </svg>
        </div>

        {/* C-05: Corrective action recommendations */}
        {corrections.length > 0 && (
          <div className="border-t border-gray-800 pt-4 mt-2">
            <p className="text-xs text-amber-400 font-semibold uppercase tracking-widest mb-2">⚠ AI Corrective Actions Required</p>
            <div className="space-y-2">
              {corrections.map((c, i) => (
                <div key={i} className="flex gap-2 bg-amber-950/20 border border-amber-900/30 rounded-lg px-3 py-2">
                  <span className="text-amber-500 text-xs flex-shrink-0">{i+1}.</span>
                  <p className="text-amber-300 text-xs">{c}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* C-09: Additive dosing optimizer */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">Additive Dosing Optimizer</h3>
          <p className="text-gray-500 text-xs">AI-recommended dosing adjustments for {blend.grade}</p>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-gray-800">
            {['Additive','Current (kg/min)','AI Optimal (kg/min)','Δ','Impact'].map(h => (
              <th key={h} className="px-4 py-2 text-left text-gray-500 uppercase tracking-wide font-semibold">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {DOSING_OPTS.map(d => {
              const delta = d.optimal - d.current;
              return (
                <tr key={d.additive} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                  <td className="px-4 py-2 text-gray-300">{d.additive}</td>
                  <td className="px-4 py-2 text-white font-mono">{d.current.toFixed(2)}</td>
                  <td className="px-4 py-2 text-blue-400 font-mono font-bold">{d.optimal.toFixed(2)}</td>
                  <td className="px-4 py-2 font-mono font-bold" style={{ color: Math.abs(delta) < 0.01 ? '#4ade80' : delta > 0 ? '#f59e0b' : '#60a5fa' }}>
                    {delta === 0 ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(2)}`}
                  </td>
                  <td className="px-4 py-2 text-gray-400">{d.impact}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* C-08: LIMS Quality Record Archive */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">LIMS Quality Record Archive</h3>
          <p className="text-gray-500 text-xs">Historical batch results · End-of-batch lab measurements</p>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-gray-800">
            {['Batch ID','Grade','Date','Viscosity (cSt)','Pour (°C)','TBN','Result','Rework'].map(h => (
              <th key={h} className="px-4 py-2 text-left text-gray-500 uppercase tracking-wide font-semibold">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {LIMS_RECORDS.map(r => (
              <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                <td className="px-4 py-2 text-purple-400 font-mono">{r.id}</td>
                <td className="px-4 py-2 text-gray-300">{r.grade}</td>
                <td className="px-4 py-2 text-gray-400">{r.date}</td>
                <td className="px-4 py-2 text-white font-mono">{r.visc.toFixed(1)}</td>
                <td className="px-4 py-2 text-white font-mono">{r.pour}</td>
                <td className="px-4 py-2 text-white font-mono">{r.tbn.toFixed(1)}</td>
                <td className="px-4 py-2"><span className={`font-bold ${r.result === 'PASS' ? 'text-green-400' : 'text-red-400'}`}>{r.result}</span></td>
                <td className="px-4 py-2">{r.rework ? <span className="text-amber-400">✓ Rework</span> : <span className="text-gray-600">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Block D: North Sea Offshore Operations ────────────────────────────────────

// D-01: Offshore platform data
const OFFSHORE_PLATFORMS = [
  { id: 'TERN-A',  name: 'Tern Alpha',     field: 'Tern Field',   status: 'operational', lat: 60.8, lon: 1.7,  prod: 18400, uptime: 97.2, wells: 14, crew: 172, weatherScore: 82 },
  { id: 'CORMORANT',name:'Cormorant Alpha',field:'Cormorant Fld', status: 'warning',    lat: 61.1, lon: 1.4,  prod: 12100, uptime: 91.4, wells: 9,  crew: 148, weatherScore: 61 },
  { id: 'DUNLIN-A', name: 'Dunlin Alpha',  field: 'Dunlin Field', status: 'operational', lat: 60.6, lon: 1.5,  prod: 9800,  uptime: 98.1, wells: 8,  crew: 126, weatherScore: 77 },
  { id: 'BRENT-C',  name: 'Brent Charlie', field: 'Brent Field',  status: 'critical',   lat: 61.3, lon: 1.7,  prod: 6200,  uptime: 78.3, wells: 6,  crew: 98,  weatherScore: 42 },
];

// D-02: Weather/marine forecast windows
const OFFSHORE_WEATHER = [
  { platform: 'TERN-A',   dayLabel: 'Today',    waveH: 1.8, windKt: 22, visibility: 8.2, workable: true },
  { platform: 'TERN-A',   dayLabel: '+24h',     waveH: 2.4, windKt: 31, visibility: 6.1, workable: true },
  { platform: 'TERN-A',   dayLabel: '+48h',     waveH: 4.1, windKt: 48, visibility: 3.8, workable: false },
  { platform: 'CORMORANT',dayLabel: 'Today',    waveH: 3.2, windKt: 39, visibility: 4.9, workable: false },
  { platform: 'BRENT-C',  dayLabel: 'Today',    waveH: 4.8, windKt: 54, visibility: 2.1, workable: false },
];

// D-03: Subsea equipment predictive alerts
const SUBSEA_ALERTS = [
  { id:'SS-001', asset:'Christmas Tree CT-14', platform:'TERN-A',     issue:'Annulus pressure trending +18% above baseline', failProb:0.72, eta:8,  sev:'critical' },
  { id:'SS-002', asset:'Flowline Flex Joint',  platform:'CORMORANT',  issue:'Fatigue cycle count exceeds 78% design life',   failProb:0.54, eta:21, sev:'warning'  },
  { id:'SS-003', asset:'BOP Stack BOP-07',     platform:'DUNLIN-A',   issue:'Hydraulic actuator response time +340ms drift', failProb:0.31, eta:45, sev:'advisory' },
  { id:'SS-004', asset:'Riser Tensioner RT-3', platform:'BRENT-C',    issue:'Tension variance ±12% above spec threshold',    failProb:0.88, eta:3,  sev:'critical' },
];

// D-04: Logistics & crew schedule
const VESSEL_SCHEDULE = [
  { vessel:'Highland Sentinel', type:'PSV',       departure:'12 Apr 08:00', arrival:'12 Apr 14:30', destination:'TERN-A',    cargo:'Drill mud, Casing joints', status:'underway' },
  { vessel:'Normand Fortress',  type:'DSV',       departure:'13 Apr 06:00', arrival:'13 Apr 12:00', destination:'BRENT-C',   cargo:'Dive team, ROV tools',    status:'scheduled' },
  { vessel:'Caledonian Star',   type:'Helicopter',departure:'12 Apr 07:30', arrival:'12 Apr 08:45', destination:'CORMORANT', cargo:'Crew change (24 pax)',     status:'completed' },
];

// D-05: Environmental discharge monitoring
const ENV_METRICS = [
  { metric: 'Produced Water Overboard', value: 18.2,  limit: 30,   unit: 'mg/L Oil',  ok: true },
  { metric: 'Flaring Volume (24h)',      value: 142,   limit: 200,  unit: 'MSCF/day',  ok: true },
  { metric: 'Chemical Discharge',        value: 0.84,  limit: 1.0,  unit: 'kg/day',    ok: true },
  { metric: 'Drilling Mud to Sea',       value: 0,     limit: 0,    unit: 'kg',         ok: true },
  { metric: 'NOx Emissions',             value: 4.8,   limit: 5.0,  unit: 't/day',     ok: true },
];

// D-06: Well integrity log
const WELL_INTEGRITY = [
  { well:'A-14', barrier:'Primary', status:'OK',  annPres:12.4, lastTest:'08 Apr', note:'' },
  { well:'A-11', barrier:'Primary', status:'WARN',annPres:18.8, lastTest:'05 Apr', note:'Annulus pressure trending up' },
  { well:'B-07', barrier:'Primary', status:'OK',  annPres:9.1,  lastTest:'10 Apr', note:'' },
  { well:'B-09', barrier:'Both',    status:'CRIT',annPres:31.2, lastTest:'01 Apr', note:'Shut-in pending investigation' },
  { well:'C-03', barrier:'Primary', status:'OK',  annPres:11.8, lastTest:'11 Apr', note:'' },
];

type OffshorePlatformItem = typeof OFFSHORE_PLATFORMS[0];
type SubseaAlertItem = typeof SUBSEA_ALERTS[0];
type WellIntegrityItem = typeof WELL_INTEGRITY[0];
function mapApiPlatform(p: API.Platform): OffshorePlatformItem {
  return { id: p.id, name: p.name, field: p.field_name, status: p.status, lat: 0, lon: 0, prod: p.production_bopd, uptime: p.uptime_pct, wells: 0, crew: 0, weatherScore: 0 };
}
function mapApiSubseaAlert(a: API.SubseaAlert): SubseaAlertItem {
  const sev = a.failure_probability_pct >= 70 ? 'critical' : a.failure_probability_pct >= 40 ? 'warning' : 'advisory';
  return { id: a.id, asset: a.asset_name, platform: a.platform_id, issue: a.issue_description, failProb: a.failure_probability_pct / 100, eta: a.eta_days, sev };
}
function mapApiWellIntegrity(w: API.WellIntegrity): WellIntegrityItem {
  const s = (w.status || '').toLowerCase();
  const status = s === 'ok' ? 'OK' : s === 'warn' || s === 'warning' ? 'WARN' : s === 'crit' || s === 'critical' ? 'CRIT' : 'OK';
  return { well: w.well_name, barrier: w.barrier_type, status, annPres: 0, lastTest: '—', note: '' };
}

const OffshoreTab: React.FC = () => {
  const [platforms, setPlatforms] = useState<OffshorePlatformItem[]>(OFFSHORE_PLATFORMS);
  const [subseaAlerts, setSubseaAlerts] = useState<SubseaAlertItem[]>(SUBSEA_ALERTS);
  const [wellIntegrity, setWellIntegrity] = useState<WellIntegrityItem[]>(WELL_INTEGRITY);
  useEffect(() => {
    API.fetchPlatforms().then(list => { if (list.length > 0) setPlatforms(list.map(mapApiPlatform)); }).catch(() => {});
    API.fetchSubseaAlerts().then(list => { if (list.length > 0) setSubseaAlerts(list.map(mapApiSubseaAlert)); }).catch(() => {});
    API.fetchWellIntegrity().then(list => { if (list.length > 0) setWellIntegrity(list.map(mapApiWellIntegrity)); }).catch(() => {});
  }, []);
  const [selPlatform, setSelPlatform] = useState(OFFSHORE_PLATFORMS[0].id);
  const plat = platforms.find(p => p.id === selPlatform) ?? platforms[0];
  const weather = OFFSHORE_WEATHER.filter(w => w.platform === selPlatform);
  const activeAlert = subseaAlerts.filter(a => a.platform === selPlatform);
  const sev = { critical:'#ef4444', warning:'#f59e0b', advisory:'#60a5fa' };
  const pSev = { operational:'#22c55e', warning:'#f59e0b', critical:'#ef4444' };

  return (
    <div className="space-y-5">
      {/* D-01: Fleet overview KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {([
          [String(platforms.length), 'PLATFORMS',         'text-blue-400',   'border-blue-900/50'],
          [String(platforms.reduce((s,p)=>s+p.prod,0).toLocaleString()), 'TOTAL PROD (BOPD)', 'text-green-400', 'border-green-900/50'],
          [String(platforms.reduce((s,p)=>s+p.crew,0)), 'TOTAL CREW', 'text-amber-400', 'border-amber-900/50'],
          [String(subseaAlerts.filter(a=>a.sev==='critical').length), 'CRITICAL ALERTS', 'text-red-400', 'border-red-900/50'],
        ] as [string,string,string,string][]).map(([v,l,t,b]) => (
          <div key={l} className={`bg-gray-900 border ${b} rounded-xl p-4`}>
            <p className={`text-2xl font-bold ${t}`}>{v}</p>
            <p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      {/* Platform selector */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold">North Sea Platform Intelligence</h3>
            <p className="text-gray-500 text-xs">UK Continental Shelf · Real-time operations & predictive subsea analytics</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {platforms.map(p => (
              <button key={p.id} onClick={() => setSelPlatform(p.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${selPlatform === p.id ? 'bg-blue-900/40 text-blue-400 border-blue-800' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'}`}>
                <span style={{ color: pSev[p.status as keyof typeof pSev], marginRight: 5 }}>●</span>{p.id}
              </button>
            ))}
          </div>
        </div>

        {/* Platform detail row */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          {([
            ['Production', `${plat.prod.toLocaleString()} BOPD`, '#60a5fa'],
            ['Uptime',     `${plat.uptime}%`,                    plat.uptime >= 95 ? '#4ade80' : plat.uptime >= 85 ? '#f59e0b' : '#ef4444'],
            ['Active Wells',String(plat.wells),                  '#a78bfa'],
            ['Crew Onboard',String(plat.crew),                   '#f9fafb'],
            ['Weather Score',`${plat.weatherScore}/100`,         plat.weatherScore >= 70 ? '#4ade80' : plat.weatherScore >= 50 ? '#f59e0b' : '#ef4444'],
          ] as [string,string,string][]).map(([l,v,c]) => (
            <div key={l} className="bg-gray-800/50 rounded-lg px-3 py-3 text-center">
              <p className="text-lg font-bold font-mono" style={{ color:c }}>{v}</p>
              <p className="text-gray-500 text-xs mt-0.5">{l}</p>
            </div>
          ))}
        </div>

        {/* D-02: Weather window */}
        {weather.length > 0 && (
          <div className="border-t border-gray-800 pt-4">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">Marine Weather Windows</p>
            <div className="flex gap-3">
              {weather.map(w => (
                <div key={w.dayLabel} className={`flex-1 rounded-lg px-4 py-3 border ${w.workable ? 'bg-green-950/20 border-green-900/40' : 'bg-red-950/20 border-red-900/40'}`}>
                  <p className="text-white font-semibold text-sm">{w.dayLabel}</p>
                  <p className="text-gray-400 text-xs mt-1">Hs: {w.waveH}m · Wind: {w.windKt}kt · Vis: {w.visibility}nm</p>
                  <p className={`text-xs font-bold mt-1 ${w.workable ? 'text-green-400' : 'text-red-400'}`}>{w.workable ? '✓ WORKABLE' : '✗ UNSAFE'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* D-03: Subsea predictive alerts */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-sm">Subsea Equipment — Predictive Alerts</h3>
            <p className="text-gray-500 text-xs">ML-driven failure probability · All platforms</p>
          </div>
          <span className="text-xs bg-red-900/40 text-red-400 border border-red-800 rounded-lg px-3 py-1 font-semibold">
            {subseaAlerts.filter(a=>a.sev==='critical').length} CRITICAL
          </span>
        </div>
        <div className="divide-y divide-gray-800">
          {subseaAlerts.map(a => (
            <div key={a.id} className="px-5 py-4 flex items-start gap-4">
              <span style={{ width:8,height:8,borderRadius:'50%',background:sev[a.sev as keyof typeof sev],flexShrink:0,marginTop:5 }} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">{a.asset} <span className="text-gray-500 font-normal text-xs">· {a.platform}</span></p>
                <p className="text-gray-400 text-xs mt-0.5">{a.issue}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-mono font-bold text-sm" style={{ color:sev[a.sev as keyof typeof sev] }}>{Math.round(a.failProb*100)}%</p>
                <p className="text-gray-600 text-xs">ETA: {a.eta}d</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* D-04: Vessel schedule */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <h3 className="text-white font-semibold text-sm">Logistics & Vessel Schedule</h3>
            <p className="text-gray-500 text-xs">PSV, DSV & helicopter movements</p>
          </div>
          <div className="divide-y divide-gray-800">
            {VESSEL_SCHEDULE.map(v => {
              const sc = { underway:'text-blue-400', scheduled:'text-amber-400', completed:'text-green-400' };
              return (
                <div key={v.vessel} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white text-xs font-semibold">{v.vessel} <span className="text-gray-600">({v.type})</span></p>
                    <span className={`text-xs font-bold ${sc[v.status as keyof typeof sc]}`}>{v.status.toUpperCase()}</span>
                  </div>
                  <p className="text-gray-500 text-xs">{v.destination} · Dep: {v.departure}</p>
                  <p className="text-gray-600 text-xs">{v.cargo}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* D-05: Environmental compliance */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <h3 className="text-white font-semibold text-sm">Environmental Discharge Monitor</h3>
            <p className="text-gray-500 text-xs">OPPC/MARPOL compliance · Live readings vs permit limits</p>
          </div>
          <div className="divide-y divide-gray-800">
            {ENV_METRICS.map(m => (
              <div key={m.metric} className="px-4 py-2.5 flex items-center justify-between">
                <p className="text-gray-400 text-xs">{m.metric}</p>
                <div className="text-right">
                  <span className={`text-xs font-mono font-bold ${m.ok ? 'text-green-400' : 'text-red-400'}`}>{m.value} {m.unit}</span>
                  <span className="text-gray-600 text-xs ml-2">/ {m.limit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* D-06: Well integrity */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">Well Integrity Register</h3>
          <p className="text-gray-500 text-xs">Barrier verification · Annulus pressure monitoring · WIMS-compliant</p>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-gray-800">
            {['Well','Barrier','Annulus P (barg)','Last Test','Status','Note'].map(h => (
              <th key={h} className="px-4 py-2 text-left text-gray-500 uppercase tracking-wide font-semibold">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {wellIntegrity.map(w => {
              const sc = { OK:'text-green-400', WARN:'text-amber-400', CRIT:'text-red-400' };
              return (
                <tr key={w.well} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                  <td className="px-4 py-2 text-white font-mono font-bold">{w.well}</td>
                  <td className="px-4 py-2 text-gray-400">{w.barrier}</td>
                  <td className="px-4 py-2 font-mono" style={{ color: w.annPres > 25 ? '#ef4444' : w.annPres > 15 ? '#f59e0b' : '#f9fafb' }}>{w.annPres}</td>
                  <td className="px-4 py-2 text-gray-400">{w.lastTest}</td>
                  <td className="px-4 py-2 font-bold"><span className={sc[w.status as keyof typeof sc]}>{w.status}</span></td>
                  <td className="px-4 py-2 text-gray-500 italic">{w.note || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Block G: OT Data Ingestion & Quality ─────────────────────────────────────

// G-01: OT data source inventory
const OT_SOURCES = [
  { id:'PI-HOU-01', type:'OSIsoft PI',  site:'Houston, USA',     tags:4821, latency:'250ms', status:'connected', lastPoll:'Just now',    qScore:98 },
  { id:'MATRIKON-RUW',type:'OPC-UA',  site:'Ruwais, UAE',       tags:3204, latency:'180ms', status:'connected', lastPoll:'4s ago',      qScore:96 },
  { id:'DCS-RT-01',  type:'DCS Honeywell',site:'Ras Tanura, KSA',tags:6102, latency:'95ms',  status:'connected', lastPoll:'1s ago',      qScore:99 },
  { id:'SCADA-JAM',  type:'SCADA GE',  site:'Jamnagar, India',   tags:2890, latency:'320ms', status:'degraded',  lastPoll:'38s ago',     qScore:71 },
  { id:'PI-ROT-02',  type:'OSIsoft PI', site:'Rotterdam, NL',    tags:3710, latency:'140ms', status:'connected', lastPoll:'2s ago',      qScore:94 },
];

// G-02: Data quality issues
const OT_QUALITY_ISSUES = [
  { tag:'FT-2201.PV', site:'Jamnagar', issue:'Frozen value detected — same reading for 47min', severity:'critical', impact:'Flow calculation error in unit B-12' },
  { tag:'TI-4405.PV', site:'Ruwais',   issue:'Out-of-range value: 2847°C (instrument max 1200°C)', severity:'critical', impact:'Bearing temp alarm suppression' },
  { tag:'PT-1108.PV', site:'Houston',  issue:'Stale timestamp — last update 8 minutes ago', severity:'warning', impact:'Compressor health model input gap' },
  { tag:'LT-3302.PV', site:'Rotterdam',issue:'Intermittent dropouts (12% missing last hour)', severity:'warning', impact:'Tank level calculation uncertainty' },
];

// G-03: Tag statistics
const OT_STATS = [
  { label:'Total Tags Ingested',  value:'20,727', sub:'Across 5 sites',    color:'text-blue-400' },
  { label:'Data Quality Score',   value:'91.6%',  sub:'Fleet average',     color:'text-green-400' },
  { label:'Active Quality Issues',value:'4',       sub:'2 critical',       color:'text-red-400' },
  { label:'Avg Latency',          value:'197ms',   sub:'P95: 420ms',       color:'text-amber-400' },
];

// G-04: Protocol breakdown
const PROTOCOL_BREAKDOWN = [
  { protocol:'OSIsoft PI', tags:8531, pct:41 },
  { protocol:'OPC-UA',     tags:6102, pct:29 },
  { protocol:'Modbus TCP', tags:3204, pct:15 },
  { protocol:'MQTT',       tags:1890, pct:9  },
  { protocol:'REST/JSON',  tags:1000, pct:5  },
];

// G-05: Schema normalization log
const NORM_LOG = [
  { ts:'12 Apr 09:14', action:'Tag renaming applied', detail:'FIC_2201 → FT-2201.PV (ISA-88 standard)', status:'success' },
  { ts:'12 Apr 09:12', action:'Unit conversion', detail:'kPa → bar for 312 pressure tags (Houston)', status:'success' },
  { ts:'12 Apr 09:10', action:'Frozen value filter', detail:'FT-2201.PV excluded from model inputs', status:'warn' },
  { ts:'12 Apr 09:08', action:'Schema mismatch detected', detail:'SCADA-JAM sends 3-decimal pct vs 2-decimal expected', status:'error' },
];

const OTDataTab: React.FC = () => {
  const statusC = { connected:'text-green-400', degraded:'text-amber-400', offline:'text-red-400' };
  const sevC    = { critical:'text-red-400', warning:'text-amber-400', advisory:'text-blue-400' };
  const normC   = { success:'#22c55e', warn:'#f59e0b', error:'#ef4444' };
  const [sources, setSources] = useState(OT_SOURCES);
  const [qualityIssues, setQualityIssues] = useState(OT_QUALITY_ISSUES);
  useEffect(() => {
    API.fetchOTSources().then(list => {
      if (list.length > 0) setSources(list.map(s => ({
        id: s.source_code, type: s.source_type, site: s.site_id,
        tags: s.tag_count, latency: `${s.latency_ms}ms`, status: s.status,
        lastPoll: s.last_poll_at ? new Date(s.last_poll_at).toLocaleTimeString() : 'N/A',
        qScore: Math.round(s.quality_score_pct),
      })));
    }).catch(() => {});
    API.fetchOTQualityIssues().then(list => {
      if (list.length > 0) setQualityIssues(list.map(i => ({
        tag: i.tag_name, site: i.source_id, issue: i.description,
        severity: i.severity, impact: i.issue_type,
      })));
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-5">
      {/* G-03: KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {OT_STATS.map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">{s.label}</p>
            <p className="text-gray-600 text-xs mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* G-01: OT data source inventory */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">OT Data Source Inventory</h3>
          <p className="text-gray-500 text-xs">Live connections · OSIsoft PI / OPC-UA / DCS / SCADA / MQTT</p>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-gray-800">
            {['Source ID','Protocol','Site','Tags','Latency','Quality Score','Status','Last Poll'].map(h => (
              <th key={h} className="px-4 py-2 text-left text-gray-500 uppercase tracking-wide font-semibold">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {sources.map(s => (
              <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                <td className="px-4 py-2 text-purple-400 font-mono">{s.id}</td>
                <td className="px-4 py-2 text-gray-300">{s.type}</td>
                <td className="px-4 py-2 text-gray-400">{s.site}</td>
                <td className="px-4 py-2 text-white font-mono">{s.tags.toLocaleString()}</td>
                <td className="px-4 py-2 text-white font-mono">{s.latency}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-800 rounded-full">
                      <div className="h-full rounded-full" style={{ width:`${s.qScore}%`, background: s.qScore>=90?'#22c55e':s.qScore>=70?'#f59e0b':'#ef4444' }} />
                    </div>
                    <span className="font-mono text-white">{s.qScore}%</span>
                  </div>
                </td>
                <td className="px-4 py-2 font-bold"><span className={statusC[s.status as keyof typeof statusC]}>{s.status.toUpperCase()}</span></td>
                <td className="px-4 py-2 text-gray-400">{s.lastPoll}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* G-02: Data quality issues */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-sm">Data Quality Issues</h3>
            <p className="text-gray-500 text-xs">Frozen values, out-of-range, stale timestamps, missing data</p>
          </div>
          <span className="text-xs bg-red-900/40 text-red-400 border border-red-800 rounded px-2 py-1 font-bold">
            {qualityIssues.filter(i=>i.severity==='critical').length} CRITICAL
          </span>
        </div>
        <div className="divide-y divide-gray-800">
          {qualityIssues.map(q => (
            <div key={q.tag} className="px-5 py-4 flex items-start gap-4">
              <span className={`flex-shrink-0 font-mono font-bold text-xs pt-0.5 ${sevC[q.severity as keyof typeof sevC]}`}>{q.tag}</span>
              <div className="flex-1">
                <p className="text-white text-xs font-semibold">{q.issue}</p>
                <p className="text-gray-500 text-xs mt-0.5">Impact: {q.impact}</p>
              </div>
              <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded ${q.severity==='critical'?'bg-red-900/40 text-red-400':'bg-amber-900/40 text-amber-400'}`}>{q.severity.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* G-04: Protocol breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-3">Protocol Breakdown</h3>
          <div className="space-y-2">
            {PROTOCOL_BREAKDOWN.map(p => (
              <div key={p.protocol} className="flex items-center gap-3">
                <span className="text-gray-400 text-xs w-28 flex-shrink-0">{p.protocol}</span>
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width:`${p.pct}%` }} />
                </div>
                <span className="text-white font-mono text-xs w-12 text-right">{p.tags.toLocaleString()}</span>
                <span className="text-gray-500 text-xs w-8 text-right">{p.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* G-05: Schema normalization log */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <h3 className="text-white font-semibold text-sm">Schema Normalization Log</h3>
            <p className="text-gray-500 text-xs">ISA-88 / ISO 15926 tag normalization pipeline</p>
          </div>
          <div className="divide-y divide-gray-800">
            {NORM_LOG.map((n,i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <span style={{ width:6,height:6,borderRadius:'50%',background:normC[n.status as keyof typeof normC],flexShrink:0,marginTop:5 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold">{n.action}</p>
                  <p className="text-gray-500 text-xs">{n.detail}</p>
                </div>
                <span className="text-gray-600 text-xs flex-shrink-0">{n.ts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Block M: Operator Adoption & Training ─────────────────────────────────────

// M-01: User adoption metrics per site
const ADOPTION_METRICS = [
  { site:'Ras Tanura, KSA',  users:42, active:39, alertsActioned:94, avgResponseMin:8.2,  training:92, score:94 },
  { site:'Jamnagar, India',  users:38, active:34, alertsActioned:88, avgResponseMin:11.4, training:85, score:86 },
  { site:'Rotterdam, NL',    users:31, active:26, alertsActioned:79, avgResponseMin:14.1, training:74, score:74 },
  { site:'Houston, USA',     users:44, active:33, alertsActioned:72, avgResponseMin:16.8, training:68, score:68 },
  { site:'Ruwais, UAE',      users:36, active:24, alertsActioned:61, avgResponseMin:22.3, training:55, score:57 },
];

// M-02: Training module completion
const TRAINING_MODULES = [
  { module:'RefinerAI Fundamentals',       type:'mandatory', completionPct:88, avgScore:84, dueDate:'30 Apr' },
  { module:'Alert-to-Action Protocol',     type:'mandatory', completionPct:79, avgScore:79, dueDate:'30 Apr' },
  { module:'SHAP Explainability for Ops',  type:'optional',  completionPct:52, avgScore:77, dueDate:'—'      },
  { module:'Override & Audit Trail',       type:'mandatory', completionPct:91, avgScore:88, dueDate:'30 Apr' },
  { module:'Digital Twin Operations',      type:'optional',  completionPct:41, avgScore:81, dueDate:'—'      },
];

// M-03: Adoption barriers / feedback themes
const ADOPTION_BARRIERS = [
  { theme:'Too many alerts — hard to prioritise',  votes:28, priority:'high'   },
  { theme:'SHAP explanations not intuitive',       votes:21, priority:'high'   },
  { theme:'Mobile interface needed on field',      votes:17, priority:'medium' },
  { theme:'SAP integration adds extra steps',      votes:14, priority:'medium' },
  { theme:'Dashboard loads slowly on site network',votes:9,  priority:'low'    },
];

// M-04: Change champion network
const CHAMPIONS = [
  { name:'A. Rahman',  site:'Ruwais',   role:'Lead Maintenance Engineer', sessions:47, alertsActioned:118 },
  { name:'S. Nair',    site:'Jamnagar', role:'Senior Reliability Engineer',sessions:39, alertsActioned:94  },
  { name:'L. Müller',  site:'Rotterdam',role:'Process Engineer',          sessions:31, alertsActioned:71  },
  { name:'K. Johnson', site:'Houston',  role:'Maintenance Supervisor',    sessions:22, alertsActioned:48  },
];

const AdoptionTab: React.FC = () => {
  const [metrics, setMetrics] = useState(ADOPTION_METRICS);
  const [trainingMods, setTrainingMods] = useState(TRAINING_MODULES);
  const [barriers, setBarriers] = useState(ADOPTION_BARRIERS);
  const [champions, setChampions] = useState(CHAMPIONS);
  useEffect(() => {
    API.fetchAdoptionMetrics().then(list => {
      if (list.length > 0) setMetrics(list.map(a => ({
        site: a.site_id, users: a.total_users, active: a.active_users,
        alertsActioned: Math.round(a.avg_alert_action_rate_pct),
        avgResponseMin: a.avg_response_time_min,
        training: Math.round(a.training_completion_rate_pct),
        score: Math.round(a.adoption_score),
      })));
    }).catch(() => {});
    API.fetchTrainingModules().then(list => {
      if (list.length > 0) setTrainingMods(list.map(m => ({
        module: m.name, type: m.module_type,
        completionPct: Math.round(m.target_completion_pct), avgScore: 0, dueDate: '—',
      })));
    }).catch(() => {});
    API.fetchAdoptionBarriers().then(list => {
      if (list.length > 0) setBarriers(list.map(b => ({ theme: b.theme, votes: b.vote_count, priority: b.priority })));
    }).catch(() => {});
    API.fetchAdoptionChampions().then(list => {
      if (list.length > 0) setChampions(list.map(c => ({
        name: c.user_id, site: c.site_id, role: c.role,
        sessions: c.sessions_count, alertsActioned: c.alerts_actioned_count,
      })));
    }).catch(() => {});
  }, []);
  return (
  <div className="space-y-5">
    {/* M-01: KPIs */}
    <div className="grid grid-cols-4 gap-3">
      {([
        [String(metrics.reduce((s,a)=>s+a.active,0)), 'ACTIVE USERS',     'text-blue-400',  'border-blue-900/50'  ],
        [String(Math.round(metrics.reduce((s,a)=>s+a.alertsActioned,0)/Math.max(metrics.length,1)))+'%','AVG ALERT ACTION RATE','text-green-400','border-green-900/50'],
        [String(Math.round(metrics.reduce((s,a)=>s+a.avgResponseMin,0)/Math.max(metrics.length,1)))+'m','AVG RESPONSE TIME','text-amber-400','border-amber-900/50'],
        [String(Math.round(metrics.reduce((s,a)=>s+a.training,0)/Math.max(metrics.length,1)))+'%','TRAINING COMPLETION','text-purple-400','border-purple-900/50'],
      ] as [string,string,string,string][]).map(([v,l,t,b]) => (
        <div key={l} className={`bg-gray-900 border ${b} rounded-xl p-4`}>
          <p className={`text-2xl font-bold ${t}`}>{v}</p>
          <p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">{l}</p>
        </div>
      ))}
    </div>

    {/* M-01: Site adoption table */}
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800">
        <h3 className="text-white font-semibold text-sm">Site-by-Site Adoption Scorecard</h3>
        <p className="text-gray-500 text-xs">Active users · Alert action rate · Response time · Training completion</p>
      </div>
      <table className="w-full text-xs">
        <thead><tr className="border-b border-gray-800">
          {['Site','Users','Active','Alerts Actioned','Avg Response','Training','Score'].map(h => (
            <th key={h} className="px-4 py-2 text-left text-gray-500 uppercase tracking-wide font-semibold">{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {[...metrics].sort((a,b)=>b.score-a.score).map(a => (
            <tr key={a.site} className="border-b border-gray-800/50 hover:bg-gray-800/20">
              <td className="px-4 py-2 text-white font-semibold">{a.site}</td>
              <td className="px-4 py-2 text-gray-400">{a.users}</td>
              <td className="px-4 py-2 text-white">{a.active}</td>
              <td className="px-4 py-2 font-bold" style={{ color:a.alertsActioned>=85?'#22c55e':a.alertsActioned>=70?'#f59e0b':'#ef4444' }}>{a.alertsActioned}%</td>
              <td className="px-4 py-2 font-mono" style={{ color:a.avgResponseMin<=10?'#22c55e':a.avgResponseMin<=15?'#f59e0b':'#ef4444' }}>{a.avgResponseMin}m</td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-800 rounded-full"><div className="h-full rounded-full bg-purple-500" style={{ width:`${a.training}%` }} /></div>
                  <span className="text-white">{a.training}%</span>
                </div>
              </td>
              <td className="px-4 py-2 font-bold" style={{ color:a.score>=85?'#22c55e':a.score>=70?'#f59e0b':'#ef4444' }}>{a.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="grid grid-cols-2 gap-5">
      {/* M-02: Training modules */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">Training Module Progress</h3>
          <p className="text-gray-500 text-xs">Completion rate · Average assessment score</p>
        </div>
        <div className="divide-y divide-gray-800">
          {trainingMods.map(t => (
            <div key={t.module} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-white text-xs font-semibold">{t.module}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${t.type==='mandatory'?'bg-red-900/30 text-red-400':'bg-gray-800 text-gray-500'}`}>{t.type}</span>
                  <span className="text-gray-600 text-xs">Due: {t.dueDate}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full">
                  <div className="h-full rounded-full" style={{ width:`${t.completionPct}%`, background:t.completionPct>=80?'#22c55e':t.completionPct>=60?'#f59e0b':'#ef4444' }} />
                </div>
                <span className="text-xs text-white w-8 text-right">{t.completionPct}%</span>
                <span className="text-xs text-gray-500 w-16 text-right">Avg: {t.avgScore}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* M-03: Adoption barriers */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">Adoption Barriers — User Feedback</h3>
          <p className="text-gray-500 text-xs">Aggregated from in-app feedback surveys</p>
        </div>
        <div className="divide-y divide-gray-800">
          {barriers.map((b,i) => {
            const c = { high:'text-red-400', medium:'text-amber-400', low:'text-gray-500' };
            return (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-700 w-6 flex-shrink-0">{i+1}</span>
                <div className="flex-1">
                  <p className="text-white text-xs">{b.theme}</p>
                </div>
                <span className={`font-bold text-xs ${c[b.priority as keyof typeof c]}`}>{b.votes} votes</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>

    {/* M-04: Change champions */}
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800">
        <h3 className="text-white font-semibold text-sm">Change Champion Network</h3>
        <p className="text-gray-500 text-xs">Power users driving adoption across sites</p>
      </div>
      <div className="grid grid-cols-4 divide-x divide-gray-800">
        {champions.map(c => (
          <div key={c.name} className="p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-purple-900/40 border border-purple-800 flex items-center justify-center text-purple-400 font-bold text-lg mx-auto mb-2">
              {c.name[0]}
            </div>
            <p className="text-white text-xs font-semibold">{c.name}</p>
            <p className="text-gray-500 text-xs">{c.site}</p>
            <p className="text-gray-600 text-xs mt-0.5">{c.role}</p>
            <div className="mt-2 flex justify-center gap-3">
              <div className="text-center"><p className="text-blue-400 font-bold text-sm">{c.sessions}</p><p className="text-gray-600 text-xs">sessions</p></div>
              <div className="text-center"><p className="text-green-400 font-bold text-sm">{c.alertsActioned}</p><p className="text-gray-600 text-xs">actioned</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};

// ── Block O: Implementation Wave Tracker ─────────────────────────────────────

// O-01: Wave plan
const WAVE_PLAN = [
  { wave:'Wave 1 — Foundation',      period:'Jan–Jun 2026', sites:['Ras Tanura','Jamnagar'],       status:'in-progress', pctDone:78, budget:'$4.2M', modules:['Equipment Health','Live Alerts','AI Advisor','Work Orders'] },
  { wave:'Wave 2 — Scale',           period:'Jul–Dec 2026', sites:['Houston','Rotterdam'],          status:'planned',     pctDone:0,  budget:'$6.8M', modules:['Offshore Ops','Castrol Blending','OT Data','Compliance'] },
  { wave:'Wave 3 — Optimise',        period:'Jan–Jun 2027', sites:['Ruwais + all remaining sites'], status:'planned',     pctDone:0,  budget:'$9.1M', modules:['Edge AI','Digital Twin v2','Continuous Learning','Full ML Gov.'] },
];

// O-02: Milestone tracker
const MILESTONES = [
  { id:'MS-01', wave:1, milestone:'OSIsoft PI integration — Ras Tanura + Jamnagar', due:'28 Feb 2026', status:'done',        owner:'Data Engineering' },
  { id:'MS-02', wave:1, milestone:'Live Alerts + Alert-to-Action go-live',           due:'31 Mar 2026', status:'done',        owner:'Product' },
  { id:'MS-03', wave:1, milestone:'SAP PM/MM BAPI integration',                      due:'15 Apr 2026', status:'in-progress', owner:'ERP Integration' },
  { id:'MS-04', wave:1, milestone:'Wave 1 UAT + hypercare complete',                  due:'30 Jun 2026', status:'pending',     owner:'Delivery Lead' },
  { id:'MS-05', wave:2, milestone:'Houston + Rotterdam OT data onboarding',           due:'31 Aug 2026', status:'pending',     owner:'Data Engineering' },
  { id:'MS-06', wave:2, milestone:'Castrol blending quality go-live',                 due:'30 Sep 2026', status:'pending',     owner:'Product' },
];

// O-03: Risk register
const WAVE_RISKS = [
  { id:'R-01', risk:'SAP BTP integration complexity underestimated',       impact:'Schedule delay 4–6 weeks',     prob:'high',   mitigation:'Dedicated SAP architect engaged',       status:'open'     },
  { id:'R-02', risk:'OT network firewalls block PI tag data at Houston',   impact:'Wave 2 data quality issues',   prob:'medium', mitigation:'IT/OT network architecture review',      status:'in-progress' },
  { id:'R-03', risk:'Operator adoption below 70% at Ruwais',               impact:'Value realisation shortfall',  prob:'medium', mitigation:'Change champion programme accelerated',   status:'open'     },
  { id:'R-04', risk:'GDPR constraints on personal data in AI training',     impact:'Model retraining blocked EU',  prob:'low',    mitigation:'Legal review + anonymisation pipeline',   status:'closed'   },
];

// O-04: Budget vs actuals
const BUDGET_ACTUALS = [
  { wave:'Wave 1', budget:4.2, actual:3.6, forecast:4.4 },
  { wave:'Wave 2', budget:6.8, actual:0,   forecast:7.1 },
  { wave:'Wave 3', budget:9.1, actual:0,   forecast:9.1 },
];

const WaveTrackerTab: React.FC = () => {
  const msC = { done:'text-green-400', 'in-progress':'text-blue-400', pending:'text-gray-500' };
  const msDot = { done:'#22c55e', 'in-progress':'#60a5fa', pending:'#374151' };
  const probC = { high:'text-red-400 bg-red-900/40', medium:'text-amber-400 bg-amber-900/30', low:'text-gray-500 bg-gray-800' };
  const [wavePlan, setWavePlan] = useState(WAVE_PLAN);
  useEffect(() => {
    API.fetchWaves().then(list => {
      if (list.length > 0) setWavePlan(list.map(w => ({
        wave: w.wave_name,
        period: `${new Date(w.period_start).toLocaleDateString('en-GB',{month:'short',year:'numeric'})} – ${new Date(w.period_end).toLocaleDateString('en-GB',{month:'short',year:'numeric'})}`,
        sites: [] as string[], status: w.status,
        pctDone: Math.round(w.pct_complete),
        budget: `$${(w.budget_usd/1_000_000).toFixed(1)}M`,
        modules: [] as string[],
      })));
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-5">
      {/* O-04: Budget summary KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {BUDGET_ACTUALS.map(b => (
          <div key={b.wave} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">{b.wave}</p>
            <p className="text-white text-2xl font-bold">${b.budget}M</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-green-400 text-xs">Actual: ${b.actual}M</span>
              <span className="text-gray-600 text-xs">·</span>
              <span className="text-amber-400 text-xs">Forecast: ${b.forecast}M</span>
            </div>
          </div>
        ))}
      </div>

      {/* O-01: Wave cards */}
      <div className="space-y-4">
        {wavePlan.map(w => (
          <div key={w.wave} className={`bg-gray-900 border rounded-xl p-5 ${w.status==='in-progress'?'border-blue-800':'border-gray-800'}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-white font-semibold">{w.wave}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${w.status==='in-progress'?'bg-blue-900/40 text-blue-400':'bg-gray-800 text-gray-500'}`}>{w.status.toUpperCase()}</span>
                </div>
                <p className="text-gray-500 text-xs">{w.period} · Budget: {w.budget} · Sites: {w.sites.join(', ')}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-xl">{w.pctDone}%</p>
                <p className="text-gray-500 text-xs">complete</p>
              </div>
            </div>
            {w.status === 'in-progress' && (
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full bg-blue-500" style={{ width:`${w.pctDone}%` }} />
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {w.modules.map(m => <span key={m} className="text-xs bg-gray-800 text-gray-400 rounded px-2 py-0.5">{m}</span>)}
            </div>
          </div>
        ))}
      </div>

      {/* O-02: Milestone tracker */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">Milestone Tracker</h3>
          <p className="text-gray-500 text-xs">Cross-wave delivery milestones · Owner accountability</p>
        </div>
        <div className="divide-y divide-gray-800">
          {MILESTONES.map(m => (
            <div key={m.id} className="px-5 py-4 flex items-start gap-4">
              <span className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5" style={{ background:msDot[m.status as keyof typeof msDot] }} />
              <div className="flex-1">
                <p className={`text-xs font-semibold ${msC[m.status as keyof typeof msC]}`}>{m.milestone}</p>
                <p className="text-gray-500 text-xs mt-0.5">Wave {m.wave} · Owner: {m.owner} · Due: {m.due}</p>
              </div>
              <span className={`flex-shrink-0 text-xs font-bold ${msC[m.status as keyof typeof msC]}`}>{m.status.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* O-03: Risk register */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">Delivery Risk Register</h3>
          <p className="text-gray-500 text-xs">Programme risks · Probability · Mitigation status</p>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-gray-800">
            {['ID','Risk','Impact','Prob','Mitigation','Status'].map(h => (
              <th key={h} className="px-4 py-2 text-left text-gray-500 uppercase tracking-wide font-semibold">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {WAVE_RISKS.map(r => (
              <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                <td className="px-4 py-2 text-gray-500 font-mono">{r.id}</td>
                <td className="px-4 py-2 text-white">{r.risk}</td>
                <td className="px-4 py-2 text-gray-400">{r.impact}</td>
                <td className="px-4 py-2"><span className={`text-xs font-bold px-1.5 py-0.5 rounded ${probC[r.prob as keyof typeof probC]}`}>{r.prob.toUpperCase()}</span></td>
                <td className="px-4 py-2 text-gray-400">{r.mitigation}</td>
                <td className="px-4 py-2">
                  <span className={r.status==='closed'?'text-green-400':r.status==='in-progress'?'text-amber-400':'text-red-400'} style={{ fontWeight:600 }}>{r.status.toUpperCase()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Block P: Cross-Domain Orchestration Panel ────────────────────────────────

// P-01: Active orchestration scenarios
const ORCHESTRATION_EVENTS = [
  { id:'ORC-001', trigger:'C-101 bearing failure probability >90%',  domains:['Equipment Health','Work Orders','Spare Parts','SAP PM'], status:'active',   impact:'Cascade: WO auto-drafted → parts reserved → crew notified' },
  { id:'ORC-002', trigger:'Ras Tanura CDU throughput anomaly +18%',   domains:['Digital Twin','Energy','OT Data','AI Advisor'],         status:'active',   impact:'Twin simulation running → energy model updated' },
  { id:'ORC-003', trigger:'API 570 Houston compliance due in 19 days', domains:['Compliance','Work Orders','Wave Tracker'],              status:'pending',  impact:'Inspection WO to be auto-raised by 14 Apr' },
  { id:'ORC-004', trigger:'Offshore Brent-C weather UNSAFE forecast',  domains:['North Sea Ops','TAR Planning','Logistics'],            status:'resolved', impact:'PSV departure deferred 48h; crew change rescheduled' },
];

// P-02: Agent health (cross-domain agents status)
const AGENT_HEALTH = [
  { agent:'PredictiveMaintenance',    domain:'Equipment',   calls24h:4821, latency:42,   status:'healthy' },
  { agent:'CastrolQuality',           domain:'Blending',    calls24h:1240, latency:68,   status:'healthy' },
  { agent:'OffshoreOps',              domain:'North Sea',   calls24h:892,  latency:88,   status:'healthy' },
  { agent:'ComplianceMonitor',        domain:'Regulatory',  calls24h:312,  latency:121,  status:'degraded'},
  { agent:'EnergyOptimisation',       domain:'Sustainability',calls24h:1860, latency:55, status:'healthy' },
];

// P-03: Event bus throughput (messages/min, 12-point history)
const EVENT_BUS_THROUGHPUT = [120,135,142,138,155,162,158,171,180,174,188,194];

const CrossDomainPanel: React.FC = () => {
  const W = 480, H = 60, PL = 8, PR = 8;
  const cW = W - PL - PR;
  const minT = Math.min(...EVENT_BUS_THROUGHPUT) - 10;
  const maxT = Math.max(...EVENT_BUS_THROUGHPUT) + 10;
  const xT = (i:number) => PL + (i/(EVENT_BUS_THROUGHPUT.length-1))*cW;
  const yT = (v:number) => H - 6 - ((v-minT)/(maxT-minT))*(H-12);
  const tPts = EVENT_BUS_THROUGHPUT.map((v,i) => `${xT(i).toFixed(1)},${yT(v).toFixed(1)}`).join(' ');
  const agentC = { healthy:'#22c55e', degraded:'#f59e0b', offline:'#ef4444' };
  const stC = { active:'text-green-400 bg-green-900/30', pending:'text-amber-400 bg-amber-900/30', resolved:'text-gray-500 bg-gray-800' };

  return (
    <div className="space-y-4">
      {/* P-03: Event bus throughput */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-white font-semibold text-sm">Cross-Domain Event Bus — Throughput</h3>
            <p className="text-gray-500 text-xs">Messages per minute · API Gateway routing · All 6 domains</p>
          </div>
          <div className="text-right">
            <p className="text-green-400 font-bold text-xl">{EVENT_BUS_THROUGHPUT[EVENT_BUS_THROUGHPUT.length-1]}</p>
            <p className="text-gray-500 text-xs">msg/min</p>
          </div>
        </div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height:H }}>
          <polyline points={tPts} fill="none" stroke="#34d399" strokeWidth="2" strokeLinejoin="round" />
          {EVENT_BUS_THROUGHPUT.map((v,i) => (
            <circle key={i} cx={xT(i)} cy={yT(v)} r="2.5" fill={i===EVENT_BUS_THROUGHPUT.length-1?'#34d399':'#34d399'} opacity={i===EVENT_BUS_THROUGHPUT.length-1?1:0.4} />
          ))}
        </svg>
      </div>

      {/* P-01: Active orchestration events */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">Cross-Domain Orchestration Events</h3>
          <p className="text-gray-500 text-xs">AI-triggered cascades spanning multiple domains</p>
        </div>
        <div className="divide-y divide-gray-800">
          {ORCHESTRATION_EVENTS.map(e => (
            <div key={e.id} className="px-5 py-4 flex items-start gap-4">
              <span className="flex-shrink-0 text-xs font-mono text-gray-500 pt-0.5">{e.id}</span>
              <div className="flex-1">
                <p className="text-white text-xs font-semibold">{e.trigger}</p>
                <div className="flex flex-wrap gap-1 my-1">
                  {e.domains.map(d => <span key={d} className="text-xs bg-indigo-900/30 text-indigo-400 border border-indigo-800/30 rounded px-1.5 py-0.5">{d}</span>)}
                </div>
                <p className="text-gray-500 text-xs">{e.impact}</p>
              </div>
              <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded ${stC[e.status as keyof typeof stC]}`}>{e.status.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* P-02: Agent health grid */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-3">Cross-Domain Agent Health</h3>
        <div className="grid grid-cols-5 gap-3">
          {AGENT_HEALTH.map(a => (
            <div key={a.agent} className="bg-gray-800/50 rounded-lg p-3 text-center">
              <span className="inline-block w-2 h-2 rounded-full mb-2" style={{ background:agentC[a.status as keyof typeof agentC] }} />
              <p className="text-white text-xs font-semibold leading-tight">{a.agent}</p>
              <p className="text-gray-500 text-xs mt-0.5">{a.domain}</p>
              <p className="text-gray-400 text-xs font-mono mt-1">{a.calls24h.toLocaleString()} calls/24h</p>
              <p className="text-gray-500 text-xs">{a.latency}ms p50</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Block Q: Edge AI Infrastructure ──────────────────────────────────────────

// Q-01: Edge node inventory
const EDGE_NODES = [
  { id:'EDGE-RUW-01', site:'Ruwais, UAE',      hw:'NVIDIA Jetson AGX',  models:3, inferencePct:91, latency:12,  status:'online',  lastSync:'30s ago' },
  { id:'EDGE-JAM-01', site:'Jamnagar, India',  hw:'Intel NUC i7',       models:2, inferencePct:88, latency:18,  status:'online',  lastSync:'1m ago'  },
  { id:'EDGE-HOU-01', site:'Houston, USA',     hw:'NVIDIA Jetson Nano', models:2, inferencePct:78, latency:24,  status:'online',  lastSync:'45s ago' },
  { id:'EDGE-ROT-01', site:'Rotterdam, NL',    hw:'NVIDIA Jetson AGX',  models:3, inferencePct:94, latency:9,   status:'online',  lastSync:'15s ago' },
  { id:'EDGE-TERN-01',site:'Tern Alpha (Offshr)',hw:'Ruggedised NUC',   models:2, inferencePct:82, latency:28,  status:'degraded',lastSync:'8m ago'  },
];

// Q-02: Edge vs cloud latency comparison
const LATENCY_COMPARISON = [
  { scenario:'Critical bearing alert detection', edge:12,  cloud:280, saving:'95.7%' },
  { scenario:'Anomaly isolation forest',          edge:18,  cloud:410, saving:'95.6%' },
  { scenario:'Vibration FFT analysis',            edge:24,  cloud:560, saving:'95.7%' },
  { scenario:'Quality prediction (Castrol)',       edge:31,  cloud:340, saving:'90.9%' },
];

// Q-03: Models deployed to edge
const EDGE_MODELS = [
  { model:'Bearing Fault LSTM (quantised)',   version:'v3.2.1-edge', size:'48MB',  nodes:['EDGE-RUW-01','EDGE-JAM-01','EDGE-HOU-01','EDGE-ROT-01'] },
  { model:'Anomaly Isolation Forest',          version:'v2.1.3-edge', size:'12MB',  nodes:['EDGE-RUW-01','EDGE-ROT-01','EDGE-TERN-01'] },
  { model:'Vibration Signature CNN (int8)',     version:'v1.4.2-edge', size:'68MB',  nodes:['EDGE-RUW-01','EDGE-JAM-01','EDGE-ROT-01'] },
];

const EdgeAITab: React.FC = () => {
  const nodeC = { online:'text-green-400', degraded:'text-amber-400', offline:'text-red-400' };
  const [edgeNodes, setEdgeNodes] = useState(EDGE_NODES);
  const [latencyData, setLatencyData] = useState(LATENCY_COMPARISON);
  useEffect(() => {
    API.fetchEdgeNodes().then(list => {
      if (list.length > 0) setEdgeNodes(list.map(n => ({
        id: n.node_code, site: n.site_id, hw: n.hardware_spec,
        models: 0, inferencePct: Math.round(n.inference_offload_pct),
        latency: Math.round(n.avg_latency_ms), status: n.status,
        lastSync: n.last_sync_label ?? 'N/A',
      })));
    }).catch(() => {});
    API.fetchLatencyBenchmarks().then(list => {
      if (list.length > 0) setLatencyData(list.map(b => ({
        scenario: b.scenario_description,
        edge: Math.round(b.edge_latency_ms), cloud: Math.round(b.cloud_latency_ms),
        saving: `${b.latency_saving_pct.toFixed(1)}%`,
      })));
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-5">
      {/* Q-01: KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {([
          [String(edgeNodes.length),                                   'EDGE NODES',         'text-blue-400',   'border-blue-900/50'  ],
          [String(edgeNodes.filter(n=>n.status==='online').length),    'ONLINE',             'text-green-400',  'border-green-900/50' ],
          [Math.round(edgeNodes.reduce((s,n)=>s+n.inferencePct,0)/Math.max(edgeNodes.length,1))+'%', 'AVG INFERENCE OFFLOAD', 'text-purple-400', 'border-purple-900/50'],
          [Math.round(edgeNodes.reduce((s,n)=>s+n.latency,0)/Math.max(edgeNodes.length,1))+'ms',     'AVG INFERENCE LATENCY', 'text-amber-400',  'border-amber-900/50' ],
        ] as [string,string,string,string][]).map(([v,l,t,b]) => (
          <div key={l} className={`bg-gray-900 border ${b} rounded-xl p-4`}>
            <p className={`text-2xl font-bold ${t}`}>{v}</p>
            <p className="text-gray-500 text-xs uppercase tracking-wide mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      {/* Q-01: Edge node table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">Edge Node Inventory</h3>
          <p className="text-gray-500 text-xs">On-premise AI inference · Air-gapped-capable · OT network–safe</p>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-gray-800">
            {['Node ID','Site','Hardware','Models','Inference Offload','Latency','Status','Last Sync'].map(h => (
              <th key={h} className="px-3 py-2 text-left text-gray-500 uppercase tracking-wide font-semibold">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {edgeNodes.map(n => (
              <tr key={n.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                <td className="px-3 py-2 text-purple-400 font-mono">{n.id}</td>
                <td className="px-3 py-2 text-white">{n.site}</td>
                <td className="px-3 py-2 text-gray-400">{n.hw}</td>
                <td className="px-3 py-2 text-white text-center">{n.models}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-gray-800 rounded-full"><div className="h-full rounded-full bg-purple-500" style={{ width:`${n.inferencePct}%` }} /></div>
                    <span className="text-white font-mono">{n.inferencePct}%</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-white font-mono">{n.latency}ms</td>
                <td className="px-3 py-2 font-bold"><span className={nodeC[n.status as keyof typeof nodeC]}>{n.status.toUpperCase()}</span></td>
                <td className="px-3 py-2 text-gray-400">{n.lastSync}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Q-02: Edge vs cloud latency */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">Edge vs Cloud Latency Comparison</h3>
          <p className="text-gray-500 text-xs">On-device inference vs cloud round-trip · Critical for OT safety response</p>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-gray-800">
            {['Scenario','Edge (ms)','Cloud (ms)','Latency Saving'].map(h => (
              <th key={h} className="px-4 py-2 text-left text-gray-500 uppercase tracking-wide font-semibold">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {latencyData.map(l => (
              <tr key={l.scenario} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                <td className="px-4 py-2 text-white">{l.scenario}</td>
                <td className="px-4 py-2 text-green-400 font-mono font-bold">{l.edge}ms</td>
                <td className="px-4 py-2 text-gray-400 font-mono">{l.cloud}ms</td>
                <td className="px-4 py-2 text-green-400 font-bold">{l.saving}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Q-03: Edge model deployments */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">Edge Model Deployments</h3>
          <p className="text-gray-500 text-xs">Quantised models deployed to edge nodes · OTA update capable</p>
        </div>
        <div className="divide-y divide-gray-800">
          {EDGE_MODELS.map(m => (
            <div key={m.model} className="px-5 py-4 flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white text-xs font-semibold">{m.model}</p>
                  <span className="text-gray-500 font-mono text-xs">{m.version}</span>
                  <span className="text-gray-600 text-xs">{m.size}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {m.nodes.map(n => <span key={n} className="text-xs bg-gray-800 text-gray-400 rounded px-1.5 py-0.5 font-mono">{n}</span>)}
                </div>
              </div>
              <span className="text-green-400 text-xs font-bold">DEPLOYED</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const RefinerAIPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [tourOpen, setTourOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const handleTourTabChange = React.useCallback((tab: TabId) => setActiveTab(tab), []);

  return (
    <div style={{ minHeight: '100vh', background: '#030712', color: '#f9fafb', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {tourOpen && <TourOverlay onClose={() => setTourOpen(false)} onTabChange={handleTourTabChange} />}
      <AuditLogPanel
        isOpen={auditOpen}
        onClose={() => setAuditOpen(false)}
        domainId="05-manufacturing-plant-operations"
        title="Refiner AI — Audit Log"
        fallbackData={ALL_REFINER_AI_AUDIT_LOGS}
      />

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
                onClick={() => setAuditOpen(true)}
                style={{ fontSize: 12, color: '#22c55e', background: '#052e16', border: '1px solid #15803d', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
              >
                🔍 Audit Log
              </button>
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

          {/* Specialty */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 8 }}>Specialty</p>
            {[
              { id: 'castrol',      label: 'Castrol Blending', icon: '⬡' },
              { id: 'offshore',     label: 'North Sea Ops',    icon: '⛽' },
              { id: 'ot-data',      label: 'OT Data',          icon: '⊡' },
              { id: 'adoption',     label: 'Adoption',         icon: '◑' },
              { id: 'wave-tracker', label: 'Wave Tracker',     icon: '≋' },
              { id: 'edge-ai',      label: 'Edge AI',          icon: '⬡' },
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
