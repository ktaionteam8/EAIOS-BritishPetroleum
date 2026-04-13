"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { readSession } from "@/lib/session";

interface Msg {
  role: "user" | "assistant";
  text: string;
  source?: string;
  side_effects?: any[];
}

const SUGGESTIONS = [
  "Show refinery status",
  "Analyze last 10 days performance",
  "Suggest improvements for supply chain",
  "Assign employee_mfg to inspect Pump P-101",
  "Create a job posting for data scientist",
];

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Hi — I'm EAIOS-AI. Ask about any domain, request analysis, or trigger actions like assigning tasks or posting jobs." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setSending(true);
    try {
      const sess = readSession();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: msg, username: sess?.username || "guest" }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.reply, source: data.source, side_effects: data.side_effects },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Couldn't reach the assistant. Please try again." }]);
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-glow hover:scale-105 transition-transform flex items-center justify-center z-50"
        aria-label="Open assistant"
      >
        <Bot className="h-6 w-6 text-white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[380px] h-[560px] rounded-2xl bg-bg-800 border border-bg-700 shadow-card flex flex-col z-50 animate-fade-in">
      <div className="flex items-center justify-between p-4 border-b border-bg-700">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100">EAIOS Assistant</div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5 text-indigo-400" /> Powered by Gemini
            </div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-bg-700">
          <X className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-indigo-500 text-white"
                  : "bg-bg-700 border border-bg-600 text-slate-200"
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
              {m.side_effects && m.side_effects.length > 0 && (
                <div className="mt-2 pt-2 border-t border-indigo-500/30 text-[10px] text-indigo-200">
                  ✓ {m.side_effects.length} action{m.side_effects.length > 1 ? "s" : ""} triggered
                </div>
              )}
              {m.source === "fallback" && (
                <div className="mt-1 text-[10px] text-amber-300/80">offline mode</div>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-xs text-slate-400">
              <span className="inline-block h-2 w-2 rounded-full bg-indigo-400 animate-bounce mr-1" />
              <span className="inline-block h-2 w-2 rounded-full bg-indigo-400 animate-bounce mr-1" style={{ animationDelay: "0.1s" }} />
              <span className="inline-block h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="px-3 pb-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 px-1">Try</div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-[11px] px-2 py-1 rounded-full bg-bg-700 border border-bg-600 text-slate-300 hover:border-indigo-500/50 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="p-3 border-t border-bg-700 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about any domain…"
          className="flex-1 bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/60"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="h-9 w-9 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 flex items-center justify-center"
        >
          <Send className="h-4 w-4 text-white" />
        </button>
      </form>
    </div>
  );
}
