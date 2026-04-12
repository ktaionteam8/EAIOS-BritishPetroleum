"use client";

import { Brain, Sparkles } from "lucide-react";
import type { MasterDecision } from "@/lib/types";
import { ConfidenceBar } from "./ConfidenceBar";

export function MasterAgentPanel({ decision }: { decision: MasterDecision | null }) {
  if (!decision) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-bg-800 border border-indigo-500/20 p-6 animate-pulse">
        <div className="h-4 w-40 bg-bg-700 rounded" />
        <div className="mt-4 h-8 w-72 bg-bg-700 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 via-bg-800 to-bg-800 border border-indigo-500/30 p-6 shadow-card animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30">
            <Brain className="h-5 w-5 text-indigo-300" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-indigo-300/80">Master Agent</div>
            <div className="text-sm text-slate-300">Enterprise decision orchestrator</div>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Sparkles className="h-3 w-3 text-indigo-400" />
          Live
        </span>
      </div>

      <div className="mt-5">
        <div className="text-[11px] uppercase tracking-wider text-slate-500">Final Decision</div>
        <div className="mt-1 text-2xl font-semibold text-slate-100 font-mono">{decision.final_decision}</div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span>Confidence</span>
          <span className="font-mono">{(decision.confidence * 100).toFixed(0)}%</span>
        </div>
        <ConfidenceBar value={decision.confidence} />
      </div>

      <div className="mt-5">
        <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5">Reason</div>
        <p className="text-sm text-slate-300 leading-relaxed">{decision.reason}</p>
      </div>

      {decision.actions && decision.actions.length > 0 && (
        <div className="mt-5">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Recommended Actions</div>
          <ul className="space-y-1.5">
            {decision.actions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-bg-700 flex items-center justify-between text-[11px] text-slate-500">
        <span>Last synthesised</span>
        <span className="font-mono">{new Date(decision.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
