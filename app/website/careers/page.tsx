"use client";

import { useEffect, useState } from "react";
import { Briefcase, MapPin } from "lucide-react";

interface Job {
  id: string;
  title: string;
  domain: string;
  location: string;
  description: string;
  skills: string[];
  created_at: string;
  status: string;
  applications: number;
}

export default function CareersPage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    async function load() {
      const r = await fetch("/api/jobs");
      const d = await r.json();
      setJobs((d.jobs as Job[]).filter((j) => j.status === "open"));
    }
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <div className="max-w-2xl mb-10">
        <div className="text-xs tracking-widest text-emerald-400 uppercase mb-2">Careers</div>
        <h1 className="text-4xl font-semibold text-slate-100">Build the future of energy with us.</h1>
        <p className="text-slate-400 mt-3">Open positions — updated live from our HR system.</p>
      </div>

      <div className="space-y-3">
        {jobs.map((j) => (
          <div key={j.id} className="rounded-2xl bg-bg-800 border border-bg-700 p-5 hover:border-emerald-500/30 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-slate-100">{j.title}</h3>
                  <span className="text-[10px] font-mono text-slate-500">{j.id}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span>
                  <span>·</span>
                  <span className="capitalize">{j.domain.replace("-", " ")}</span>
                </div>
                <p className="text-sm text-slate-300 mt-3 leading-relaxed">{j.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {j.skills.map((s) => (
                    <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">{s}</span>
                  ))}
                </div>
              </div>
              <button className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-4 py-2 rounded-lg whitespace-nowrap">
                Apply
              </button>
            </div>
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="text-center text-slate-500 py-12">No open positions at the moment.</div>
        )}
      </div>
    </section>
  );
}
