"use client";

import type { Role } from "./rbac";

export interface Session {
  username: string;
  role: Role;
  name: string;
  domain?: string;
}

export function readSession(): Session | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith("eaios_session="));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split("=")[1]));
  } catch {
    return null;
  }
}

export async function login(username: string, password: string): Promise<Session | null> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user as Session;
}

export async function logout() {
  await fetch("/api/auth/login", { method: "DELETE" });
  document.cookie = "eaios_session=; max-age=0; path=/";
}
