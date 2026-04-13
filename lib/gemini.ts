/**
 * Gemini client wrapper — production-grade.
 *
 * Design:
 *  - Explicit model rotation (primary → fallback)
 *  - Exponential backoff on 429 (respecting retryDelay)
 *  - Never throws — returns structured result with full error surface
 *  - Logs every failure server-side (stdout) for observability
 *  - Separates "unreachable" from "quota exhausted" from "parse failed"
 */

import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
const MAX_RETRIES = 2;

export type GeminiFailure =
  | "no_api_key"
  | "quota_exhausted"
  | "rate_limited"
  | "parse_error"
  | "network"
  | "unknown";

export interface GeminiResult<T> {
  data: T;
  source: "gemini" | "fallback";
  model?: string;
  attempts?: number;
  failure?: GeminiFailure;
  error_detail?: string;
}

function getClient(): GoogleGenerativeAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

function classify(err: any): { kind: GeminiFailure; detail: string; retryAfterMs?: number } {
  const msg = err?.message || String(err);
  const status = err?.status;

  if (status === 429 || /quota/i.test(msg) || /Too Many Requests/i.test(msg)) {
    const retryMatch = msg.match(/retryDelay["']?\s*:\s*["']?(\d+)s/i);
    const retryAfterMs = retryMatch ? parseInt(retryMatch[1], 10) * 1000 : undefined;
    const quotaHit = /free_tier/i.test(msg) || /daily/i.test(msg);
    return {
      kind: quotaHit ? "quota_exhausted" : "rate_limited",
      detail: msg.slice(0, 500),
      retryAfterMs,
    };
  }
  if (status === 404) return { kind: "unknown", detail: `Model not found: ${msg.slice(0, 200)}` };
  if (/fetch failed|ENOTFOUND|ECONNRESET/i.test(msg)) return { kind: "network", detail: msg };
  return { kind: "unknown", detail: msg.slice(0, 500) };
}

async function tryGenerate(
  client: GoogleGenerativeAI,
  modelName: string,
  prompt: string,
  json: boolean,
): Promise<string> {
  const model: GenerativeModel = client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      ...(json ? { responseMimeType: "application/json" } : {}),
      temperature: 0.4,
    },
  });
  const res = await model.generateContent(prompt);
  return res.response.text();
}

export async function geminiJSON<T = any>(prompt: string, fallback: T): Promise<GeminiResult<T>> {
  const client = getClient();
  if (!client) {
    console.warn("[gemini] GEMINI_API_KEY not set — using fallback");
    return { data: fallback, source: "fallback", failure: "no_api_key" };
  }

  let lastFailure: GeminiFailure = "unknown";
  let lastDetail = "";
  let attempts = 0;

  for (const modelName of MODELS) {
    for (let retry = 0; retry <= MAX_RETRIES; retry++) {
      attempts++;
      try {
        const text = await tryGenerate(client, modelName, prompt, true);
        try {
          return { data: JSON.parse(text) as T, source: "gemini", model: modelName, attempts };
        } catch {
          // try to extract JSON object from mixed output
          const s = text.indexOf("{");
          const e = text.lastIndexOf("}") + 1;
          if (s >= 0 && e > s) {
            return { data: JSON.parse(text.slice(s, e)) as T, source: "gemini", model: modelName, attempts };
          }
          lastFailure = "parse_error";
          lastDetail = `Could not parse JSON from: ${text.slice(0, 200)}`;
          break; // don't retry parse errors on same model
        }
      } catch (err: any) {
        const c = classify(err);
        lastFailure = c.kind;
        lastDetail = c.detail;
        console.warn(`[gemini] ${modelName} attempt ${retry + 1} failed (${c.kind}): ${c.detail.slice(0, 160)}`);

        if (c.kind === "quota_exhausted") break; // skip to next model (all share daily quota — but try anyway)
        if (c.kind === "rate_limited" && retry < MAX_RETRIES) {
          const wait = c.retryAfterMs ?? 800 * Math.pow(2, retry);
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }
        break; // next model
      }
    }
  }

  console.error(`[gemini] all models exhausted after ${attempts} attempts — falling back. last=${lastFailure}`);
  return { data: fallback, source: "fallback", attempts, failure: lastFailure, error_detail: lastDetail };
}

export async function geminiText(
  prompt: string,
  systemHint?: string,
): Promise<{ text: string; source: "gemini" | "fallback"; model?: string; failure?: GeminiFailure; error_detail?: string }> {
  const client = getClient();
  if (!client) {
    return { text: fallbackMessage("no_api_key"), source: "fallback", failure: "no_api_key" };
  }

  const full = systemHint ? `${systemHint}\n\nUSER QUERY: ${prompt}\n\nRESPOND:` : prompt;
  let lastFailure: GeminiFailure = "unknown";
  let lastDetail = "";

  for (const modelName of MODELS) {
    for (let retry = 0; retry <= MAX_RETRIES; retry++) {
      try {
        const text = await tryGenerate(client, modelName, full, false);
        return { text, source: "gemini", model: modelName };
      } catch (err: any) {
        const c = classify(err);
        lastFailure = c.kind;
        lastDetail = c.detail;
        console.warn(`[gemini-text] ${modelName} attempt ${retry + 1} failed (${c.kind})`);

        if (c.kind === "quota_exhausted") break;
        if (c.kind === "rate_limited" && retry < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, c.retryAfterMs ?? 800 * Math.pow(2, retry)));
          continue;
        }
        break;
      }
    }
  }

  return { text: fallbackMessage(lastFailure, lastDetail), source: "fallback", failure: lastFailure, error_detail: lastDetail };
}

function fallbackMessage(kind: GeminiFailure, detail?: string): string {
  switch (kind) {
    case "no_api_key":
      return "⚠️ Gemini API key not configured. Set GEMINI_API_KEY in .env.local and restart the server.";
    case "quota_exhausted":
      return "⚠️ Gemini daily free-tier quota exhausted. The integration is working correctly — the key is rate-limited until the 24h window resets. Upgrade to paid tier for unlimited calls.";
    case "rate_limited":
      return "⚠️ Gemini rate limit hit. Please try again in a few seconds.";
    case "network":
      return "⚠️ Could not reach Gemini (network error). Check your internet connection.";
    case "parse_error":
      return "⚠️ Gemini returned a non-JSON response. Retry with a simpler prompt.";
    default:
      return `⚠️ Gemini call failed: ${detail || "unknown error"}. See server logs for details.`;
  }
}
