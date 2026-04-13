"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Chatbot } from "./Chatbot";
import { ToastProvider } from "./ToastProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = pathname === "/login" || pathname.startsWith("/website");

  if (isPublic) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
        <Chatbot />
      </div>
    </ToastProvider>
  );
}
