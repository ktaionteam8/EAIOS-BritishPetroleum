"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, ShieldCheck, AlertCircle, Copy } from "lucide-react";
import { login } from "@/lib/session";

const DEMO_CREDS = [
  { role: "Admin",            email: "admin@eaios.com",     pass: "admin123" },
  { role: "CEO",              email: "ceo@eaios.com",       pass: "ceo123" },
  { role: "Mfg Manager",      email: "mfg@eaios.com",       pass: "mfg123" },
  { role: "SCM Manager",      email: "scm@eaios.com",       pass: "scm123" },
  { role: "Trading Manager",  email: "trading@eaios.com",   pass: "trading123" },
  { role: "HR Manager",       email: "hr@eaios.com",        pass: "hr123" },
  { role: "IT Manager",       email: "it@eaios.com",        pass: "it123" },
  { role: "Finance Manager",  email: "finance@eaios.com",   pass: "finance123" },
  { role: "Mfg Employee",     email: "emp_mfg@eaios.com",   pass: "emp123" },
  { role: "HR Employee",      email: "emp_hr@eaios.com",    pass: "emp123" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const sess = await login(email, password);
    setLoading(false);
    if (!sess) {
      setErr("Invalid credentials. Click any demo account below to auto-fill.");
      return;
    }
    // Route by role
    if (sess.role === "ceo") router.push("/ceo");
    else if (sess.role === "employee") router.push("/tasks");
    else router.push("/");
    router.refresh();
  }

  function fill(e: string, p: string) {
    setEmail(e);
    setPassword(p);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-900 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-xl font-semibold text-slate-100">EAIOS</div>
            <div className="text-xs text-slate-500">British Petroleum · Enterprise AI Control System</div>
          </div>
        </div>

        <div className="rounded-2xl bg-bg-800 border border-bg-700 p-6 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <h1 className="text-lg font-semibold text-slate-100">Role-based Sign-in</h1>
          </div>
          <p className="text-xs text-slate-400 mb-6">Email + password · demo environment</p>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-500">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="mt-1 w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/60"
                placeholder="admin@eaios.com"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-500">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/60"
                placeholder="••••••••"
              />
            </div>
            {err && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg p-2">
                <AlertCircle className="h-3.5 w-3.5" /> {err}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <div className="mt-5 rounded-xl bg-bg-800/60 border border-bg-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wider text-slate-500">Demo Accounts · click to auto-fill</div>
            <Copy className="h-3 w-3 text-slate-600" />
          </div>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {DEMO_CREDS.map((c) => (
              <button
                key={c.email}
                onClick={() => fill(c.email, c.pass)}
                className="w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded hover:bg-bg-700/60 transition-colors text-left"
              >
                <span className="text-slate-300">{c.role}</span>
                <span className="font-mono text-slate-500 truncate ml-2">
                  {c.email}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
