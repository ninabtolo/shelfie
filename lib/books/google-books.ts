import "server-only";

import { mapGoogleBook } from "./mapper";
import { BOOKS_PAGE_SIZE } from "./search";
import type { Book } from "./types";

const API_URL = "https://www.googleapis.com/books/v1/volumes";

export class GoogleBooksError extends Error {}

async function requestBooks(path: string, params = new URLSearchParams()) {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (!apiKey) {
    throw new GoogleBooksError("Book search is temporarily unavailable. Please try again later.");
  }

  params.set("key", apiKey);
  const url = `${API_URL}${path}?${params}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (response.status === 404) return null;
    if (response.status === 429) {
      throw new GoogleBooksError("Google Books is busy. Please try again in a moment.");
    }
    if (!response.ok) throw new Error("Google Books request failed");
    return await response.json() as unknown;
  } catch (error) {
    if (error instanceof GoogleBooksError) throw error;
    // Never expose the upstream request URL: it contains the API key.
    throw new GoogleBooksError("Could not reach Google Books. Please try again.");
  }
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
  const data = await requestBooks(`/${encodeURIComponent(id)}`);
  if (data === null) return null;
  const book = mapGoogleBook(data);
  if (!book) throw new GoogleBooksError("Could not load this book. Please try again.");
  return book;
}
