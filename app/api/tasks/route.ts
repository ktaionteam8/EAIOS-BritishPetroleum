import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const username = url.searchParams.get("user");
  const tasks = username ? store.tasks.forUser(username) : store.tasks.list();
  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const body = await req.json();
  const task = store.tasks.create({
    title: body.title,
    description: body.description || "",
    assignee: body.assignee,
    domain: body.domain || "manufacturing",
    priority: body.priority || "medium",
    created_by: body.created_by || "system",
  });
  return NextResponse.json({ ok: true, task });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const task = store.tasks.updateStatus(body.id, body.status);
  return NextResponse.json({ ok: Boolean(task), task });
}
