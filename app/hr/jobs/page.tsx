"use client";

import { useEffect, useState } from "react";
import { Briefcase, Plus, Upload, Check, X, AlertCircle } from "lucide-react";
import { TopBar } from "@/components/TopBar";

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

interface Screening {
  id: string;
  candidate: string;
  job_id: string;
  job_title: string;
  decision: "SELECTED" | "REJECTED" | "MAYBE";
  score: number;
  reason: string;
  created_at: string;
}

export default function HRJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", domain: "hr-safety", location: "", description: "", skills: "" });
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [resumeText, setResumeText] = useState("");
  const [screening, setScreening] = useState(false);

  async function load() {
    const [j, s] = await Promise.all([
      fetch("/api/jobs").then((r) => r.json()),
      fetch("/api/resume-screen").then((r) => r.json()),
    ]);
    setJobs(j.jobs);
    setScreenings(s.screenings);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  async function createJob(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean) }),
    });
    setForm({ title: "", domain: "hr-safety", location: "", description: "", skills: "" });
    setShowNew(false);
    load();
  }

  async function screenResume() {
    if (!selectedJob || !resumeText.trim()) return;
    setScreening(true);
    await fetch("/api/resume-screen", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ job_id: selectedJob, resume_text: resumeText }),
    });
    setScreening(false);
    setResumeText("");
    load();
  }

  const DECISION_COLOR = {
    SELECTED: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    REJECTED: "text-red-400 bg-red-500/10 border-red-500/30",
    MAYBE: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  };

  return (
    <>
      <TopBar systemStatus="normal" alertCount={0} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">HR Job Management</h1>
            <p className="text-sm text-slate-400 mt-1">{jobs.length} postings · reflected live on Careers page</p>
          </div>
          <button onClick={() => setShowNew((v) => !v)} className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium rounded-lg px-4 py-2">
            <Plus className="h-4 w-4" /> New Job Posting
          </button>
        </div>

        {showNew && (
          <form onSubmit={createJob} className="rounded-2xl bg-bg-800 border border-bg-700 p-4 grid grid-cols-2 gap-3">
            <input required placeholder="Job title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="col-span-2 bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
            <select value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} className="bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-slate-100">
              <option value="hr-safety">HR & Safety</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="supply-chain">Supply Chain</option>
              <option value="commercial-trading">Trading</option>
              <option value="it-cybersecurity">IT</option>
              <option value="finance">Finance</option>
            </select>
            <input required placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
            <textarea required placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="col-span-2 bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
            <input placeholder="Skills (comma-separated)" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className="col-span-2 bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
            <button type="submit" className="col-span-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm rounded-lg py-2">Post Job</button>
          </form>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-bg-800 border border-bg-700 p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-indigo-400" /> Open Postings
            </h3>
            <div className="space-y-2">
              {jobs.map((j) => (
                <div key={j.id} className="p-3 rounded-lg bg-bg-700/40 border border-bg-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-100">{j.title}</span>
                    <span className="text-[10px] font-mono text-slate-500">{j.id}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{j.location} · {j.domain}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {j.skills.map((s) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">{s}</span>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2">{j.applications} applications</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-bg-800 border border-bg-700 p-5">
              <h3 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <Upload className="h-4 w-4 text-cyan-400" /> AI Resume Screening
              </h3>
              <select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)} className="w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-slate-100 mb-2">
                <option value="">Select job posting…</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste resume text here…"
                rows={6}
                className="w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-slate-100"
              />
              <button onClick={screenResume} disabled={screening || !selectedJob || !resumeText} className="mt-2 w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-white text-sm rounded-lg py-2">
                {screening ? "Analyzing with Gemini…" : "Screen Resume"}
              </button>
            </div>

            <div className="rounded-2xl bg-bg-800 border border-bg-700 p-5">
              <h3 className="text-sm font-semibold text-slate-100 mb-4">Recent Screenings</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {screenings.map((s) => (
                  <div key={s.id} className="p-3 rounded-lg bg-bg-700/40 border border-bg-700">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-100 truncate">{s.candidate}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${DECISION_COLOR[s.decision]} flex items-center gap-1`}>
                        {s.decision === "SELECTED" && <Check className="h-3 w-3" />}
                        {s.decision === "REJECTED" && <X className="h-3 w-3" />}
                        {s.decision === "MAYBE" && <AlertCircle className="h-3 w-3" />}
                        {s.decision}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{s.reason}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                      <span>{s.job_title}</span>
                      <span className="font-mono text-slate-300">{s.score}/100</span>
                    </div>
                  </div>
                ))}
                {screenings.length === 0 && <div className="text-center text-xs text-slate-500 py-6">No screenings yet. Try pasting a resume above.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
