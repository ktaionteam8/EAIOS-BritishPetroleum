"use client";

import { Bell, Circle, Search, UserCircle2 } from "lucide-react";
import type { Status } from "@/lib/types";

export function TopBar({ systemStatus, alertCount }: { systemStatus: Status; alertCount: number }) {
  const statusStyles: Record<Status, { label: string; color: string; ring: string }> = {
    normal: { label: "Active", color: "text-emerald-400", ring: "bg-emerald-400" },
    warning: { label: "Warning", color: "text-amber-400", ring: "bg-amber-400" },
    critical: { label: "Critical", color: "text-red-400", ring: "bg-red-400" },
  };
  const s = statusStyles[systemStatus];

  return (
    <header className="h-16 bg-bg-800/80 backdrop-blur border-b border-bg-700 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className={`relative flex h-2.5 w-2.5`}>
            <span className={`absolute inline-flex h-full w-full rounded-full ${s.ring} opacity-60 animate-ping`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${s.ring}`} />
          </span>
          <span className="text-xs text-slate-400">System:</span>
          <span className={`text-xs font-medium ${s.color}`}>{s.label}</span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            className="bg-bg-700 border border-bg-600 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 w-72 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
            placeholder="Search services, decisions, alerts…"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-bg-700 transition-colors">
          <Bell className="h-4 w-4 text-slate-300" />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              {alertCount > 99 ? "99+" : alertCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2 pl-4 border-l border-bg-700">
          <UserCircle2 className="h-6 w-6 text-slate-400" />
          <div className="text-xs">
            <div className="text-slate-200 font-medium">Sathishkumar B</div>
            <div className="text-slate-500">Enterprise Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
}
