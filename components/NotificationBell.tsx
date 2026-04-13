"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

interface Note {
  id: string;
  title: string;
  detail: string;
  severity: "info" | "warning" | "critical";
  created_at: string;
  read: boolean;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [unread, setUnread] = useState(0);

  async function load() {
    try {
      const r = await fetch("/api/notifications");
      const data = await r.json();
      setNotes(data.notifications);
      setUnread(data.unread);
    } catch {}
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, []);

  async function markRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    load();
  }

  const sevColor = {
    info: "text-slate-300",
    warning: "text-amber-400",
    critical: "text-red-400",
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) markRead();
        }}
        className="relative p-2 rounded-lg hover:bg-bg-700 transition-colors"
      >
        <Bell className="h-4 w-4 text-slate-300" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl bg-bg-800 border border-bg-700 shadow-card p-2 z-50 animate-fade-in">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-xs font-semibold text-slate-200">Notifications</span>
            <span className="text-[10px] text-slate-500">{notes.length} total</span>
          </div>
          {notes.length === 0 && (
            <div className="text-center text-xs text-slate-500 py-6">No notifications</div>
          )}
          {notes.map((n) => (
            <div key={n.id} className="p-2 rounded-lg hover:bg-bg-700/50 border-b border-bg-700/50 last:border-b-0">
              <div className="flex items-start justify-between gap-2">
                <span className={`text-xs font-medium ${sevColor[n.severity]}`}>{n.title}</span>
                <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">
                  {new Date(n.created_at).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{n.detail}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
