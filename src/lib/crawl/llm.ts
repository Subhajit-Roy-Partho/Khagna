// Optional LLM normalization for noisy retailer titles, via any
// OpenAI-compatible endpoint (see LLMurl / LLMkey / ModelsAllowed in .env).
// Never throws: returns null when unconfigured or on any failure, and the
// pipeline falls back to regex parsing.

export type NormalizedTitle = {
  brand: string;
  name_en: string;
  size_text: string;
  unit: "kg" | "g" | "lb" | "oz" | "piece";
};

function llmConfig(): { base: string; key: string; model: string } | null {
  const base = process.env.LLMurl || process.env.LLM_URL || "";
  const key = process.env.LLMkey || process.env.LLM_KEY || "";
  if (!base || !key) return null;
  const allowed = (process.env.ModelsAllowed || "").split(",").map((s) => s.trim()).filter(Boolean);
  const model = process.env.LLM_MODEL || allowed[0] || "";
  if (!model) return null;
  return { base: base.replace(/\/$/, ""), key, model };
}

export function llmEnabled(): boolean {
  return llmConfig() !== null;
}

export async function normalizeTitle(
  rawTitle: string,
  retailer: string
): Promise<NormalizedTitle | null> {
  const cfg = llmConfig();
  if (!cfg || !rawTitle) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${cfg.base}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.key}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: 150,
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "You extract grocery product facts. Reply with ONLY a JSON object, no other text.",
          },
          {
            role: "user",
            content: `Retailer: ${retailer}\nRaw title: ${rawTitle}\nReturn JSON: {"brand": string, "name_en": short product name without pack size, "size_text": pack size like "5 lb" or "12 ct" or "", "unit": one of kg,g,lb,oz,piece}`,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]) as Partial<NormalizedTitle>;
    if (!parsed.name_en || !["kg", "g", "lb", "oz", "piece"].includes(String(parsed.unit))) return null;
    return {
      brand: String(parsed.brand ?? "").slice(0, 80),
      name_en: String(parsed.name_en).slice(0, 120),
      size_text: String(parsed.size_text ?? "").slice(0, 40),
      unit: parsed.unit as NormalizedTitle["unit"],
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
