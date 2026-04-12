"use client";

import { AlertTriangle, Boxes, Heart, ShieldAlert } from "lucide-react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { fetchActivity, fetchAllDomains, fetchMasterDecision } from "@/lib/api";
import { TopBar } from "@/components/TopBar";
import { KpiCard } from "@/components/KpiCard";
import { DomainCard } from "@/components/DomainCard";
import { MasterAgentPanel } from "@/components/MasterAgentPanel";
import { ActivityFeed } from "@/components/ActivityFeed";
import type { Status } from "@/lib/types";

export default function OverviewPage() {
  const { data: domains } = useAutoRefresh(fetchAllDomains, 5000);
  const { data: master } = useAutoRefresh(fetchMasterDecision, 5000);
  const { data: events } = useAutoRefresh(fetchActivity, 5000);

  const doms = domains ?? [];
  const totalServices = doms.reduce((a, d) => a + d.activeServices, 0);
  const totalAlerts = doms.reduce((a, d) => a + d.alertCount, 0);
  const criticalCount = doms.filter((d) => d.status === "critical").length;
  const normalCount = doms.filter((d) => d.status === "normal").length;
  const health = doms.length ? Math.round((normalCount / doms.length) * 100) : 100;
  const systemStatus: Status =
    criticalCount > 0 ? "critical" : doms.some((d) => d.status === "warning") ? "warning" : "normal";

  return (
    <>
      <TopBar systemStatus={systemStatus} alertCount={totalAlerts} />
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Enterprise Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            Cross-domain intelligence across 36 microservices + 1 master orchestrator
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Active Services" value={totalServices || 36} icon={Boxes} tone="blue" />
          <KpiCard label="Active Alerts" value={totalAlerts} delta="last 5m" icon={AlertTriangle} tone="amber" />
          <KpiCard label="Critical Domains" value={criticalCount} icon={ShieldAlert} tone="red" />
          <KpiCard label="System Health" value={`${health}%`} icon={Heart} tone="emerald" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Domains</h2>
                <span className="text-[11px] text-slate-500">Click any domain to drill down</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {doms.map((d) => (
                  <DomainCard key={d.slug} domain={d} />
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <MasterAgentPanel decision={master} />
            <ActivityFeed events={events ?? []} />
          </div>
        </div>
      </div>
    </>
  );
}
