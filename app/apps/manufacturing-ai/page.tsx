"use client";

import { useEffect, useState } from "react";
import {
  Activity, AlertTriangle, DollarSign, Factory, Gauge, MapPin, Sparkles, TrendingUp,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TopBar } from "@/components/TopBar";
import { KpiCard } from "@/components/KpiCard";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import {
  generateAgentHealth, generateBenchmarks, generateCrossDomainEvents,
  generateFailurePredictions, generateRefineries,
  type AgentHealth, type Benchmark, type CrossDomainEvent, type FailurePrediction, type Refinery,
} from "@/lib/manufacturing-data";

export default function ManufacturingAI() {
  const [refineries, setRefineries] = useState<Refinery[]>([]);
  const [predictions, setPredictions] = useState<FailurePrediction[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [agents, setAgents] = useState<AgentHealth[]>([]);
  const [events, setEvents] = useState<CrossDomainEvent[]>([]);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      const r = generateRefineries();
      setRefineries(r);
      setPredictions(generateFailurePredictions());
      setBenchmarks(generateBenchmarks(r));
      setAgents(generateAgentHealth());
      setEvents(generateCrossDomainEvents());
    };
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, []);

  const totalAlerts = refineries.reduce((a, r) => a + r.alerts, 0);
  const avgOEE = refineries.length ? Math.round(refineries.reduce((a, r) => a + r.oee, 0) / refineries.length) : 0;
  const equipmentMonitored = 1240 + Math.floor(Math.random() * 5);
  const avoidedCost = "$18.4M";
  const criticalCount = refineries.filter((r) => r.status === "critical").length;

  return (
    <>
      <TopBar
        systemStatus={criticalCount > 0 ? "critical" : totalAlerts > 5 ? "warning" : "normal"}
        alertCount={totalAlerts}
      />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Factory className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-100">Manufacturing AI Cockpit</h1>
              <p className="text-sm text-slate-400 mt-0.5">Refinery operations · 6 AI agents · 7 sites · auto-refresh every 4s</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
            <Sparkles className="h-3 w-3" /> Powered by EAIOS
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Equipment Monitored" value={equipmentMonitored.toLocaleString()} icon={Activity} tone="blue" delta="+ 23 today" />
          <KpiCard label="Active Alerts" value={totalAlerts} icon={AlertTriangle} tone="amber" delta={`${criticalCount} critical`} />
          <KpiCard label="Avoided Cost (YTD)" value={avoidedCost} icon={DollarSign} tone="emerald" delta="vs baseline" />
          <KpiCard label="Fleet OEE" value={`${avgOEE}%`} icon={Gauge} tone="blue" delta={avgOEE >= 80 ? "above target" : "below target"} />
        </div>

        {/* MAP + TIMELINE */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 rounded-2xl bg-bg-800 border border-bg-700 p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-cyan-400" /> Global Refinery Fleet
              </h3>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Healthy</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />Warning</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" />Critical</span>
              </div>
            </div>

            {/* Pseudo-map: world grid with dots positioned by lat/lng */}
            <div className="relative w-full aspect-[2/1] rounded-xl bg-gradient-to-br from-bg-900 to-bg-700 border border-bg-700 overflow-hidden">
              <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 20 10">
                {Array.from({ length: 20 }).map((_, i) => <line key={`v${i}`} x1={i} y1={0} x2={i} y2={10} stroke="#6366f1" strokeWidth="0.02" />)}
                {Array.from({ length: 10 }).map((_, i) => <line key={`h${i}`} x1={0} y1={i} x2={20} y2={i} stroke="#6366f1" strokeWidth="0.02" />)}
              </svg>
              {refineries.map((r) => {
                const x = ((r.lng + 180) / 360) * 100;
                const y = ((90 - r.lat) / 180) * 100;
                const color = r.status === "critical" ? "bg-red-400" : r.status === "warning" ? "bg-amber-400" : "bg-emerald-400";
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedSite(r.id === selectedSite ? null : r.id)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <span className={`block h-3 w-3 rounded-full ${color} ring-2 ring-bg-900 ${r.status !== "healthy" ? "animate-pulse" : ""}`} />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-bg-900 text-[10px] text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none border border-bg-700">
                      {r.name} · OEE {r.oee}%
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              {refineries.slice(0, 4).map((r) => (
                <div key={r.id} className="p-2 rounded-lg bg-bg-700/50 border border-bg-700 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-100 font-medium">{r.name}</span>
                    <StatusBadge status={r.status === "healthy" ? "normal" : r.status} size="sm" />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">OEE {r.oee}% · {r.alerts} alerts</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl bg-bg-800 border border-bg-700 p-5 shadow-card">
            <h3 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-400" /> Failure Prediction Timeline (90-day)
            </h3>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {predictions.map((p) => {
                const color = p.severity === "critical" ? "bg-red-400" : p.severity === "high" ? "bg-amber-400" : p.severity === "medium" ? "bg-blue-400" : "bg-emerald-400";
                const border = p.severity === "critical" ? "border-red-500/30" : p.severity === "high" ? "border-amber-500/30" : "border-bg-700";
                return (
                  <div key={p.equipment_id} className={`p-2.5 rounded-lg bg-bg-700/30 border ${border}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-100 truncate">{p.equipment}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${color} text-bg-900 font-mono font-bold uppercase`}>{p.severity}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>{p.site} · {p.days_until}d</span>
                      <span className="font-mono">{p.predicted_failure_date}</span>
                    </div>
                    <div className="mt-1.5">
                      <ConfidenceBar value={p.confidence} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* BENCHMARKING + AGENT HEALTH */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-bg-800 border border-bg-700 p-5 shadow-card">
            <h3 className="text-sm font-semibold text-slate-100 mb-4">Multi-site Benchmarking</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={benchmarks} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="#1f2a47" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis type="category" dataKey="site" stroke="#64748b" fontSize={11} width={90} />
                <Tooltip contentStyle={{ backgroundColor: "#101627", border: "1px solid #1f2a47", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="oee" fill="#06b6d4" name="OEE %" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
              <div className="text-center">
                <div className="text-slate-500">Top site</div>
                <div className="text-slate-100 font-semibold">{benchmarks[0]?.site}</div>
              </div>
              <div className="text-center">
                <div className="text-slate-500">Avg MTBF</div>
                <div className="text-slate-100 font-semibold">
                  {Math.round(benchmarks.reduce((a, b) => a + b.mtbf_hours, 0) / (benchmarks.length || 1))}h
                </div>
              </div>
              <div className="text-center">
                <div className="text-slate-500">Avg MTTR</div>
                <div className="text-slate-100 font-semibold">
                  {Math.round(benchmarks.reduce((a, b) => a + b.mttr_hours, 0) / (benchmarks.length || 1))}h
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-bg-800 border border-bg-700 p-5 shadow-card">
            <h3 className="text-sm font-semibold text-slate-100 mb-4">Agent Health Panel</h3>
            <div className="space-y-2">
              {agents.map((a) => (
                <div key={a.agent} className="p-3 rounded-lg bg-bg-700/40 border border-bg-700 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-100">{a.agent}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono ${a.status === "healthy" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>{a.status}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {a.calls_per_day.toLocaleString()} calls/d · {a.latency_ms}ms p95 · {a.uptime_pct}% uptime
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-slate-300">{a.uptime_pct}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CROSS-DOMAIN EVENTS */}
        <div className="rounded-2xl bg-bg-800 border border-bg-700 p-5 shadow-card">
          <h3 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" /> Cross-Domain AI Events
          </h3>
          <div className="space-y-2">
            {events.map((e) => (
              <div key={e.id} className="p-3 rounded-lg bg-bg-700/30 border border-bg-700 flex items-start gap-3">
                <span className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${e.severity === "critical" ? "bg-red-400 animate-pulse" : e.severity === "warning" ? "bg-amber-400" : "bg-blue-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-100">{e.trigger}</div>
                  <div className="text-xs text-slate-400 mt-0.5">→ {e.impact}</div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">
                  {new Date(e.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
