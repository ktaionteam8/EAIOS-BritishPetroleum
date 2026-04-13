"use client";

import { useParams } from "next/navigation";
import { useCallback } from "react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { fetchAllDomains, fetchDomain, fetchDomainTimeseries } from "@/lib/api";
import { TopBar } from "@/components/TopBar";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import { DomainChart } from "@/components/DomainChart";
import type { Status } from "@/lib/types";

export default function DomainPage() {
  const { slug } = useParams<{ slug: string }>();

  const domainFetcher = useCallback(() => fetchDomain(slug), [slug]);
  const seriesFetcher = useCallback(() => fetchDomainTimeseries(slug), [slug]);

  const { data: domain } = useAutoRefresh(domainFetcher, 5000);
  const { data: series } = useAutoRefresh(seriesFetcher, 10000);
  const { data: allDoms } = useAutoRefresh(fetchAllDomains, 10000);

  const systemStatus: Status =
    (allDoms ?? []).some((d) => d.status === "critical") ? "critical" :
    (allDoms ?? []).some((d) => d.status === "warning") ? "warning" : "normal";
  const totalAlerts = (allDoms ?? []).reduce((a, d) => a + d.alertCount, 0);

  if (!domain) {
    return (
      <>
        <TopBar systemStatus="normal" alertCount={0} />
        <div className="p-6 text-slate-400">Loading domain…</div>
      </>
    );
  }

  return (
    <>
      <TopBar systemStatus={systemStatus} alertCount={totalAlerts} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-1.5 rounded-full" style={{ backgroundColor: domain.color }} />
            <div>
              <h1 className="text-2xl font-semibold text-slate-100">{domain.name}</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {domain.activeServices} agents · {domain.alertCount} alerts
              </p>
            </div>
          </div>
          <StatusBadge status={domain.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <DomainChart
              data={series ?? []}
              color={domain.color}
              title={`${domain.name} — Risk / Efficiency (24h)`}
            />

            <div className="rounded-2xl bg-bg-800 border border-bg-700 p-5 shadow-card">
              <h3 className="text-sm font-semibold text-slate-100 mb-4">Agents</h3>
              <div className="space-y-2">
                {domain.services.map((s) => (
                  <div
                    key={s.service}
                    className="grid grid-cols-12 items-center gap-3 p-3 rounded-lg bg-bg-700/40 border border-bg-700 hover:border-bg-600 transition-colors"
                  >
                    <div className="col-span-4 min-w-0">
                      <div className="text-sm font-medium text-slate-100 truncate">{s.service}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {s.agent} · :{s.port}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <StatusBadge status={s.status} size="sm" />
                    </div>
                    <div className="col-span-2 text-xs font-mono text-slate-300">{s.decision}</div>
                    <div className="col-span-3">
                      <ConfidenceBar value={s.confidence} />
                    </div>
                    <div className="col-span-1 text-xs text-right tabular-nums">
                      <span className={s.actionable_count > 0 ? "text-amber-400" : "text-slate-500"}>
                        {s.actionable_count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-bg-800 border border-bg-700 p-5 shadow-card">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Top Decision</div>
              <div className="mt-2 text-xl font-semibold text-slate-100 font-mono">{domain.topDecision}</div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>Confidence</span>
                  <span className="font-mono">{(domain.confidence * 100).toFixed(0)}%</span>
                </div>
                <ConfidenceBar value={domain.confidence} />
              </div>
            </div>

            <div className="rounded-2xl bg-bg-800 border border-bg-700 p-5 shadow-card">
              <h4 className="text-sm font-semibold text-slate-100 mb-3">Service Health</h4>
              <div className="space-y-2">
                {(["normal", "warning", "critical"] as Status[]).map((st) => {
                  const count = domain.services.filter((s) => s.status === st).length;
                  return (
                    <div key={st} className="flex items-center justify-between text-sm">
                      <StatusBadge status={st} size="sm" />
                      <span className="font-mono text-slate-300 tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
