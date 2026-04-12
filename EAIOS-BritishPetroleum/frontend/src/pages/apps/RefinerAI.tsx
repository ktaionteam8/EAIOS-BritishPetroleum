import React, { useState } from 'react';
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
        {/* Simplified continent outlines via SVG */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }} viewBox="0 0 800 400">
          {/* North America */}
          <ellipse cx="160" cy="170" rx="100" ry="80" fill="#4b5563"/>
          {/* South America */}
          <ellipse cx="200" cy="310" rx="55" ry="70" fill="#4b5563"/>
          {/* Europe */}
          <ellipse cx="420" cy="140" rx="50" ry="45" fill="#4b5563"/>
          {/* Africa */}
          <ellipse cx="430" cy="270" rx="60" ry="75" fill="#4b5563"/>
          {/* Asia */}
          <ellipse cx="600" cy="170" rx="130" ry="80" fill="#4b5563"/>
          {/* Australia */}
          <ellipse cx="660" cy="320" rx="55" ry="40" fill="#4b5563"/>
        </svg>
        {/* Refinery dots */}
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

// ── Equipment Health Tab ──────────────────────────────────────────────────────
const EquipmentHealthTab: React.FC = () => (
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
  </div>
);

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
const AI_MESSAGES = [
  { role: 'user', text: 'What is the recommended action for Compressor C-101 at Ruwais?' },
  { role: 'ai', text: 'Based on LSTM vibration analysis and bearing temperature trends, C-101 shows a 97.3% probability of inner-race bearing failure within 48 hours.\n\n**Recommended immediate actions:**\n1. Dispatch maintenance crew — Level 3 rotating equipment specialists\n2. Source MAN Turbomachinery bearing assembly Part #7B-2241-ZZ (2 units)\n3. Schedule 6-hour planned shutdown window within next 12 hours\n4. Prepare alignment tools and lube oil flush kit\n\n**Cost of action:** ~$18,400 labour + parts\n**Cost of failure:** ~$2.1M unplanned shutdown + secondary damage', sources: ['LSTM Model v4.2','OEM Manual MAN-7B','Historical Failure DB (143 cases)'] },
  { role: 'user', text: 'What spare parts should we pre-order for the next 30 days?' },
  { role: 'ai', text: 'Based on predictive failure probabilities across all 40 refineries, here are the **top 5 parts to pre-order in the next 30 days:**\n\n| Part | Equipment | Prob. | Lead Time |\n|------|-----------|-------|-----------|\n| Bearing 7B-2241-ZZ | C-101, C-204 | 97% | 3 days |\n| Mechanical Seal Kit MS-400 | P-205, P-301 | 78% | 5 days |\n| Impeller Set IP-100-8 | P-205 | 64% | 14 days |\n| Lube Oil Filter LF-7A | K-302 | 42% | 2 days |\n| Coupling Half CH-SGT8 | K-302 | 38% | 21 days |\n\nEstimated total procurement: $284,000 · Potential downtime avoided: $6.8M', sources: ['XGBoost Failure Classifier','Inventory DB','CMMS Oracle'] },
];

const AiAdvisorTab: React.FC = () => {
  const [input, setInput] = React.useState('');
  return (
    <div className="space-y-4">
      {/* AI Model Stack Banner */}
      <div className="bg-gray-900 border border-purple-900/50 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🧠</div>
          <div>
            <p className="text-white font-semibold text-sm">RefinerAI Advisor — RAG-Augmented Maintenance Intelligence</p>
            <p className="text-gray-500 text-xs">Powered by LSTM · XGBoost · Prophet · OEM Manuals · 143K historical failure records</p>
          </div>
        </div>
        <span className="text-xs bg-green-900/40 text-green-400 px-3 py-1 rounded-full border border-green-900">● Online</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Chat panel */}
        <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-xl flex flex-col" style={{ height: 520 }}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
            <h3 className="text-white font-semibold text-sm">AI Chat — Ask anything about your equipment</h3>
            <span className="text-xs text-gray-500 font-mono">GPT-4o + RAG · 143K docs indexed</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {AI_MESSAGES.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div style={{ maxWidth: '85%' }}>
                  {m.role === 'ai' && (
                    <div className="flex items-center gap-2 mb-1">
                      <div style={{ width: 20, height: 20, borderRadius: 6, background: 'linear-gradient(135deg,#7c3aed,#2563eb)', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🧠</div>
                      <span className="text-purple-400 text-xs font-semibold">RefinerAI Advisor</span>
                    </div>
                  )}
                  <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${m.role === 'user' ? 'bg-purple-900/50 text-white' : 'bg-gray-800 text-gray-200'}`}>
                    {m.text}
                  </div>
                  {m.role === 'ai' && m.sources && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {m.sources.map(s => (
                        <span key={s} className="text-xs bg-gray-800 text-gray-500 border border-gray-700 px-2 py-0.5 rounded-full">📎 {s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about equipment health, failure risk, spare parts, work orders..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-700"
              />
              <button className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Send</button>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {['Analyse C-101 bearing failure', 'Top 5 at-risk equipment this week', 'Generate work order for P-205', 'What is RUL for T-405?'].map(q => (
                <button key={q} onClick={() => setInput(q)} className="text-xs text-purple-400 border border-purple-900/50 px-2 py-1 rounded-full hover:bg-purple-900/20 transition-colors">{q}</button>
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
            <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-3">AI Model Stack</p>
            <div className="space-y-2">
              {[['LSTM','Vibration anomaly detection'],['XGBoost','Failure classification'],['Prophet','RUL time-series forecast'],['CNN','Thermography analysis']].map(([m,d]) => (
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
