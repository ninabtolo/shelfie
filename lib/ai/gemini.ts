import { isRecord } from "@/lib/ai/reading-context";

export type GeminiContent = {
  role: "user" | "model";
  parts: Array<{ text: string }>;
};

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }>;
};

export async function askGeminiJson(
  systemInstruction: string,
  contents: GeminiContent[],
  maxOutputTokens = 4500,
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const configuredModel = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";
    const models = [...new Set([configuredModel, "gemini-3.5-flash-lite"])];
    const requestBody = JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.85,
        maxOutputTokens,
      },
    });

    let response: Response | null = null;
    let modelUsed = configuredModel;
    for (const model of models) {
      modelUsed = model;
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          cache: "no-store",
          signal: controller.signal,
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: requestBody,
        },
      );
      if (response.status !== 404) break;
    }

    if (!response?.ok) {
      const providerError = await response?.text().catch(() => "") ?? "";
      console.error(`Gemini ${modelUsed} HTTP ${response?.status ?? "unknown"}:`, providerError.slice(0, 500));
      throw new Error(`Gemini HTTP ${response?.status ?? "unknown"}`);
    }

    const data = await response.json() as GeminiResponse;
    const raw = data.candidates?.[0]?.content?.parts?.map((part) => (
      typeof part.text === "string" ? part.text : ""
    )).join("");
    if (!raw) throw new Error("Gemini returned no response");

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) throw new Error("Invalid Gemini response");
    return parsed;
  } finally {
    clearTimeout(timeout);
  }
}
