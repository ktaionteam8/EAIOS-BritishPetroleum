"use client";

import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { readSession } from "@/lib/session";

interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target?: string;
  detail?: string;
  timestamp: string;
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const session = typeof window !== "undefined" ? readSession() : null;

  useEffect(() => {
    const load = async () => {
      const r = await fetch("/api/audit");
      const d = await r.json();
      setEntries(d.entries);
    };
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  if (session?.role !== "admin") {
    return (
      <>
        <TopBar systemStatus="normal" alertCount={0} />
        <div className="p-12 text-center text-slate-500">Admin access required to view audit log.</div>
      </>
    );
  }

  const actionColor = (action: string) => {
    if (action.includes("APPROVE")) return "text-emerald-400 bg-emerald-500/10";
    if (action.includes("REJECT")) return "text-red-400 bg-red-500/10";
    if (action.includes("CREATE") || action.includes("DRAFT")) return "text-indigo-400 bg-indigo-500/10";
    if (action.includes("APPLY") || action.includes("SCREEN")) return "text-cyan-400 bg-cyan-500/10";
    return "text-slate-400 bg-slate-500/10";
  };

  return (
    <>
      <TopBar systemStatus="normal" alertCount={0} />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-indigo-400" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">Audit Log</h1>
            <p className="text-sm text-slate-400 mt-1">Every state-changing action across the platform · last {entries.length} entries</p>
          </div>
        </div>

        <div className="rounded-2xl bg-bg-800 border border-bg-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg-700/50 border-b border-bg-700 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left px-4 py-3 font-medium">When</th>
                <th className="text-left px-4 py-3 font-medium">Actor</th>
                <th className="text-left px-4 py-3 font-medium">Action</th>
                <th className="text-left px-4 py-3 font-medium">Target</th>
                <th className="text-left px-4 py-3 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-700">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-bg-700/30 transition-colors">
                  <td className="px-4 py-2 text-[11px] font-mono text-slate-400 whitespace-nowrap">
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2 text-xs font-mono text-slate-300">{e.actor}</td>
                  <td className="px-4 py-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${actionColor(e.action)}`}>{e.action}</span>
                  </td>
                  <td className="px-4 py-2 text-[11px] font-mono text-slate-400">{e.target || "—"}</td>
                  <td className="px-4 py-2 text-xs text-slate-300">{e.detail || ""}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr><td colSpan={5} className="text-center text-slate-500 py-8 text-sm">No audit entries yet. Trigger any action (create task, apply, approve).</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
