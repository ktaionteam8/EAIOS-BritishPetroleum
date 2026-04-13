"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, Clock, Plus, ShieldCheck } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { readSession } from "@/lib/session";

type TaskStatus = "created" | "approved" | "in_progress" | "completed" | "rejected";
interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  domain: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high" | "critical";
  created_at: string;
  created_by: string;
  approved_by?: string;
}

const PRIORITY_COLORS = {
  low: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  medium: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  high: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  critical: "text-red-400 bg-red-500/10 border-red-500/20",
};

const STATUS_COLORS = {
  created: "text-slate-400 bg-slate-500/10",
  approved: "text-indigo-400 bg-indigo-500/10",
  in_progress: "text-amber-400 bg-amber-500/10",
  completed: "text-emerald-400 bg-emerald-500/10",
  rejected: "text-red-400 bg-red-500/10",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [view, setView] = useState<"my" | "team" | "all">("my");
  const [form, setForm] = useState({ title: "", description: "", assignee: "", priority: "medium", domain: "manufacturing" });

  const session = typeof window !== "undefined" ? readSession() : null;
  const role = session?.role;
  const canCreate = role === "admin" || role === "manager";
  const canApprove = role === "admin" || role === "manager";

  async function load() {
    let qs = "";
    if (view === "my" && session) qs = `?view=my&user=${session.username}`;
    else if (view === "team" && session?.domain) qs = `?view=team&domain=${session.domain}`;
    else if (view === "all" && role === "admin") qs = "?view=all";
    const r = await fetch(`/api/tasks${qs}`);
    const d = await r.json();
    setTasks(d.tasks);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [view]);

  async function updateStatus(id: string, status: TaskStatus) {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status, actor: session?.username }),
    });
    load();
  }

  async function approveTask(id: string) {
    await fetch("/api/tasks/approve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, approver: session?.username }),
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
    setForm({ title: "", description: "", assignee: "", priority: "medium", domain: session?.domain || "manufacturing" });
    setShowNew(false);
    load();
  }

  const visibleViews = useMemo(() => {
    if (role === "admin") return ["my", "team", "all"] as const;
    if (role === "manager") return ["my", "team"] as const;
    return ["my"] as const;
  }, [role]);

  return (
    <>
      <TopBar systemStatus="normal" alertCount={0} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">Task Management</h1>
            <p className="text-sm text-slate-400 mt-1">Workflow: created → approved → in_progress → completed</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-bg-700 p-0.5 border border-bg-600">
              {visibleViews.map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`text-xs px-3 py-1.5 rounded capitalize ${view === v ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-slate-200"}`}
                >
                  {v === "my" ? "My tasks" : v === "team" ? "Team" : "All"}
                </button>
              ))}
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
        </div>

        {showNew && (
          <form onSubmit={createTask} className="rounded-2xl bg-bg-800 border border-bg-700 p-4 grid grid-cols-2 gap-3">
            <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="col-span-2 bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
            <input placeholder="Assignee username" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} required className="bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
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
                onClick={() => {
                  if (t.status === "approved") updateStatus(t.id, "in_progress");
                  else if (t.status === "in_progress") updateStatus(t.id, "completed");
                  else if (t.status === "completed") updateStatus(t.id, "approved");
                }}
                disabled={t.status === "created" || t.status === "rejected"}
                title={t.status === "created" ? "Needs manager approval first" : `Click to cycle status`}
              >
                {t.status === "completed" ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> :
                 t.status === "in_progress" ? <Clock className="h-5 w-5 text-amber-400" /> :
                 <Circle className="h-5 w-5 text-slate-500" />}
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-medium ${t.status === "completed" ? "line-through text-slate-500" : "text-slate-100"}`}>{t.title}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${STATUS_COLORS[t.status]} uppercase font-mono`}>{t.status}</span>
                  {t.status === "created" && canApprove && (
                    <button
                      onClick={() => approveTask(t.id)}
                      className="text-[10px] px-2 py-0.5 rounded bg-indigo-500 hover:bg-indigo-400 text-white flex items-center gap-1"
                    >
                      <ShieldCheck className="h-3 w-3" /> Approve
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-1">{t.description}</div>
                <div className="text-[11px] text-slate-500 mt-2 flex gap-3 flex-wrap">
                  <span>Assigned: <span className="text-slate-300 font-mono">{t.assignee}</span></span>
                  <span>Domain: {t.domain}</span>
                  <span>By: {t.created_by}</span>
                  {t.approved_by && <span>Approved: {t.approved_by}</span>}
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500">{new Date(t.created_at).toLocaleTimeString()}</span>
            </div>
          ))}
          {tasks.length === 0 && <div className="p-8 text-center text-sm text-slate-500">No tasks in this view.</div>}
        </div>
      </div>
    </>
  );
}
