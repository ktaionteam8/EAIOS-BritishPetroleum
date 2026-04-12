"use client";

import { Activity } from "lucide-react";
import type { ActivityEvent } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <div className="rounded-2xl bg-bg-800 border border-bg-700 p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-100">Real-time Activity</h3>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">{events.length} events</span>
      </div>
      <ul className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
        {events.map((e) => (
          <li key={e.id} className="flex items-start gap-3 p-3 rounded-lg bg-bg-700/50 border border-bg-700 hover:border-bg-600 transition-colors animate-fade-in">
            <StatusBadge status={e.severity} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-100 truncate">{e.title}</span>
                <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">
                  {new Date(e.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                <span className="text-slate-500">{e.domain}</span> — {e.detail}
              </div>
            </div>
          </li>
        ))}
        {events.length === 0 && (
          <li className="text-center text-sm text-slate-500 py-8">No activity in the current window</li>
        )}
      </ul>
    </div>
  );
}
