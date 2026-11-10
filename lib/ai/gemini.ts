import { isRecord } from "@/lib/ai/reading-context";

export type GeminiContent = {
  role: "user" | "model";
  parts: Array<{ text: string }>;
};

type GeminiPart = { text?: unknown; thought?: unknown };
type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: GeminiPart[] }; finishReason?: unknown }>;
  error?: { code?: unknown; message?: unknown; status?: unknown };
};

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 25_000;
// A healthy stream starts within a couple of seconds and never pauses for long.
const STREAM_FIRST_CHUNK_TIMEOUT_MS = 10_000;
const STREAM_IDLE_TIMEOUT_MS = 8_000;
// Used in order when the configured model is missing or overloaded.
const FALLBACK_MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-flash-lite-latest"];

export class GeminiError extends Error {
  readonly status: number | null;
  readonly retryable: boolean;

  constructor(message: string, status: number | null, retryable: boolean) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
    this.retryable = retryable;
  }
}

export function geminiModels() {
  const configured = process.env.GEMINI_MODEL?.trim();
  return [...new Set([configured, ...FALLBACK_MODELS].filter((model): model is string => Boolean(model)))];
}

function requestBody(systemInstruction: string, contents: GeminiContent[], maxOutputTokens: number) {
  return JSON.stringify({
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.85,
      maxOutputTokens,
    },
  });
}

function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("GEMINI_API_KEY is not configured", null, false);
  return key;
}

function isRetryableStatus(status: number) {
  // 404: model not available to this key, try the next one.
  return status === 404 || status === 408 || status === 429 || status >= 500;
}

function textOf(response: GeminiResponse) {
  return response.candidates?.[0]?.content?.parts?.map((part) => (
    typeof part.text === "string" && part.thought !== true ? part.text : ""
  )).join("") ?? "";
}

async function callModel(
  model: string,
  method: "generateContent" | "streamGenerateContent",
  body: string,
  signal: AbortSignal,
) {
  const query = method === "streamGenerateContent" ? "?alt=sse" : "";
  const response = await fetch(`${API_URL}/${encodeURIComponent(model)}:${method}${query}`, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]),
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey() },
    body,
  });

  if (!response.ok) {
    const providerError = await response.text().catch(() => "");
    console.error(`[gemini] ${model} HTTP ${response.status}:`, providerError.slice(0, 300));
    throw new GeminiError(`Gemini HTTP ${response.status}`, response.status, isRetryableStatus(response.status));
  }
  return response;
}

/** One JSON response; falls back to other models when one is unavailable. */
export async function askGeminiJson(
  systemInstruction: string,
  contents: GeminiContent[],
  maxOutputTokens = 4500,
) {
  const body = requestBody(systemInstruction, contents, maxOutputTokens);
  const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS * 2);
  let lastError: unknown = null;

  for (const model of geminiModels()) {
    try {
      const response = await callModel(model, "generateContent", body, signal);
      const raw = textOf(await response.json() as GeminiResponse);
      if (!raw) throw new GeminiError("Gemini returned no response", null, true);
      const parsed: unknown = JSON.parse(raw);
      if (!isRecord(parsed)) throw new GeminiError("Invalid Gemini response", null, true);
      return parsed;
    } catch (error) {
      lastError = error;
      // Overload, timeouts, network and malformed output: try the next model.
      if (signal.aborted || (error instanceof GeminiError && !error.retryable)) break;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Gemini request failed");
}

/**
 * Streams the response text of one model as it is generated. Throws a
 * GeminiError if the stream fails part-way (Gemini can send a 503 error body
 * after a 200 response has already started).
 */
export async function* streamGeminiText(
  model: string,
  systemInstruction: string,
  contents: GeminiContent[],
  options: { maxOutputTokens?: number; signal?: AbortSignal } = {},
): AsyncGenerator<string> {
  const parentSignal = options.signal ?? new AbortController().signal;
  const stalled = new AbortController();
  let stallTimer: ReturnType<typeof setTimeout> | undefined;
  const armStallTimer = (milliseconds: number) => {
    clearTimeout(stallTimer);
    stallTimer = setTimeout(() => stalled.abort(), milliseconds);
  };
  const signal = AbortSignal.any([parentSignal, stalled.signal]);
  const stallError = () => {
    console.error(`[gemini] ${model} stream stalled`);
    return new GeminiError("Gemini stream stalled", null, true);
  };

  armStallTimer(STREAM_FIRST_CHUNK_TIMEOUT_MS);
  let response: Response;
  try {
    response = await callModel(
      model,
      "streamGenerateContent",
      requestBody(systemInstruction, contents, options.maxOutputTokens ?? 4500),
      signal,
    );
  } catch (error) {
    clearTimeout(stallTimer);
    if (stalled.signal.aborted && !parentSignal.aborted) throw stallError();
    throw error;
  }
  if (!response.body) {
    clearTimeout(stallTimer);
    throw new GeminiError("Gemini returned no stream", null, true);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let nonEventText = "";
  let finished = false;

  function handleLine(rawLine: string): string {
    const line = rawLine.replace(/\r$/, "");
    if (!line.startsWith("data:")) {
      if (line.trim()) nonEventText += `${line}\n`;
      return "";
    }
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") return "";
    const event = JSON.parse(payload) as GeminiResponse;
    if (event.error) {
      throw new GeminiError(`Gemini stream error ${String(event.error.code ?? "")}`, Number(event.error.code) || null, true);
    }
    if (event.candidates?.[0]?.finishReason) finished = true;
    return textOf(event);
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      armStallTimer(STREAM_IDLE_TIMEOUT_MS);
      buffer += decoder.decode(value, { stream: true });
      let newline = buffer.indexOf("\n");
      while (newline >= 0) {
        const text = handleLine(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
        if (text) yield text;
        newline = buffer.indexOf("\n");
      }
    }
    const tail = handleLine(buffer + decoder.decode());
    if (tail) yield tail;
  } catch (error) {
    if (stalled.signal.aborted && !parentSignal.aborted) throw stallError();
    throw error;
  } finally {
    clearTimeout(stallTimer);
    await reader.cancel().catch(() => undefined);
  }

  if (!finished) {
    const status = Number(/"code":\s*(\d+)/.exec(nonEventText)?.[1]) || null;
    console.error(`[gemini] ${model} stream ended early${status ? ` with ${status}` : ""}`, nonEventText.slice(0, 200));
    throw new GeminiError("Gemini stream ended early", status, true);
  }
}
