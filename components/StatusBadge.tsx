import type { Status } from "@/lib/types";

const MAP: Record<Status, { label: string; cls: string; dot: string }> = {
  normal: { label: "Normal", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
  warning: { label: "Warning", cls: "bg-amber-500/10 text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
  critical: { label: "Critical", cls: "bg-red-500/10 text-red-400 border-red-500/30", dot: "bg-red-400" },
};

export function StatusBadge({ status, size = "md" }: { status: Status; size?: "sm" | "md" }) {
  const m = MAP[status];
  const pad = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${pad} font-medium ${m.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot} ${status !== "normal" ? "animate-pulse" : ""}`} />
      {m.label}
    </span>
  );
}
