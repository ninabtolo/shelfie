import "server-only";

import { bestMatch, isConfidentMatch, mainTitle, surname, type VolumeMatch } from "@/lib/ai/book-match";
import { GoogleBooksError, googleBooksRequest, quotaUserFor } from "@/lib/books/google-books-client";
import { mapGoogleBook } from "@/lib/books/mapper";
import type { Book } from "@/lib/books/types";

export type BookCandidate = {
  title: string;
  author: string;
  reason: string;
  tier?: "known" | "hidden";
  from_wishlist?: boolean;
};

export type ResolvedBook = {
  google_books_id: string;
  title: string;
  authors: string[];
  description: string;
  cover_url: string | null;
  published_date: string | null;
  reason: string;
  tier?: "known" | "hidden";
  from_wishlist?: boolean;
};

export type ResolveOptions = { userId?: string; signal?: AbortSignal };

const RESOLVE_FIELDS = "items(id,volumeInfo(title,subtitle,authors,description,publishedDate,imageLinks(thumbnail,smallThumbnail)))";

function phrase(value: string) {
  return value.replace(/["]/g, " ").replace(/\s+/g, " ").trim();
}

async function searchVolumes(q: string, options: ResolveOptions): Promise<Book[]> {
  const data = await googleBooksRequest({
    op: "resolve",
    params: { q, maxResults: "10", printType: "books", fields: RESOLVE_FIELDS },
    priority: "background",
    ttlMs: 24 * 60 * 60_000,
    emptyTtlMs: 10 * 60_000,
    isEmpty: (value) => !Array.isArray((value as { items?: unknown } | null)?.items),
    deadlineMs: 6_000,
    quotaUser: quotaUserFor(options.userId),
    signal: options.signal,
  });
  const items = data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)
    ? (data as { items: unknown[] }).items
    : [];
  return items.map(mapGoogleBook).filter((book): book is Book => book !== null);
}

type Found = { book: Book; match: VolumeMatch };

function pick(candidate: BookCandidate, books: Book[]): Found | null {
  const match = bestMatch(candidate, books.map((book) => ({
    title: book.title,
    subtitle: book.subtitle,
    authors: book.authors,
    hasCover: Boolean(book.cover_url),
    hasDescription: Boolean(book.description),
  })));
  return match ? { book: books[match.index], match } : null;
}

function better(a: Found | null, b: Found | null) {
  if (!a) return b;
  if (!b) return a;
  return b.match.score > a.match.score + 0.001 ? b : a;
}

function toResolved(candidate: BookCandidate, book: Book): ResolvedBook {
  return {
    google_books_id: book.google_books_id,
    title: book.title,
    authors: book.authors ?? [],
    description: book.description ?? "",
    cover_url: book.cover_url,
    published_date: book.published_date,
    reason: candidate.reason,
    tier: candidate.tier,
    from_wishlist: candidate.from_wishlist,
  };
}

/**
 * Finds the Google Books volume for an AI-suggested title and author.
 * Tries a precise query first and only falls back to broader queries when
 * that misses, which is what lesser-known books usually need.
 */
export async function resolveGoogleBook(candidate: BookCandidate, options: ResolveOptions = {}): Promise<ResolvedBook | null> {
  const title = phrase(candidate.title);
  const main = phrase(mainTitle(candidate.title));
  const family = phrase(surname(candidate.author));
  if (!title) return null;

  let best: Found | null = null;
  let lastError: unknown = null;

  const precise = family ? `intitle:"${main}" inauthor:"${family}"` : `intitle:"${main}"`;
  try {
    best = pick(candidate, await searchVolumes(precise, options));
  } catch (error) {
    if (options.signal?.aborted) throw error;
    lastError = error;
    // Quota and configuration problems will not be fixed by more queries.
    if (error instanceof GoogleBooksError && (error.kind === "quota" || error.kind === "config")) throw error;
  }
  if (isConfidentMatch(best?.match ?? null)) return toResolved(candidate, best!.book);

  const fallbacks = [`"${title}" ${phrase(candidate.author)}`, `intitle:${title}`];
  const results = await Promise.allSettled(fallbacks.map((query) => searchVolumes(query, options)));
  if (options.signal?.aborted) throw new DOMException("The operation was aborted.", "AbortError");
  for (const result of results) {
    if (result.status === "fulfilled") best = better(best, pick(candidate, result.value));
    else lastError = result.reason;
  }

  if (best) return toResolved(candidate, best.book);
  if (lastError && results.every((result) => result.status === "rejected")) throw lastError;
  return null;
}

/** Resolves many candidates; the shared client limits concurrency. */
export async function resolveGoogleBooks(candidates: BookCandidate[], options: ResolveOptions = {}) {
  const resolved = await Promise.all(candidates.map((candidate) => (
    resolveGoogleBook(candidate, options).catch(() => null)
  )));
  return resolved.filter((book): book is ResolvedBook => book !== null);
}
