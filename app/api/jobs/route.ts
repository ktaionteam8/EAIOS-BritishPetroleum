import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ jobs: store.jobs.list() });
}

export async function POST(req: Request) {
  const body = await req.json();
  const job = store.jobs.create({
    title: body.title,
    domain: body.domain || "hr-safety",
    location: body.location || "Remote",
    description: body.description || "",
    skills: Array.isArray(body.skills) ? body.skills : String(body.skills || "").split(",").map((s) => s.trim()).filter(Boolean),
  });
  store.audit.add({
    actor: body.created_by || "hr",
    action: "JOB_CREATE",
    target: job.id,
    detail: job.title,
  });
  return NextResponse.json({ ok: true, job });
}
