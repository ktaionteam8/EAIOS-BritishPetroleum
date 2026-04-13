"use client";

import { useEffect, useState } from "react";
import { BarChart3, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TopBar } from "@/components/TopBar";
import { KpiCard } from "@/components/KpiCard";
import { DOMAINS } from "@/lib/domains";
import { fetchAllDomains } from "@/lib/api";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

interface Task {
  id: string;
  status: string;
  domain: string;
  priority: string;
}

export default function CEODashboard() {
  const { data: domains } = useAutoRefresh(fetchAllDomains, 5000);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const load = async () => {
      const r = await fetch("/api/tasks?view=all");
      const d = await r.json();
      setTasks(d.tasks);
    };
    load();
    const id = setInterval(load, 6000);
    return () => clearInterval(id);
  }, []);

  const doms = domains ?? [];
  const domainBars = doms.map((d) => ({
    name: d.name.split(" ")[0],
    confidence: Math.round(d.confidence * 100),
    alerts: d.alertCount,
  }));

  const taskByStatus = {
    created: tasks.filter((t) => t.status === "created").length,
    approved: tasks.filter((t) => t.status === "approved").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  const completionRate = tasks.length
    ? Math.round((taskByStatus.completed / tasks.length) * 100)
    : 100;

  const trendData = Array.from({ length: 12 }, (_, i) => ({
    t: `${i + 1}h`,
    health: 70 + Math.sin(i / 2) * 10 + Math.random() * 8,
    tasks: Math.round(Math.random() * 15),
  }));

  const criticalDomains = doms.filter((d) => d.status === "critical").length;

  return (
    <>
      <TopBar systemStatus={criticalDomains > 0 ? "critical" : "normal"} alertCount={doms.reduce((a, d) => a + d.alertCount, 0)} />
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">CEO Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Enterprise-wide performance across 6 domains</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Domains Online" value={`${DOMAINS.length}/${DOMAINS.length}`} icon={BarChart3} tone="blue" />
          <KpiCard label="Task Completion" value={`${completionRate}%`} icon={CheckCircle2} tone="emerald" />
          <KpiCard label="Active Tasks" value={taskByStatus.in_progress + taskByStatus.approved} icon={TrendingUp} tone="amber" />
          <KpiCard label="Managers" value={6} icon={Users} tone="blue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-bg-800 border border-bg-700 p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-4">Domain Confidence vs Alerts</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={domainBars}>
                <CartesianGrid stroke="#1f2a47" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#101627", border: "1px solid #1f2a47", borderRadius: "8px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                <Bar dataKey="confidence" fill="#6366f1" name="Confidence %" radius={[6, 6, 0, 0]} />
                <Bar dataKey="alerts" fill="#f59e0b" name="Alerts" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl bg-bg-800 border border-bg-700 p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-4">System Health Trend (12h)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}>
                <CartesianGrid stroke="#1f2a47" strokeDasharray="3 3" />
                <XAxis dataKey="t" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#101627", border: "1px solid #1f2a47", borderRadius: "8px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                <Line type="monotone" dataKey="health" stroke="#10b981" strokeWidth={2} dot={false} name="Health %" />
                <Line type="monotone" dataKey="tasks" stroke="#06b6d4" strokeWidth={2} dot={false} name="Tasks" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-bg-800 border border-bg-700 p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-4">Domain Status Matrix</h3>
            <div className="grid grid-cols-2 gap-2">
              {doms.map((d) => (
                <div key={d.slug} className="p-3 rounded-lg bg-bg-700/50 border border-bg-700 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-6 w-0.5 rounded" style={{ backgroundColor: d.color }} />
                    <span className="text-sm text-slate-100 truncate">{d.name}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-mono ${
                    d.status === "critical" ? "bg-red-500/10 text-red-400" :
                    d.status === "warning" ? "bg-amber-500/10 text-amber-400" :
                    "bg-emerald-500/10 text-emerald-400"
                  }`}>{d.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-bg-800 border border-bg-700 p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-4">Task Pipeline</h3>
            <div className="space-y-3">
              {Object.entries(taskByStatus).map(([k, v]) => {
                const pct = tasks.length ? (v / tasks.length) * 100 : 0;
                return (
                  <div key={k}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-300 capitalize">{k.replace("_", " ")}</span>
                      <span className="font-mono text-slate-400">{v}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-bg-700 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
