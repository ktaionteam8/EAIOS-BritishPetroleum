"use client";

import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { fetchAllDomains, fetchMasterDecision } from "@/lib/api";
import { MasterAgentPanel } from "@/components/MasterAgentPanel";
import { TopBar } from "@/components/TopBar";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import type { Status } from "@/lib/types";

export default function MasterDecisionPage() {
  const { data: master } = useAutoRefresh(fetchMasterDecision, 5000);
  const { data: domains } = useAutoRefresh(fetchAllDomains, 5000);

  const doms = domains ?? [];
  const totalAlerts = doms.reduce((a, d) => a + d.alertCount, 0);
  const systemStatus: Status =
    doms.some((d) => d.status === "critical") ? "critical" :
    doms.some((d) => d.status === "warning") ? "warning" : "normal";

  return (
    <>
      <TopBar systemStatus={systemStatus} alertCount={totalAlerts} />
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Master Decision</h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise-level orchestration synthesising all domain signals
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <MasterAgentPanel decision={master} />
          </div>

          <div className="lg:col-span-2 rounded-2xl bg-bg-800 border border-bg-700 p-5 shadow-card">
            <h3 className="text-sm font-semibold text-slate-100 mb-4">Contributing Domain Signals</h3>
            <div className="space-y-3">
              {doms.map((d) => (
                <div key={d.slug} className="flex items-center gap-4 p-3 rounded-lg bg-bg-700/50 border border-bg-700">
                  <div className="h-10 w-1 rounded-full" style={{ backgroundColor: d.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-100">{d.name}</span>
                      <StatusBadge status={d.status} size="sm" />
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                      <span className="font-mono text-slate-300">{d.topDecision}</span>
                      <span>·</span>
                      <span>{d.alertCount} alerts</span>
                    </div>
                    <div className="mt-2">
                      <ConfidenceBar value={d.confidence} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
