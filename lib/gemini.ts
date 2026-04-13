import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

export function getGemini() {
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenerativeAI(apiKey);
}

export async function geminiJSON<T = any>(prompt: string, fallback: T): Promise<{ data: T; source: "gemini" | "fallback"; model?: string }> {
  try {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
      generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
    });
    const res = await model.generateContent(prompt);
    const text = res.response.text();
    const parsed = JSON.parse(text);
    return { data: parsed as T, source: "gemini", model: "gemini-2.0-flash-lite" };
  } catch (err) {
    return { data: fallback, source: "fallback" };
  }
}

export async function geminiText(prompt: string, systemHint?: string): Promise<{ text: string; source: "gemini" | "fallback" }> {
  try {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const full = systemHint ? `${systemHint}\n\nUSER: ${prompt}` : prompt;
    const res = await model.generateContent(full);
    return { text: res.response.text(), source: "gemini" };
  } catch (err) {
    console.error("[Gemini text error]", err);
    return {
      text: "I'm temporarily unable to reach the Gemini service. Please try again in a moment.",
      source: "fallback",
    };
  }
}
