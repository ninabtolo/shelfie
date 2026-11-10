import "server-only";

import { createHash } from "node:crypto";

/**
 * The single entry point for Google Books requests (search, book details and
 * AI recommendation verification). It owns retries, hedging, a global
 * concurrency limit, an in-memory cache and diagnostics so every caller gets
 * the same behaviour.
 */

const API_URL = "https://www.googleapis.com/books/v1/volumes";
const MAX_CONCURRENT_REQUESTS = 10;
const MAX_RETRIES = 3;
const ATTEMPT_TIMEOUT_MS = 5_000;
const MIN_ATTEMPT_MS = 400;
const BACKOFF_BASE_MS = 300;
const MAX_RETRY_AFTER_MS = 2_000;
const SLOW_REQUEST_MS = 2_000;
const MAX_CACHE_ENTRIES = 1_000;

export type GoogleBooksErrorKind = "quota" | "busy" | "unavailable" | "network" | "config" | "invalid";

const ERROR_MESSAGES: Record<GoogleBooksErrorKind, string> = {
  quota: "Google Books has reached its usage limit for now. Please try again later.",
  busy: "Google Books is busy right now. Please try again in a moment.",
  unavailable: "Google Books is temporarily unavailable. Please try again.",
  network: "Could not reach Google Books. Check your connection and try again.",
  config: "Book search is not configured correctly. Check that the Books API is enabled and the API key is valid.",
  invalid: "Google Books could not understand this search. Try different words.",
};

export class GoogleBooksError extends Error {
  readonly kind: GoogleBooksErrorKind;

  constructor(kind: GoogleBooksErrorKind, message = ERROR_MESSAGES[kind]) {
    super(message);
    this.name = "GoogleBooksError";
    this.kind = kind;
  }
}

export type Priority = "interactive" | "background";

export type GoogleBooksRequest = {
  /** Short label for logs, e.g. "search", "volume", "resolve". */
  op: string;
  /** Appended to the volumes endpoint, e.g. `/${id}`. */
  path?: string;
  params?: Record<string, string>;
  priority?: Priority;
  /** How long a successful response is cached. */
  ttlMs: number;
  /** Shorter cache lifetime for responses `isEmpty` flags. */
  emptyTtlMs?: number;
  isEmpty?: (data: unknown) => boolean;
  /** A 200 that is probably a Google glitch (retried once). */
  isSuspicious?: (data: unknown) => boolean;
  /** Total time budget, including retries. */
  deadlineMs: number;
  /** Start a duplicate first attempt if the first one is this slow. */
  hedgeAfterMs?: number;
  /**
   * Volume lookups: Google answers unknown or malformed ids with a 503
   * "backendFailed" instead of 404. Treat a repeated one as not found.
   */
  backendFailedMeansNotFound?: boolean;
  /** Opaque per-user id so Google applies per-user quotas per real user. */
  quotaUser?: string;
  signal?: AbortSignal;
};

type Attempt =
  | { ok: true; data: unknown | null }
  | { ok: false; retryable: boolean; kind: GoogleBooksErrorKind; retryAfterMs?: number; status?: number; reason?: string };

type Waiter = { resume: () => void; reject: (error: unknown) => void };

type ClientState = {
  active: number;
  queues: Record<Priority, Waiter[]>;
  cache: Map<string, { expires: number; value: unknown | null }>;
  inflight: Map<string, Promise<unknown | null>>;
};

// Stored on globalThis so dev-mode hot reloads keep one limiter and cache.
const globalStore = globalThis as typeof globalThis & { __shelfieGoogleBooksV1?: ClientState };
const state: ClientState = globalStore.__shelfieGoogleBooksV1 ??= {
  active: 0,
  queues: { interactive: [], background: [] },
  cache: new Map(),
  inflight: new Map(),
};

export function quotaUserFor(userId: string | null | undefined) {
  if (!userId) return undefined;
  return createHash("sha256").update(`shelfie:${userId}`).digest("hex").slice(0, 32);
}

function abortError() {
  return new DOMException("The operation was aborted.", "AbortError");
}

function wait(milliseconds: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, milliseconds);
    function onAbort() {
      clearTimeout(timer);
      reject(abortError());
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function acquire(priority: Priority, signal?: AbortSignal) {
  if (signal?.aborted) return Promise.reject(abortError());
  if (state.active < MAX_CONCURRENT_REQUESTS) {
    state.active += 1;
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const queue = state.queues[priority];
    const waiter: Waiter = {
      resume: () => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      },
      reject,
    };
    function onAbort() {
      const index = queue.indexOf(waiter);
      if (index >= 0) queue.splice(index, 1);
      reject(abortError());
    }
    signal?.addEventListener("abort", onAbort, { once: true });
    queue.push(waiter);
  });
}

function release() {
  // The slot passes straight to the next waiter; interactive work goes first.
  const next = state.queues.interactive.shift() ?? state.queues.background.shift();
  if (next) next.resume();
  else state.active = Math.max(0, state.active - 1);
}

function cacheGet(key: string) {
  const entry = state.cache.get(key);
  if (!entry) return undefined;
  if (entry.expires <= Date.now()) {
    state.cache.delete(key);
    return undefined;
  }
  state.cache.delete(key);
  state.cache.set(key, entry);
  return entry;
}

function cacheSet(key: string, value: unknown | null, ttlMs: number) {
  if (ttlMs <= 0) return;
  state.cache.set(key, { value, expires: Date.now() + ttlMs });
  while (state.cache.size > MAX_CACHE_ENTRIES) {
    const oldest = state.cache.keys().next().value;
    if (oldest === undefined) break;
    state.cache.delete(oldest);
  }
}

function readUpstreamError(body: unknown) {
  const error = body && typeof body === "object" && "error" in body
    ? (body as { error?: { message?: unknown; errors?: Array<{ reason?: unknown }> } }).error
    : undefined;
  return {
    message: typeof error?.message === "string" ? error.message : "",
    reason: typeof error?.errors?.[0]?.reason === "string" ? error.errors[0].reason : "",
  };
}

function classify(status: number, reason: string, message: string): Pick<Extract<Attempt, { ok: false }>, "ok" | "retryable" | "kind"> {
  const dailyQuota = /daily|per day|quotaExceeded/i.test(`${reason} ${message}`);
  if (status === 429 || ((status === 403) && /limit|quota/i.test(reason))) {
    return dailyQuota
      ? { ok: false, retryable: false, kind: "quota" }
      : { ok: false, retryable: true, kind: "busy" };
  }
  if (status === 400 && /key/i.test(`${reason} ${message}`)) return { ok: false, retryable: false, kind: "config" };
  if (status === 401 || status === 403) return { ok: false, retryable: false, kind: "config" };
  if (status === 400) return { ok: false, retryable: false, kind: "invalid" };
  return { ok: false, retryable: status >= 500, kind: "unavailable" };
}

function log(level: "warn" | "info", details: Record<string, unknown>) {
  // Never log the request URL: it contains the API key.
  console[level]("[google-books]", JSON.stringify(details));
}

async function attemptOnce(
  url: string,
  request: GoogleBooksRequest,
  attempt: number,
  timeoutMs: number,
  signal: AbortSignal,
): Promise<Attempt> {
  await acquire(request.priority ?? "interactive", signal);
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]),
    });
    const elapsed = () => Date.now() - startedAt;

    if (response.status === 404) {
      await response.body?.cancel().catch(() => undefined);
      return { ok: true, data: null };
    }

    const body: unknown = await response.json().catch(() => undefined);

    if (!response.ok) {
      const upstream = readUpstreamError(body);
      const outcome = classify(response.status, upstream.reason, upstream.message);
      const retryAfter = Number(response.headers.get("retry-after"));
      log("warn", {
        op: request.op, status: response.status, reason: upstream.reason || undefined,
        message: upstream.message.slice(0, 160) || undefined, kind: outcome.kind, attempt, ms: elapsed(),
      });
      return {
        ...outcome,
        status: response.status,
        reason: upstream.reason || undefined,
        retryAfterMs: Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, MAX_RETRY_AFTER_MS)
          : undefined,
      };
    }

    if (body === undefined) {
      log("warn", { op: request.op, status: response.status, error: "invalid JSON", attempt, ms: elapsed() });
      return { ok: false, retryable: true, kind: "unavailable" };
    }

    if (elapsed() > SLOW_REQUEST_MS) log("info", { op: request.op, slow: true, attempt, ms: elapsed() });
    return { ok: true, data: body };
  } catch (error) {
    if (signal.aborted) throw error;
    const name = error instanceof Error ? error.name : "UnknownError";
    const cause = error instanceof Error && error.cause && typeof error.cause === "object"
      ? (error.cause as { code?: unknown }).code
      : undefined;
    log("warn", {
      op: request.op, error: name === "TimeoutError" ? "timeout" : name,
      cause: typeof cause === "string" ? cause : undefined, attempt, ms: Date.now() - startedAt,
    });
    return { ok: false, retryable: true, kind: "network" };
  } finally {
    release();
  }
}

/**
 * Runs the first attempt and, if it is still pending after `hedgeAfterMs`,
 * a duplicate one. The first success wins and the other is cancelled.
 */
function hedgedAttempt(
  url: string,
  request: GoogleBooksRequest,
  timeoutMs: number,
  parentSignal: AbortSignal,
): Promise<Attempt> {
  const losers = new AbortController();
  const signal = AbortSignal.any([parentSignal, losers.signal]);

  return new Promise<Attempt>((resolve, reject) => {
    let pending = 0;
    let settled = false;
    let firstFailure: Attempt | null = null;
    let hedgeTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = (outcome: Attempt) => {
      settled = true;
      clearTimeout(hedgeTimer);
      losers.abort();
      resolve(outcome);
    };

    const launch = (attempt: number) => {
      pending += 1;
      attemptOnce(url, request, attempt, timeoutMs, signal).then((outcome) => {
        pending -= 1;
        if (settled) return;
        if (outcome.ok || !outcome.retryable) return finish(outcome);
        firstFailure ??= outcome;
        if (pending === 0) finish(firstFailure);
      }, (error: unknown) => {
        pending -= 1;
        if (settled) return;
        if (parentSignal.aborted) {
          settled = true;
          clearTimeout(hedgeTimer);
          reject(error);
        } else if (pending === 0) {
          finish(firstFailure ?? { ok: false, retryable: true, kind: "network" });
        }
      });
    };

    launch(0);
    if (request.hedgeAfterMs && request.hedgeAfterMs < timeoutMs) {
      hedgeTimer = setTimeout(() => {
        if (settled) return;
        log("info", { op: request.op, hedged: true, afterMs: request.hedgeAfterMs });
        launch(0);
      }, request.hedgeAfterMs);
    }
  });
}

async function execute(url: string, request: GoogleBooksRequest): Promise<unknown | null> {
  const deadline = Date.now() + request.deadlineMs;
  const signal = request.signal ?? new AbortController().signal;
  let lastFailure: Extract<Attempt, { ok: false }> | null = null;
  let suspiciousRetried = false;
  let backendFailures = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES + (suspiciousRetried ? 1 : 0); attempt += 1) {
    const timeoutMs = Math.min(ATTEMPT_TIMEOUT_MS, deadline - Date.now());
    if (timeoutMs < MIN_ATTEMPT_MS) break;

    const outcome = attempt === 0 && request.hedgeAfterMs
      ? await hedgedAttempt(url, request, timeoutMs, signal)
      : await attemptOnce(url, request, attempt, timeoutMs, signal);

    if (outcome.ok) {
      if (!suspiciousRetried && outcome.data !== null && request.isSuspicious?.(outcome.data)) {
        suspiciousRetried = true;
        log("warn", { op: request.op, suspicious: "200 without items", attempt });
        await wait(150 + Math.floor(Math.random() * 150), signal);
        continue;
      }
      return outcome.data;
    }

    lastFailure = outcome;
    if (request.backendFailedMeansNotFound && outcome.status === 503 && outcome.reason === "backendFailed") {
      backendFailures += 1;
      if (backendFailures >= 2) return null;
    }
    if (!outcome.retryable || attempt >= MAX_RETRIES) break;
    const backoff = BACKOFF_BASE_MS * 2 ** attempt;
    const delay = outcome.retryAfterMs ?? Math.floor(backoff / 2 + Math.random() * backoff);
    if (Date.now() + delay + MIN_ATTEMPT_MS > deadline) break;
    await wait(delay, signal);
  }

  throw new GoogleBooksError(lastFailure?.kind ?? "busy");
}

/**
 * Fetches a Google Books volumes resource. Returns the parsed JSON, or null
 * for 404. Throws GoogleBooksError (with a user-safe message) on failure.
 */
export async function googleBooksRequest(request: GoogleBooksRequest): Promise<unknown | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY?.trim();
  if (!apiKey) {
    log("warn", { op: request.op, error: "GOOGLE_BOOKS_API_KEY is not set" });
    throw new GoogleBooksError("config", "Book search is temporarily unavailable. Please try again later.");
  }

  const params = new URLSearchParams(Object.entries(request.params ?? {})
    .sort(([a], [b]) => a.localeCompare(b)));
  const cacheKey = `${request.path ?? ""}?${params}`;

  const cached = cacheGet(cacheKey);
  if (cached) return cached.value;

  const running = state.inflight.get(cacheKey);
  if (running) return running;

  params.set("key", apiKey);
  if (request.quotaUser) params.set("quotaUser", request.quotaUser);
  const url = `${API_URL}${request.path ?? ""}?${params}`;

  const promise = execute(url, request).then((data) => {
    const empty = data === null || request.isEmpty?.(data);
    cacheSet(cacheKey, data, empty ? Math.min(request.ttlMs, request.emptyTtlMs ?? 60_000) : request.ttlMs);
    return data;
  }).finally(() => {
    state.inflight.delete(cacheKey);
  });
  state.inflight.set(cacheKey, promise);
  return promise;
}
