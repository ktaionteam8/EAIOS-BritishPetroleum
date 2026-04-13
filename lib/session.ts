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

export async function login(identifier: string, password: string): Promise<Session | null> {
  // Accept either username or email — server decides
  const isEmail = identifier.includes("@");
  const body = isEmail ? { email: identifier, password } : { username: identifier, password };
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user as Session;
}

export async function logout() {
  await fetch("/api/auth/login", { method: "DELETE" });
  document.cookie = "eaios_session=; max-age=0; path=/";
}
