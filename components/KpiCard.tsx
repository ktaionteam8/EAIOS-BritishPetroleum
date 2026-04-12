import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  delta?: string;
  icon: LucideIcon;
  tone?: "blue" | "emerald" | "amber" | "red";
}) {
  const tones = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
  } as const;

  return (
    <div className="rounded-2xl bg-bg-800 border border-bg-700 p-5 shadow-card hover:shadow-glow transition-shadow animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">{label}</span>
        <div className={`p-2 rounded-lg border ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-3xl font-semibold text-slate-100 tabular-nums">{value}</span>
        {delta && <span className="text-xs text-slate-400 mb-1">{delta}</span>}
      </div>
    </div>
  );
}
