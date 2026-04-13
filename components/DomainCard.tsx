"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { DomainSummary } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { ConfidenceBar } from "./ConfidenceBar";

export function DomainCard({ domain }: { domain: DomainSummary }) {
  return (
    <Link
      href={`/domain/${domain.slug}`}
      className="group rounded-2xl bg-bg-800 border border-bg-700 p-5 shadow-card hover:border-bg-600 hover:-translate-y-0.5 transition-all animate-fade-in block"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-1 rounded-full"
            style={{ backgroundColor: domain.color }}
          />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500">Domain</div>
            <div className="text-base font-semibold text-slate-100">{domain.name}</div>
          </div>
        </div>
        <StatusBadge status={domain.status} />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-slate-400">Top decision</span>
        <span className="font-mono text-slate-200">{domain.topDecision}</span>
      </div>

      <div className="mt-3">
        <ConfidenceBar value={domain.confidence} />
      </div>

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-bg-700">
        <div className="flex items-center gap-4 text-xs">
          <div>
            <div className="text-slate-500">Agents</div>
            <div className="text-slate-200 font-medium">{domain.activeServices}</div>
          </div>
          <div>
            <div className="text-slate-500">Alerts</div>
            <div className={`font-medium ${domain.alertCount > 0 ? "text-amber-400" : "text-slate-200"}`}>
              {domain.alertCount}
            </div>
          </div>
        </div>
        <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-slate-200 transition-colors" />
      </div>
    </Link>
  );
}
