"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  Factory,
  Gauge,
  LineChart,
  Shield,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import { DOMAINS } from "@/lib/domains";

const DOMAIN_ICONS = {
  manufacturing: Factory,
  "supply-chain": ShoppingCart,
  "commercial-trading": LineChart,
  "hr-safety": Users,
  "it-cybersecurity": Shield,
  finance: Wallet,
} as const;

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="w-60 bg-bg-800 border-r border-bg-700 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-bg-700">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100">EAIOS</div>
            <div className="text-[10px] text-slate-500">British Petroleum</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <NavItem href="/" label="Overview" icon={Gauge} active={pathname === "/"} />
        <NavItem
          href="/master-decision"
          label="Master Decision"
          icon={Brain}
          active={isActive("/master-decision")}
          highlight
        />

        <div className="pt-4 pb-1.5 px-3 text-[10px] uppercase tracking-wider text-slate-600 font-medium">
          Domains
        </div>
        {DOMAINS.map((d) => {
          const Icon = DOMAIN_ICONS[d.slug as keyof typeof DOMAIN_ICONS];
          return (
            <NavItem
              key={d.slug}
              href={`/domain/${d.slug}`}
              label={d.name}
              icon={Icon}
              active={isActive(`/domain/${d.slug}`)}
              accent={d.color}
            />
          );
        })}
      </nav>

      <div className="p-4 border-t border-bg-700 text-[10px] text-slate-600">
        <div>36 microservices</div>
        <div>1 master orchestrator</div>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  accent,
  highlight,
}: {
  href: string;
  label: string;
  icon: any;
  active: boolean;
  accent?: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? "bg-bg-700 text-slate-100"
          : "text-slate-400 hover:bg-bg-700/50 hover:text-slate-200"
      } ${highlight ? "border border-indigo-500/30 bg-indigo-500/5" : ""}`}
    >
      <Icon className="h-4 w-4" style={accent ? { color: accent } : undefined} />
      {label}
    </Link>
  );
}
