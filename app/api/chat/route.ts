import { NextResponse } from "next/server";
import { geminiText } from "@/lib/gemini";
import { store } from "@/lib/store";

const SYSTEM = `You are EAIOS-AI, the enterprise assistant for British Petroleum's AI Operations System.

You have awareness of 6 business domains with 36 microservices:
- Manufacturing (predictive maintenance, refinery yield, quality, downtime, energy, digital twin)
- Supply Chain (demand-supply, Castrol distribution, aviation fuel, marine bunkering, retail, inventory)
- Commercial Trading (crude, carbon credits, Castrol pricing, aviation forecasting, LNG, arbitrage)
- HR & Safety (workforce, skills-gap, talent, safety incidents, contractors, reskilling)
- IT & Cybersecurity (service desk, threat detection, OT security, shadow IT, infra monitoring, compliance)
- Finance (financial close, JV accounting, cost forecasting, tax, treasury, revenue)

Actions you can trigger:
- "assign <username> to <task description>" → create a new task
- "create job posting for <title>" → flag HR to post a job
- "show <domain> status" → summarize the domain

Keep responses concise (under 150 words), professional, action-oriented. Never use markdown headers.`;

export async function POST(req: Request) {
  const body = await req.json();
  const message: string = body.message || "";
  const username: string = body.username || "user";

  const sideEffects: any[] = [];

  // Intent: assign task
  const assignMatch = message.match(/assign\s+([\w-]+)\s+(?:to|for)?\s*(.+)/i);
  if (assignMatch) {
    const task = store.tasks.create({
      title: `${assignMatch[2].slice(0, 80)}`,
      description: `Auto-created from chatbot by ${username}`,
      assignee: assignMatch[1],
      domain: "manufacturing",
      priority: "medium",
      created_by: username,
    });
    sideEffects.push({ type: "task_created", task_id: task.id, assignee: task.assignee });
    store.audit.add({ actor: username, action: "TASK_CREATE_VIA_CHAT", target: task.id, detail: task.title });
  }

  // Intent: create job
  if (/(?:create|post)\s+job\s+(?:posting\s+)?(?:for\s+)?([a-z\s]+?)(?:\.|$)/i.test(message)) {
    const m = message.match(/(?:create|post)\s+job\s+(?:posting\s+)?(?:for\s+)?([a-z\s]+?)(?:\.|$)/i);
    if (m) {
      const title = m[1].trim().replace(/\b\w/g, (c) => c.toUpperCase());
      const job = store.jobs.create({
        title,
        domain: "hr-safety",
        location: "To be confirmed",
        description: `Auto-drafted from chatbot by ${username}. HR to review and publish.`,
        skills: [],
      });
      sideEffects.push({ type: "job_drafted", job_id: job.id, title: job.title });
      store.audit.add({ actor: username, action: "JOB_DRAFT_VIA_CHAT", target: job.id, detail: title });
    }
  }

  const { text, source, model, failure, error_detail } = await geminiText(message, SYSTEM);

  return NextResponse.json({
    reply: text,
    source,
    model,
    failure,
    error_detail,
    side_effects: sideEffects,
    timestamp: new Date().toISOString(),
  });
}
