"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Clock, Plus } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { readSession } from "@/lib/session";

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  domain: string;
  status: "open" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "critical";
  created_at: string;
  created_by: string;
}

const PRIORITY_COLORS = {
  low: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  medium: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  high: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  critical: "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", assignee: "", priority: "medium", domain: "manufacturing" });

  const session = typeof window !== "undefined" ? readSession() : null;
  const canCreate = session && (session.role === "admin" || session.role === "manager");

  async function load() {
    const scope = session?.role === "employee" ? `?user=${session.username}` : "";
    const r = await fetch(`/api/tasks${scope}`);
    const d = await r.json();
    setTasks(d.tasks);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, []);

  async function updateStatus(id: string, status: Task["status"]) {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, created_by: session?.username || "system" }),
    });
    setForm({ title: "", description: "", assignee: "", priority: "medium", domain: "manufacturing" });
    setShowNew(false);
    load();
  }

  return (
    <>
      <TopBar systemStatus="normal" alertCount={0} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">Task Management</h1>
            <p className="text-sm text-slate-400 mt-1">{tasks.length} tasks · auto-refresh every 4s</p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowNew((v) => !v)}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium rounded-lg px-4 py-2"
            >
              <Plus className="h-4 w-4" /> New Task
            </button>
          )}
        </div>

        {showNew && (
          <form onSubmit={createTask} className="rounded-2xl bg-bg-800 border border-bg-700 p-4 grid grid-cols-2 gap-3">
            <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="col-span-2 bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
            <input placeholder="Assignee username (e.g. employee_mfg)" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} required className="bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-slate-100">
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
            </select>
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="col-span-2 bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
            <button type="submit" className="col-span-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm rounded-lg py-2">Create</button>
          </form>
        )}

        <div className="rounded-2xl bg-bg-800 border border-bg-700 divide-y divide-bg-700">
          {tasks.map((t) => (
            <div key={t.id} className="p-4 flex items-start gap-4 hover:bg-bg-700/30 transition-colors">
              <button
                onClick={() => updateStatus(t.id, t.status === "done" ? "open" : t.status === "open" ? "in_progress" : "done")}
                className="mt-1"
              >
                {t.status === "done" ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> :
                 t.status === "in_progress" ? <Clock className="h-5 w-5 text-amber-400" /> :
                 <Circle className="h-5 w-5 text-slate-500" />}
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${t.status === "done" ? "line-through text-slate-500" : "text-slate-100"}`}>{t.title}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">{t.description}</div>
                <div className="text-[11px] text-slate-500 mt-2 flex gap-3">
                  <span>Assigned: <span className="text-slate-300 font-mono">{t.assignee}</span></span>
                  <span>Domain: {t.domain}</span>
                  <span>By: {t.created_by}</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500">{new Date(t.created_at).toLocaleTimeString()}</span>
            </div>
          ))}
          {tasks.length === 0 && <div className="p-8 text-center text-sm text-slate-500">No tasks yet.</div>}
        </div>
      </div>
    </>
  );
}
