import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(req: Request) {
  const body = await req.json();
  const task = store.tasks.approve(body.id, body.approver || "admin");
  if (!task) return NextResponse.json({ ok: false, error: "Task not found" }, { status: 404 });

  store.audit.add({
    actor: body.approver || "admin",
    action: "TASK_APPROVE",
    target: task.id,
    detail: task.title,
  });

  return NextResponse.json({ ok: true, task });
}
