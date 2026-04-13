import { NextResponse } from "next/server";
import { geminiText } from "@/lib/gemini";
import { store } from "@/lib/store";

/**
 * Chat endpoint — rule-first intent routing, Gemini as fallback for complex.
 *
 * Heuristic:
 *  1. Match known intents (assign, create job, show status) → rule-based answer
 *  2. If no intent match AND query is non-trivial → Gemini
 *  3. Simple greetings → canned response (no Gemini call)
 */

const SYSTEM = `You are EAIOS-AI, the enterprise assistant for British Petroleum's AI Operations System.

Awareness of 6 domains, 36 agents: Manufacturing, Supply Chain, Commercial Trading, HR & Safety, IT & Cybersecurity, Finance.

Keep responses under 120 words, professional, action-oriented. No markdown headers.`;

const GREETING_RESPONSES = [
  "Hi there. Ask me about any domain, or say 'assign employee_mfg to inspect Pump P-101' to trigger a task.",
  "Hello. How can I help? Try: 'show refinery status' or 'create a job posting for data scientist'.",
];

interface Intent {
  matched: boolean;
  reply: string;
  side_effects: any[];
}

function detectIntent(message: string, username: string): Intent {
  const msg = message.toLowerCase().trim();
  const side_effects: any[] = [];

  // Greeting
  if (/^(hi|hello|hey|yo)[!.\s]*$/.test(msg) || msg.length < 3) {
    return { matched: true, reply: GREETING_RESPONSES[0], side_effects };
  }

  // Assign intent
  const assignMatch = message.match(/assign\s+([\w-]+)\s+(?:to|for)\s+(.+)/i);
  if (assignMatch) {
    const task = store.tasks.create({
      title: assignMatch[2].slice(0, 80),
      description: `Auto-created from chatbot by ${username}`,
      assignee: assignMatch[1],
      domain: "manufacturing",
      priority: "medium",
      created_by: username,
    });
    store.audit.add({ actor: username, action: "TASK_CREATE_VIA_CHAT", target: task.id, detail: task.title });
    side_effects.push({ type: "task_created", task_id: task.id, assignee: task.assignee });
    return {
      matched: true,
      reply: `✓ Created task ${task.id}: "${task.title}", assigned to ${task.assignee}. Awaiting manager approval.`,
      side_effects,
    };
  }

  // Job creation intent
  const jobMatch = message.match(/(?:create|post)\s+(?:a\s+)?job\s+(?:posting\s+)?(?:for\s+)?([a-z\s]+?)(?:\.|$)/i);
  if (jobMatch) {
    const title = jobMatch[1].trim().replace(/\b\w/g, (c) => c.toUpperCase());
    const job = store.jobs.create({
      title,
      domain: "hr-safety",
      location: "To be confirmed",
      description: `Auto-drafted from chatbot by ${username}. HR to review and publish.`,
      skills: [],
    });
    store.audit.add({ actor: username, action: "JOB_DRAFT_VIA_CHAT", target: job.id, detail: title });
    side_effects.push({ type: "job_drafted", job_id: job.id, title: job.title });
    return {
      matched: true,
      reply: `✓ Drafted job posting ${job.id}: "${title}". HR can review and publish at /hr/jobs.`,
      side_effects,
    };
  }

  // Status intent
  const statusMatch = message.match(/(?:show|what.*status)\s+(?:of\s+)?(manufacturing|supply\s*chain|trading|finance|hr|it|refinery)/i);
  if (statusMatch) {
    const domain = statusMatch[1].toLowerCase();
    return {
      matched: true,
      reply: `${domain} domain is currently showing mixed signals across its agents. Open the domain page in the sidebar for live metrics, decisions, and confidence bars. Critical alerts (if any) surface in the notification bell.`,
      side_effects,
    };
  }

  return { matched: false, reply: "", side_effects };
}

export async function POST(req: Request) {
  const body = await req.json();
  const message: string = body.message || "";
  const username: string = body.username || "user";

  // Step 1: try rule-based intent routing (no Gemini call)
  const intent = detectIntent(message, username);
  if (intent.matched) {
    return NextResponse.json({
      reply: intent.reply,
      source: "rule-engine",
      side_effects: intent.side_effects,
      timestamp: new Date().toISOString(),
    });
  }

  // Step 2: fall through to Gemini for open-ended queries
  const { text, source, model, failure, error_detail } = await geminiText(message, SYSTEM);

  return NextResponse.json({
    reply: text,
    source,
    model,
    failure,
    error_detail,
    side_effects: [],
    timestamp: new Date().toISOString(),
  });
}
