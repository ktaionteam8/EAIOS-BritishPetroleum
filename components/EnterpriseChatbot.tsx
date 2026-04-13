"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string; actions?: string[] };

const SUGGESTIONS = [
  "Show refinery status",
  "Analyze last 10 days performance",
  "Suggest improvements",
  "Assign technician to Machine A",
  "Create job for Senior Reservoir Engineer",
];

export function EnterpriseChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi — I'm your EAIOS assistant. Ask about status, analytics, or say 'assign technician to Machine A' and I'll create the task." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", content: q }]);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, history: messages.slice(-6) }),
      });
      const data = await r.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply || "(no response)", actions: data.actions }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Network error — try again." }]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform flex items-center justify-center"
        aria-label="Open assistant"
      >
        <Bot className="h-6 w-6 text-white" />
        <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-bg-900" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[560px] rounded-2xl bg-bg-800 border border-indigo-500/30 shadow-2xl shadow-indigo-500/10 flex flex-col animate-fade-in">
      <div className="flex items-center justify-between p-4 border-b border-bg-700">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100">EAIOS Assistant</div>
            <div className="text-[10px] text-emerald-400">● Online · Gemini-powered</div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-bg-700 transition-colors">
          <X className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-indigo-500 text-white"
                  : "bg-bg-700 text-slate-200 border border-bg-600"
              }`}
            >
              {m.content}
              {m.actions && m.actions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-bg-600/50 space-y-1">
                  {m.actions.map((a, j) => (
                    <div key={j} className="text-[10px] font-mono text-emerald-400">✓ {a}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="bg-bg-700 border border-bg-600 rounded-xl px-3 py-2 text-sm text-slate-400">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
      </div>

      {messages.length <= 2 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-[11px] px-2 py-1 rounded-full bg-bg-700 border border-bg-600 text-slate-300 hover:border-indigo-500/40 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="p-3 border-t border-bg-700 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask or issue a command…"
          className="flex-1 bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/50"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="p-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-500/30 transition-colors"
        >
          <Send className="h-4 w-4 text-white" />
        </button>
      </form>
    </div>
  );
}
