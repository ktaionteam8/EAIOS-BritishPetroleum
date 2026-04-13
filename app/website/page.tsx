import Link from "next/link";
import { ArrowRight, Leaf, Shield, Zap } from "lucide-react";

const STATS = [
  { label: "Countries of operation", value: "60+" },
  { label: "Refineries worldwide", value: "12" },
  { label: "Renewable investment by 2030", value: "$8B" },
  { label: "AI microservices", value: "36" },
];

const PILLARS = [
  { icon: Leaf, title: "Sustainability", detail: "Net-zero by 2050 — hydrogen, wind, solar, and carbon capture portfolio." },
  { icon: Zap, title: "Energy Innovation", detail: "Real-time trading, refinery optimization, and digital twin simulations." },
  { icon: Shield, title: "Operational Excellence", detail: "Safety-critical OT security and predictive maintenance across assets." },
];

export default function HomePage() {
  return (
    <>
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="max-w-3xl">
          <div className="inline-block text-xs tracking-widest text-emerald-400 mb-4 uppercase">Enterprise · Energy · AI</div>
          <h1 className="text-5xl md:text-6xl font-semibold text-slate-100 leading-tight">
            Powering the world responsibly, operated by intelligent systems.
          </h1>
          <p className="mt-6 text-lg text-slate-400 leading-relaxed">
            British Petroleum runs one of the world's most advanced energy operations — from
            upstream drilling to Castrol lubricants to carbon credit trading — now coordinated
            by EAIOS, our proprietary cross-domain AI operating system.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/website/services" className="bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg px-5 py-3 text-sm font-medium flex items-center gap-2">
              Explore our work <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/website/careers" className="border border-bg-600 hover:border-slate-500 text-slate-200 rounded-lg px-5 py-3 text-sm font-medium">
              Open roles
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl bg-bg-800 border border-bg-700 p-5">
              <div className="text-3xl font-semibold text-slate-100">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="max-w-2xl mb-10">
          <div className="text-xs tracking-widest text-emerald-400 uppercase mb-2">Our approach</div>
          <h2 className="text-3xl font-semibold text-slate-100">Three pillars of the modern energy company</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-2xl bg-bg-800 border border-bg-700 p-6 hover:border-emerald-500/30 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <p.icon className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100">{p.title}</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">{p.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
