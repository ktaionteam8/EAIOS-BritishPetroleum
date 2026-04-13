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

When the user asks you to:
- Show status → summarize what the relevant domain is doing
- Analyze performance → give concise insights with numbers
- Suggest improvements → 3 actionable bullet points
- Assign engineer/technician to X → confirm the task and note it will be created
- Create job posting → confirm the posting and note it will be added

Keep responses concise (under 150 words), professional, and action-oriented. Use markdown sparingly.`;

export async function POST(req: Request) {
  const body = await req.json();
  const message: string = body.message || "";
  const username: string = body.username || "user";

  // Side-effect detection — simple intent routing
  const lower = message.toLowerCase();
  const sideEffects: any[] = [];

  if (/assign\s+(\w+)\s+to\s+(.+)/i.test(message)) {
    const m = message.match(/assign\s+([\w-]+)\s+to\s+(.+)/i);
    if (m) {
      const task = store.tasks.create({
        title: `Inspect / attend: ${m[2].slice(0, 80)}`,
        description: `Auto-created from chatbot by ${username}`,
        assignee: m[1],
        domain: "manufacturing",
        priority: "medium",
        created_by: username,
      });
      sideEffects.push({ type: "task_created", task });
    }
  }

  if (/create\s+job|post\s+job|job\s+posting/i.test(message)) {
    store.notifications.add({
      title: "Chat hint: create job",
      detail: "Use the HR Jobs page to finalise the posting",
      severity: "info",
      target_domain: "hr-safety",
    });
  }

  const { text, source } = await geminiText(message, SYSTEM);

  return NextResponse.json({
    reply: text,
    source,
    side_effects: sideEffects,
    timestamp: new Date().toISOString(),
  });
}
