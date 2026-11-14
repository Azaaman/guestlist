// Provider-agnostic JSON generation. Uses Gemini (free tier) or Anthropic.
// AI_PROVIDER=gemini|anthropic picks the primary; the other is tried as a
// fallback if its key is present (useful when the Gemini free quota runs out).

type Provider = "gemini" | "anthropic";

const TIMEOUT_MS = 22000;
const TOTAL_MS = 50000; // stay under the 60s serverless limit

function withTimeout(ms: number) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return { signal: c.signal, done: () => clearTimeout(t) };
}

// Gemini model names to try, in order. Any failure (overloaded 503, quota 429, unknown
// model 404, timeout) moves on to the next one, so one busy model never breaks the demo.
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-flash-lite-latest", "gemini-flash-latest"];

async function callGemini(system: string, prompt: string, deadline: number): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");
  const models = [process.env.GEMINI_MODEL, ...GEMINI_MODELS].filter(
    (m, i, a): m is string => !!m && a.indexOf(m) === i,
  );
  const errors: string[] = [];
  for (const model of models) {
    const left = deadline - Date.now();
    if (left < 4000) break;
    const t = withTimeout(Math.min(TIMEOUT_MS, left));
    try {
      const generationConfig: Record<string, unknown> = { responseMimeType: "application/json", temperature: 0.9 };
      // 2.5 Flash "thinks" by default, which is slow; these prompts don't need it.
      if (model.startsWith("gemini-2.5-flash")) generationConfig.thinkingConfig = { thinkingBudget: 0 };
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          signal: t.signal,
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig,
          }),
        },
      );
      if (!res.ok) {
        errors.push(`${model}: ${res.status}`);
        console.error(`[ai] Gemini ${model} ${res.status}: ${(await res.text()).slice(0, 200)}`);
        continue;
      }
      const data = await res.json();
      const text: string | undefined = data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? "")
        .join("");
      if (!text) {
        errors.push(`${model}: empty reply`);
        continue;
      }
      return text;
    } catch (e) {
      errors.push(`${model}: ${e instanceof Error && e.name === "AbortError" ? "timed out" : "network error"}`);
    } finally {
      t.done();
    }
  }
  throw new Error(`Gemini is unavailable right now (${errors.join(", ") || "out of time"}). Try again in a minute.`);
}

async function callAnthropic(system: string, prompt: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY missing");
  const t = withTimeout(TIMEOUT_MS);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: t.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
        max_tokens: 4000,
        system: system + "\nRespond with a single valid JSON object only. No markdown, no prose.",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    return (data?.content ?? []).map((b: { text?: string }) => b.text ?? "").join("");
  } finally {
    t.done();
  }
}

export function parseJson<T>(text: string): T {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as T;
    throw new Error("AI returned invalid JSON");
  }
}

export async function generateJson<T>(system: string, prompt: string): Promise<T> {
  const primary: Provider = process.env.AI_PROVIDER === "anthropic" ? "anthropic" : "gemini";
  const order: Provider[] = primary === "gemini" ? ["gemini", "anthropic"] : ["anthropic", "gemini"];
  const available = order.filter((p) =>
    p === "gemini" ? !!process.env.GEMINI_API_KEY : !!process.env.ANTHROPIC_API_KEY,
  );
  if (available.length === 0) throw new Error("No AI key configured (GEMINI_API_KEY or ANTHROPIC_API_KEY)");
  const deadline = Date.now() + TOTAL_MS;
  let lastErr: unknown;
  for (const p of available) {
    for (let attempt = 0; attempt < 2 && deadline - Date.now() > 4000; attempt++) {
      try {
        const text = p === "gemini" ? await callGemini(system, prompt, deadline) : await callAnthropic(system, prompt);
        return parseJson<T>(text);
      } catch (e) {
        lastErr = e;
        console.error(`[ai] ${p} attempt ${attempt + 1} failed:`, e);
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("AI request failed");
}
