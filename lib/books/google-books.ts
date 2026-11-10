import "server-only";

import { GoogleBooksError, googleBooksRequest, quotaUserFor } from "./google-books-client";
import { mapGoogleBook } from "./mapper";
import { BOOKS_PAGE_SIZE } from "./search";
import type { Book } from "./types";

export { GoogleBooksError, type GoogleBooksErrorKind } from "./google-books-client";

// Partial response: only what the results grid renders.
const SEARCH_FIELDS = "totalItems,items(id,volumeInfo(title,subtitle,authors,publishedDate,imageLinks(thumbnail,smallThumbnail)))";

type VolumesResponse = { items?: unknown; totalItems?: unknown };

function asVolumes(data: unknown): VolumesResponse {
  return data && typeof data === "object" ? data as VolumesResponse : {};
}

function itemCount(data: unknown) {
  const items = asVolumes(data).items;
  return Array.isArray(items) ? items.length : 0;
}

export async function searchBooks(query: string, page = 1, options: { userId?: string } = {}): Promise<{
  books: Book[];
  hasNextPage: boolean;
}> {
  if (!query.trim()) return { books: [], hasNextPage: false };
  const startIndex = (page - 1) * BOOKS_PAGE_SIZE;

  const data = await googleBooksRequest({
    op: "search",
    params: {
      q: query,
      printType: "books",
      orderBy: "relevance",
      maxResults: String(BOOKS_PAGE_SIZE),
      startIndex: String(startIndex),
      fields: SEARCH_FIELDS,
    },
    priority: "interactive",
    ttlMs: 10 * 60_000,
    emptyTtlMs: 60_000,
    isEmpty: (value) => itemCount(value) === 0,
    // Google occasionally answers the first page with a count but no items.
    isSuspicious: (value) => startIndex === 0
      && itemCount(value) === 0
      && Number(asVolumes(value).totalItems) > 0,
    deadlineMs: 10_000,
    hedgeAfterMs: 2_500,
    quotaUser: quotaUserFor(options.userId),
  });

  const items = Array.isArray(asVolumes(data).items) ? asVolumes(data).items as unknown[] : [];
  const books = items.map(mapGoogleBook).filter((book): book is Book => book !== null);

  return {
    books: [...new Map(books.map((book) => [book.google_books_id, book])).values()],
    hasNextPage: items.length === BOOKS_PAGE_SIZE && page < 1000,
  };
}

export async function getBook(id: string, options: { userId?: string } = {}): Promise<Book | null> {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return null;

  const data = await googleBooksRequest({
    op: "volume",
    path: `/${encodeURIComponent(id)}`,
    backendFailedMeansNotFound: true,
    priority: "interactive",
    ttlMs: 60 * 60_000,
    emptyTtlMs: 5 * 60_000,
    deadlineMs: 10_000,
    hedgeAfterMs: 2_500,
    quotaUser: quotaUserFor(options.userId),
  });
  if (data === null) return null;

  const book = mapGoogleBook(data);
  if (!book) throw new GoogleBooksError("unavailable", "Could not load this book. Please try again.");
  return book;
}
