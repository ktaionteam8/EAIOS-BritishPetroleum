"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserCircle2 } from "lucide-react";
import { logout, readSession, type Session } from "@/lib/session";

export function UserChip() {
  const [session, setSession] = useState<Session | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setSession(readSession());
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  if (!session) return null;

  return (
    <div className="relative pl-4 border-l border-bg-700">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 hover:bg-bg-700 px-2 py-1 rounded-lg transition-colors"
      >
        <UserCircle2 className="h-6 w-6 text-slate-400" />
        <div className="text-xs text-left">
          <div className="text-slate-200 font-medium">{session.name}</div>
          <div className="text-slate-500 capitalize">
            {session.role}
            {session.domain ? ` · ${session.domain}` : ""}
          </div>
        </div>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-bg-800 border border-bg-700 shadow-card p-1 z-50 animate-fade-in">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 rounded-lg hover:bg-bg-700"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
