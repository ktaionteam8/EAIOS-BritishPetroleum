"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, ShieldCheck, AlertCircle } from "lucide-react";
import { login } from "@/lib/session";

const DEMO_CREDS = [
  { role: "Admin", user: "admin", pass: "admin123" },
  { role: "CEO", user: "ceo", pass: "ceo123" },
  { role: "Mfg Manager", user: "manager_mfg", pass: "mfg123" },
  { role: "HR Manager", user: "manager_hr", pass: "hr123" },
  { role: "Employee", user: "employee_mfg", pass: "emp123" },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const sess = await login(username, password);
    setLoading(false);
    if (!sess) {
      setErr("Invalid credentials. Try one of the demo accounts below.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  function fill(u: string, p: string) {
    setUsername(u);
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
            <div className="text-xs text-slate-500">British Petroleum</div>
          </div>
        </div>

        <div className="rounded-2xl bg-bg-800 border border-bg-700 p-6 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <h1 className="text-lg font-semibold text-slate-100">Enterprise Sign-in</h1>
          </div>
          <p className="text-xs text-slate-400 mb-6">Role-based access to the AI Operations platform</p>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-500">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/60"
                placeholder="admin"
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
          <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Demo Accounts</div>
          <div className="space-y-1.5">
            {DEMO_CREDS.map((c) => (
              <button
                key={c.user}
                onClick={() => fill(c.user, c.pass)}
                className="w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded hover:bg-bg-700/60 transition-colors text-left"
              >
                <span className="text-slate-300">{c.role}</span>
                <span className="font-mono text-slate-500">
                  {c.user} / {c.pass}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
