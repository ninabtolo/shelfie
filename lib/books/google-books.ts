import "server-only";

import { mapGoogleBook } from "./mapper";
import { BOOKS_PAGE_SIZE } from "./search";
import type { Book } from "./types";

const API_URL = "https://www.googleapis.com/books/v1/volumes";
const MAX_TRANSIENT_RETRIES = 4;
const RETRY_BASE_DELAY_MS = 500;
const REQUEST_TIMEOUT_MS = 8_000;

export class GoogleBooksError extends Error {}

type GoogleBooksErrorResponse = {
  error?: {
    message?: unknown;
    errors?: Array<{ reason?: unknown }>;
  };
};

type UpstreamError = {
  message?: string;
  reason?: string;
};

function getUpstreamError(response: GoogleBooksErrorResponse): UpstreamError {
  const error = response.error;
  const message = typeof error?.message === "string" ? error.message : undefined;
  const reason = Array.isArray(error?.errors) && typeof error.errors[0]?.reason === "string"
    ? error.errors[0].reason
    : undefined;

  return { message, reason };
}

function retryDelay(response: Response, attempt: number) {
  const retryAfter = Number(response.headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.min(retryAfter * 1000, 10_000);
  }

  return RETRY_BASE_DELAY_MS * 2 ** attempt + Math.floor(Math.random() * 250);
}

function transientDelay(attempt: number) {
  return RETRY_BASE_DELAY_MS * 2 ** attempt + Math.floor(Math.random() * 250);
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function requestBooks(
  path: string,
  params = new URLSearchParams(),
  revalidate = 300,
) {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (!apiKey) {
    throw new GoogleBooksError("Book search is temporarily unavailable. Please try again later.");
  }

  params.set("key", apiKey);
  const url = `${API_URL}${path}?${params}`;

  for (let attempt = 0; attempt <= MAX_TRANSIENT_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Shelfie/1.0",
        },
        next: { revalidate },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (response.status === 404) return null;

      if (response.status === 429 || response.status === 503) {
        const errorResponse = await response.json().catch(() => null) as GoogleBooksErrorResponse | null;
        const upstreamError: UpstreamError = errorResponse ? getUpstreamError(errorResponse) : {};

        if (attempt < MAX_TRANSIENT_RETRIES) {
          await wait(retryDelay(response, attempt));
          continue;
        }

        console.error("[Google Books] request failed", JSON.stringify({
          status: response.status,
          attempts: attempt + 1,
          reason: upstreamError.reason,
          message: upstreamError.message,
        }));

        throw new GoogleBooksError(response.status === 429
          ? "Google Books is busy. Please try again in a moment."
          : "Google Books is temporarily unavailable. Please try again later.");
      }

      if (!response.ok) {
        const errorResponse = await response.json().catch(() => null) as GoogleBooksErrorResponse | null;
        const upstreamError: UpstreamError = errorResponse ? getUpstreamError(errorResponse) : {};

        // Log only provider diagnostics. The request URL contains the API key.
        console.error("[Google Books] request failed", JSON.stringify({
          status: response.status,
          attempts: attempt + 1,
          reason: upstreamError.reason,
          message: upstreamError.message,
        }));

        if (response.status === 400 || response.status === 403) {
          throw new GoogleBooksError(
            "Google Books rejected the request. Check that the Books API is enabled and the API key is valid.",
          );
        }

        throw new GoogleBooksError("Google Books is temporarily unavailable. Please try again later.");
      }

      return await response.json() as unknown;
    } catch (error) {
      if (error instanceof GoogleBooksError) throw error;
      if (attempt < MAX_TRANSIENT_RETRIES) {
        await wait(transientDelay(attempt));
        continue;
      }

      // Never expose the upstream request URL: it contains the API key.
      console.error("[Google Books] network or parsing error", {
        name: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : String(error),
        cause: error instanceof Error && error.cause instanceof Error ? error.cause.message : undefined,
      });
      throw new GoogleBooksError("Could not reach Google Books. Check the server's internet connection and try again.");
    }
  }

  throw new GoogleBooksError("Google Books is temporarily unavailable. Please try again later.");
}

export async function searchBooks(query: string, page = 1): Promise<{
  books: Book[];
  hasNextPage: boolean;
}> {
  if (!query.trim()) return { books: [], hasNextPage: false };

  const data = await requestBooks("", new URLSearchParams({
    q: query,
    printType: "books",
    orderBy: "relevance",
    maxResults: String(BOOKS_PAGE_SIZE),
    startIndex: String((page - 1) * BOOKS_PAGE_SIZE),
  }));

  if (!data || typeof data !== "object") {
    throw new GoogleBooksError("Could not load books. Please try again.");
  }

  const response = data as { items?: unknown; totalItems?: unknown };
  const items = Array.isArray(response.items) ? response.items : [];
  const books = items.map(mapGoogleBook).filter((book): book is Book => book !== null);

  return {
    books: [...new Map(books.map((book) => [book.google_books_id, book])).values()],
    hasNextPage: items.length === BOOKS_PAGE_SIZE && page < 1000,
  };
}

export async function getBook(id: string): Promise<Book | null> {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return null;
  const data = await requestBooks(`/${encodeURIComponent(id)}`, new URLSearchParams(), 3600);
  if (data === null) return null;
  const book = mapGoogleBook(data);
  if (!book) throw new GoogleBooksError("Could not load this book. Please try again.");
  return book;
}
