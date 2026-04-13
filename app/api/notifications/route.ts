import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  return NextResponse.json({
    notifications: store.notifications.list(),
    unread: store.notifications.unreadCount(),
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const n = store.notifications.add({
    title: body.title,
    detail: body.detail || "",
    severity: body.severity || "info",
    target_role: body.target_role,
    target_domain: body.target_domain,
  });
  return NextResponse.json({ ok: true, notification: n });
}

export async function PATCH() {
  store.notifications.markAllRead();
  return NextResponse.json({ ok: true });
}
