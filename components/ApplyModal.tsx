"use client";

import { useState } from "react";
import { AlertCircle, Check, Loader2, Upload, X } from "lucide-react";

interface Job {
  id: string;
  title: string;
  location: string;
  domain: string;
}

export function ApplyModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", resume: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [result, setResult] = useState<any>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setForm((f) => ({ ...f, resume: text.slice(0, 10000) }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    const res = await fetch("/api/jobs/apply", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        job_id: job.id,
        candidate_name: form.name,
        candidate_email: form.email,
        resume_text: form.resume,
      }),
    });
    const data = await res.json();
    setResult(data);
    setStatus("done");
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-bg-800 border border-bg-700 shadow-card">
        <div className="flex items-center justify-between p-5 border-b border-bg-700">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Apply: {job.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{job.location} · {job.domain}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-bg-700">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {status !== "done" && (
          <form onSubmit={submit} className="p-5 space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-500">Full name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/60"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-500">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/60"
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-500">Resume (paste or upload .txt)</label>
              <textarea
                required
                rows={6}
                value={form.resume}
                onChange={(e) => setForm({ ...form, resume: e.target.value })}
                className="mt-1 w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/60 font-mono"
                placeholder="Paste your resume text here, or upload a .txt file below…"
              />
              <label className="mt-2 flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-slate-200">
                <Upload className="h-3.5 w-3.5" />
                <span>Upload .txt file</span>
                <input type="file" accept=".txt,.md,text/*" onChange={handleFile} className="hidden" />
              </label>
            </div>
            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2.5 flex items-center justify-center gap-2"
            >
              {status === "submitting" ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Screening with Gemini AI…</>
              ) : (
                "Submit Application"
              )}
            </button>
          </form>
        )}

        {status === "done" && result && (
          <div className="p-5 space-y-3">
            {result.application.status === "SHORTLISTED" ? (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4">
                <div className="flex items-center gap-2 text-emerald-300">
                  <Check className="h-5 w-5" />
                  <span className="font-semibold">Shortlisted!</span>
                </div>
                <p className="text-sm text-slate-300 mt-2">{result.application.gemini_reason}</p>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="text-slate-400">AI score:</span>
                  <span className="font-mono text-emerald-300">{result.application.score}/100</span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4">
                <div className="flex items-center gap-2 text-amber-300">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">Not a strong match</span>
                </div>
                <p className="text-sm text-slate-300 mt-2">{result.application.gemini_reason}</p>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="text-slate-400">AI score:</span>
                  <span className="font-mono text-amber-300">{result.application.score}/100</span>
                </div>
              </div>
            )}
            {result.application.matched_skills?.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Matched skills</div>
                <div className="flex flex-wrap gap-1">
                  {result.application.matched_skills.map((s: string) => (
                    <span key={s} className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {result.ai_source === "fallback" && result.ai_failure && (
              <div className="text-[11px] text-amber-300/80 bg-amber-500/5 border border-amber-500/20 rounded p-2">
                Note: Gemini in fallback mode ({result.ai_failure}). Manual review recommended.
              </div>
            )}
            <button onClick={onClose} className="w-full bg-bg-700 hover:bg-bg-600 text-slate-200 text-sm rounded-lg py-2">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
