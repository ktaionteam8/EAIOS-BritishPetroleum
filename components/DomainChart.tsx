"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function DomainChart({
  data,
  color = "#6366f1",
  title = "Risk / Efficiency Trend (24h)",
}: {
  data: { t: string; value: number; baseline: number }[];
  color?: string;
  title?: string;
}) {
  return (
    <div className="rounded-2xl bg-bg-800 border border-bg-700 p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            Current
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            Baseline
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1f2a47" strokeDasharray="3 3" />
          <XAxis dataKey="t" stroke="#64748b" fontSize={11} />
          <YAxis stroke="#64748b" fontSize={11} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#101627",
              border: "1px solid #1f2a47",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#cbd5e1" }}
          />
          <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
          <Line type="monotone" dataKey="baseline" stroke="#64748b" strokeWidth={1} strokeDasharray="4 4" dot={false} />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#grad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
