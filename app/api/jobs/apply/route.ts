import { NextResponse } from "next/server";
import { geminiJSON } from "@/lib/gemini";
import { store } from "@/lib/store";

const SHORTLIST_THRESHOLD = 70;

const PROMPT = (job: any, resume: string, name: string) => `You are an expert technical recruiter for a global oil & gas company.

JOB POSTING:
Title: ${job.title}
Domain: ${job.domain}
Required skills: ${job.skills.join(", ") || "(not specified)"}
Description: ${job.description}

CANDIDATE:
Name: ${name}
Resume:
${resume.slice(0, 6000)}

Score the candidate 0-100 based on skill match, relevant experience, and domain fit.

Respond ONLY with valid JSON:
{
  "score": 0-100 integer,
  "reason": "One concise sentence explaining the score",
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill3"]
}`;

export async function POST(req: Request) {
  const body = await req.json();
  const {
    job_id,
    candidate_name,
    candidate_email,
    resume_text,
  }: { job_id: string; candidate_name: string; candidate_email: string; resume_text: string } = body;

  const job = store.jobs.get(job_id);
  if (!job) return NextResponse.json({ ok: false, error: "Job not found" }, { status: 404 });

  const fallback = {
    score: 55,
    reason: "AI unavailable — manual review recommended",
    matched_skills: [] as string[],
    missing_skills: [] as string[],
  };

  const result = await geminiJSON(PROMPT(job, resume_text, candidate_name), fallback);
  const { score, reason, matched_skills, missing_skills } = result.data;
  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
  const status = boundedScore >= SHORTLIST_THRESHOLD ? "SHORTLISTED" : "REJECTED";

  const application = store.applications.add({
    job_id,
    job_title: job.title,
    candidate_name,
    candidate_email,
    resume_text: resume_text.slice(0, 2000),
    status,
    score: boundedScore,
    matched_skills: matched_skills || [],
    missing_skills: missing_skills || [],
    gemini_reason: reason || "",
    ai_source: result.source,
    ai_failure: result.failure,
  });

  store.audit.add({
    actor: candidate_email,
    action: status === "SHORTLISTED" ? "APPLICATION_SHORTLIST" : "APPLICATION_REJECT",
    target: application.id,
    detail: `${candidate_name} → ${job.title} (score ${boundedScore})`,
  });

  store.notifications.add({
    title: status === "SHORTLISTED" ? `🎯 Shortlisted: ${candidate_name}` : `Application received: ${candidate_name}`,
    detail: `${job.title} · Gemini score ${boundedScore}/100 · ${reason?.slice(0, 80) || ""}`,
    severity: status === "SHORTLISTED" ? "info" : "info",
    target_domain: "hr-safety",
    target_role: "manager",
  });

  return NextResponse.json({
    ok: true,
    application,
    ai_source: result.source,
    ai_failure: result.failure,
    ai_model: result.model,
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jobId = url.searchParams.get("job_id");
  const apps = jobId ? store.applications.forJob(jobId) : store.applications.list();
  return NextResponse.json({ applications: apps });
}
