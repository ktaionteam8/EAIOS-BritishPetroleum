import { NextResponse } from "next/server";
import { geminiJSON } from "@/lib/gemini";
import { store } from "@/lib/store";

const PROMPT = (job: any, resume: string) => `You are an expert technical recruiter for a global oil & gas company.

JOB POSTING:
Title: ${job.title}
Domain: ${job.domain}
Required skills: ${job.skills.join(", ")}
Description: ${job.description}

CANDIDATE RESUME:
${resume.slice(0, 6000)}

Score the candidate 0-100 based on skill match, relevant experience, and domain fit.
Respond ONLY with JSON in this exact shape:
{
  "candidate": "Candidate name extracted from resume, or 'Anonymous Candidate'",
  "score": 72,
  "decision": "SELECTED" | "REJECTED" | "MAYBE",
  "reason": "One concise sentence explaining score",
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill3"]
}

SELECTED = score >= 75, REJECTED = score < 50, MAYBE otherwise.`;

export async function POST(req: Request) {
  const body = await req.json();
  const resume: string = body.resume_text || "";
  const jobId: string = body.job_id;
  const job = store.jobs.get(jobId);

  if (!job) return NextResponse.json({ ok: false, error: "Job not found" }, { status: 404 });

  const fallback = {
    candidate: "Unscreened Candidate",
    score: 55,
    decision: "MAYBE" as const,
    reason: "Unable to reach Gemini — manual review recommended",
    matched_skills: [] as string[],
    missing_skills: [] as string[],
  };

  const { data, source } = await geminiJSON(PROMPT(job, resume), fallback);

  const screening = store.screenings.add({
    candidate: data.candidate,
    job_id: job.id,
    job_title: job.title,
    decision: data.decision,
    score: Math.round(data.score),
    reason: data.reason,
  });

  return NextResponse.json({ ok: true, screening, analysis: data, source });
}

export async function GET() {
  return NextResponse.json({ screenings: store.screenings.list() });
}
