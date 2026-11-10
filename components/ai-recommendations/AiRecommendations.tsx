"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, EyeOff, RefreshCw, Sparkles } from "lucide-react";
import { BookCover } from "@/components/books/book-cover";
import { AiPersonalizationNotice } from "@/components/ai-personalization-notice";
import { ShelfieHero } from "@/components/shelfie-hero";
import { Button } from "@/components/ui/button";

type Recommendation = {
  google_books_id: string;
  title: string;
  authors: string[];
  description: string;
  cover_url: string | null;
  published_date: string | null;
  reason: string;
  tier: "known" | "hidden";
};

type ApiError = { error?: string };
type RecommendationCache = ApiError & {
  books?: Recommendation[];
  generated_at?: string | null;
  complete?: boolean;
};

type StreamEvent =
  | { type: "book"; book: Recommendation }
  | { type: "done"; books: Recommendation[]; partial?: boolean; cooldown_seconds?: number }
  | { type: "error"; error: string };

const GENERATION_COOLDOWN_MS = 20_000;
const RECOMMENDATION_COUNT = 6;

async function* readLines(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline = buffer.indexOf("\n");
    while (newline >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line) yield line;
      newline = buffer.indexOf("\n");
    }
  }
  const rest = (buffer + decoder.decode()).trim();
  if (rest) yield rest;
}

function RecommendationSkeleton() {
  return (
    <li className="shelfie-surface flex h-full flex-col gap-4 p-4">
      <div className="shelfie-skeleton mx-auto aspect-[2/3] w-32 rounded-md sm:w-36" />
      <div className="space-y-3">
        <div className="shelfie-skeleton h-3 w-24 rounded" />
        <div className="shelfie-skeleton h-5 w-4/5 rounded" />
        <div className="shelfie-skeleton h-4 w-2/5 rounded" />
        <div className="shelfie-skeleton h-14 w-full rounded" />
      </div>
    </li>
  );
}

export default function AiRecommendations() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [books, setBooks] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const started = useRef(false);
  const requestNumber = useRef(0);
  const cooldownRef = useRef(0);
  const generationInFlight = useRef<Promise<void> | null>(null);
  const booksRef = useRef<Recommendation[]>([]);

  useEffect(() => {
    booksRef.current = books;
  }, [books]);

  function startCooldown(seconds: number) {
    const next = Math.max(0, Math.ceil(seconds));
    cooldownRef.current = next;
    setCooldownSeconds(next);
  }

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = window.setTimeout(() => {
      const next = Math.max(0, cooldownSeconds - 1);
      cooldownRef.current = next;
      setCooldownSeconds(next);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldownSeconds]);

  const generate = useCallback(async () => {
    if (generationInFlight.current) {
      await generationInFlight.current;
      return;
    }
    if (cooldownRef.current > 0) return;

    const requestId = ++requestNumber.current;
    const isCurrent = () => requestId === requestNumber.current;
    const previousBooks = booksRef.current;
    const request = (async () => {
      setLoading(true);
      setError("");
      setBooks([]);
      const received: Recommendation[] = [];

      try {
        const response = await fetch("/api/ai-recommendations", {
          method: "POST",
          cache: "no-store",
        });

        // Errors before generation starts (auth, settings, cooldown) are plain JSON.
        if (!response.ok || !response.body || !response.headers.get("content-type")?.includes("ndjson")) {
          const data = (await response.json().catch(() => ({}))) as ApiError & { retry_after?: number };
          if (response.status === 429) startCooldown(data.retry_after ?? 20);
          throw new Error(data.error ?? "Could not generate recommendations");
        }

        startCooldown(GENERATION_COOLDOWN_MS / 1000);
        let finalBooks: Recommendation[] | null = null;
        let streamError = "";

        for await (const line of readLines(response.body)) {
          let event: StreamEvent;
          try {
            event = JSON.parse(line) as StreamEvent;
          } catch {
            continue;
          }
          if (event.type === "book") {
            received.push(event.book);
            if (isCurrent()) setBooks([...received]);
          } else if (event.type === "done") {
            finalBooks = event.books;
          } else if (event.type === "error") {
            streamError = event.error;
          }
        }

        if (finalBooks) {
          if (isCurrent()) setBooks(finalBooks);
        } else {
          throw new Error(streamError || "Recommendations stopped unexpectedly. Try again.");
        }
      } catch (cause) {
        if (isCurrent()) {
          // Nothing new arrived: keep showing the previous set instead of an empty grid.
          if (received.length === 0) setBooks(previousBooks);
          setError(cause instanceof Error ? cause.message : "Unexpected error");
        }
      } finally {
        if (requestId === requestNumber.current) setLoading(false);
      }
    })();
    generationInFlight.current = request;

    try {
      await request;
    } finally {
      if (generationInFlight.current === request) {
        generationInFlight.current = null;
      }
    }
  }, []);

  const loadCachedRecommendations = useCallback(async () => {
    const response = await fetch("/api/ai-recommendations", { cache: "no-store" });
    const data = (await response.json()) as RecommendationCache;
    if (!response.ok) throw new Error(data.error ?? "Could not load recommendations");

    const cachedBooks = data.books ?? [];
    const generatedAt = data.generated_at ? Date.parse(data.generated_at) : NaN;
    const cacheAge = Number.isFinite(generatedAt) ? Math.max(0, Date.now() - generatedAt) : Infinity;

    // Loading the page must never generate a new set. The cached set stays in
    // place until the user explicitly clicks Refresh recommendations.
    if (cachedBooks.length > 0) {
      setBooks(cachedBooks);
      setError("");
      if (cacheAge < GENERATION_COOLDOWN_MS) {
        startCooldown(Math.ceil((GENERATION_COOLDOWN_MS - cacheAge) / 1000));
      }
      return;
    }

    setBooks([]);
  }, []);

  useEffect(() => {
    // React Strict Mode can run effects twice in development. Guard against duplicate requests.
    if (started.current) return;
    started.current = true;

    void (async () => {
      try {
        const response = await fetch("/api/ai-recommendations/settings", { cache: "no-store" });
        const data = (await response.json()) as ApiError & { enabled?: boolean };
        if (!response.ok) throw new Error(data.error ?? "Could not load settings");

        setEnabled(Boolean(data.enabled));
        if (data.enabled) await loadCachedRecommendations();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not load settings");
      }
    })();
  }, [loadCachedRecommendations]);

  async function dismiss(book: Recommendation) {
    if (dismissingId) return;

    setDismissingId(book.google_books_id);
    setError("");
    try {
      const response = await fetch("/api/ai-recommendations/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          google_books_id: book.google_books_id,
          title: book.title,
          authors: book.authors,
        }),
      });
      const data = (await response.json()) as ApiError;
      if (!response.ok) throw new Error(data.error ?? "Could not save Not Interested");
      setBooks((previous) => previous.filter((item) => item.google_books_id !== book.google_books_id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not dismiss book");
    } finally {
      setDismissingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <ShelfieHero
        title="Your next reads"
        description="Six discoveries shaped by the details that make your reading taste yours."
      />

      <section className="space-y-5" aria-label="Recommendation settings">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Fresh from Gemini + Google Books</p>
            <p className="text-sm text-muted-foreground">Known picks and genuinely lesser-known finds. “Verified” means Google Books matched the title and author; a cover may still be unavailable.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 self-start sm:self-auto"
            onClick={() => void generate()}
            disabled={enabled !== true || loading || cooldownSeconds > 0}
          >
            <RefreshCw className={loading ? "animate-spin" : undefined} aria-hidden="true" />
            {loading ? "Finding your next reads…" : cooldownSeconds > 0 ? `Refresh in ${cooldownSeconds}s` : "Refresh recommendations"}
          </Button>
        </div>

        {enabled === null ? (
          <div className="shelfie-surface space-y-3 p-5" aria-busy="true">
            <div className="shelfie-skeleton h-5 w-48 rounded" />
            <div className="shelfie-skeleton h-4 w-full max-w-2xl rounded" />
            <div className="shelfie-skeleton h-4 w-2/3 rounded" />
          </div>
        ) : (
          <AiPersonalizationNotice enabled={enabled} />
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </section>

      {enabled === false && (
        <section className="shelfie-surface flex flex-col items-center gap-3 p-10 text-center" aria-label="Personalization disabled">
          <EyeOff className="size-8 text-primary" aria-hidden="true" />
          <h2 className="text-2xl font-semibold">Personalization is off</h2>
          <p className="max-w-lg text-sm leading-6 text-muted-foreground">
            Turn it on above when you want Shelfie to use your reading signals. Your saved recommendations will stay the same when you return to this page; use Refresh recommendations whenever you want a new set.
          </p>
        </section>
      )}

      {enabled && (
        <section className="space-y-5" aria-label="Recommendations">
          {(loading || books.length > 0) && (
            <ul
              className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
              aria-busy={loading}
              aria-label={loading ? `Loading recommendations, ${books.length} of ${RECOMMENDATION_COUNT} ready` : undefined}
            >
              {books.map((book, index) => (
                <li key={book.google_books_id} className="h-full">
                  <article className="book-card flex h-full flex-col rounded-xl border bg-card p-4">
                    <div className="mb-4 flex justify-center">
                      <BookCover
                        src={book.cover_url}
                        title={book.title}
                        priority={index === 0}
                        sizes="(min-width: 1280px) 144px, 128px"
                        className="w-32 sm:w-36"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-primary">
                          {book.tier === "hidden" ? "Lesser-known find" : "Known pick"}
                        </span>
                        <span className="flex items-center gap-1 text-[0.68rem] text-muted-foreground">
                          <Check className="size-3.5 text-primary" aria-hidden="true" /> Verified
                        </span>
                      </div>
                      <h3 className="mt-3 line-clamp-3 text-xl font-semibold">{book.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{book.authors.join(", ") || "Unknown author"}</p>
                      {book.published_date && <p className="mt-1 text-xs text-muted-foreground">{book.published_date}</p>}
                      <p className="mt-4 border-l-2 border-primary/40 pl-3 text-sm leading-6 text-muted-foreground">{book.reason}</p>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5">
                        <Button variant="link" size="sm" asChild>
                          <Link href={`/protected/books/${encodeURIComponent(book.google_books_id)}?from=recommendations`} prefetch={false}>
                            See details <ArrowUpRight aria-hidden="true" />
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => void dismiss(book)}
                          disabled={dismissingId !== null}
                        >
                          {dismissingId === book.google_books_id ? "Saving…" : "Not Interested"}
                        </Button>
                      </div>
                    </div>
                  </article>
                </li>
              ))}
              {loading && Array.from(
                { length: Math.max(0, RECOMMENDATION_COUNT - books.length) },
                (_, index) => <RecommendationSkeleton key={`skeleton-${index}`} />,
              )}
            </ul>
          )}

          {!loading && !books.length && !error && (
            <div className="shelfie-surface flex flex-col items-center gap-3 p-10 text-center">
              <Sparkles className="size-8 text-primary" aria-hidden="true" />
              <h2 className="text-2xl font-semibold">No saved recommendations yet</h2>
              <p className="max-w-lg text-sm leading-6 text-muted-foreground">
                Use Refresh recommendations to generate your first set. Books you mark Not Interested will stay out of future generations.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
