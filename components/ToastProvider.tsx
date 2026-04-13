"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastKind = "info" | "success" | "warning" | "error";
interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  detail?: string;
}

interface ToastCtx {
  push: (t: Omit<Toast, "id">) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastSeenIdRef = useRef<string | null>(null);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((curr) => [...curr, { ...t, id }]);
    setTimeout(() => setToasts((curr) => curr.filter((x) => x.id !== id)), 5000);
  }, []);

  // Subscribe to notifications API and toast any new ones
  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch("/api/notifications");
        const d = await r.json();
        const items = d.notifications || [];
        if (items.length === 0) return;

        const latestId = items[0].id;
        if (lastSeenIdRef.current === null) {
          lastSeenIdRef.current = latestId;
          return; // skip initial batch
        }
        if (latestId === lastSeenIdRef.current) return;

        // Find new items since last seen
        const newIdx = items.findIndex((n: any) => n.id === lastSeenIdRef.current);
        const newItems = newIdx > 0 ? items.slice(0, newIdx) : [items[0]];
        newItems.reverse().forEach((n: any) => {
          const kind: ToastKind =
            n.severity === "critical" ? "error" : n.severity === "warning" ? "warning" : "info";
          push({ kind, title: n.title, detail: n.detail });
        });
        lastSeenIdRef.current = latestId;
      } catch {}
    };
    poll();
    const id = setInterval(poll, 4000);
    return () => clearInterval(id);
  }, [push]);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 pointer-events-none">
        {toasts.map((t) => (
          <ToastRow key={t.id} toast={t} onClose={() => setToasts((curr) => curr.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

function ToastRow({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const map = {
    info: { icon: Info, cls: "border-blue-500/30 bg-blue-500/10 text-blue-300" },
    success: { icon: CheckCircle2, cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
    warning: { icon: AlertCircle, cls: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
    error: { icon: AlertCircle, cls: "border-red-500/30 bg-red-500/10 text-red-300" },
  } as const;
  const M = map[toast.kind];
  return (
    <div className={`pointer-events-auto rounded-xl border ${M.cls} bg-bg-800/95 backdrop-blur shadow-card p-3 flex items-start gap-2.5 animate-fade-in`}>
      <M.icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-100 truncate">{toast.title}</div>
        {toast.detail && <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{toast.detail}</div>}
      </div>
      <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
