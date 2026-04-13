import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const user = url.searchParams.get("user");
  const domain = url.searchParams.get("domain");
  const view = url.searchParams.get("view"); // "my" | "team" | "all"

  let tasks = store.tasks.list();
  if (view === "my" && user) tasks = store.tasks.forUser(user);
  else if (view === "team" && domain) tasks = store.tasks.byDomain(domain);
  else if (user) tasks = store.tasks.forUser(user);

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

  store.audit.add({
    actor: body.created_by || "system",
    action: "TASK_CREATE",
    target: task.id,
    detail: task.title,
  });

  return NextResponse.json({ ok: true, task });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const task = store.tasks.updateStatus(body.id, body.status);

  store.audit.add({
    actor: body.actor || "system",
    action: `TASK_STATUS_${body.status?.toUpperCase()}`,
    target: body.id,
    detail: task?.title,
  });

  return NextResponse.json({ ok: Boolean(task), task });
}
