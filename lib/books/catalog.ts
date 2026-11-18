import type { Book } from "./types";

const COVER_HOSTS = new Set(["books.google.com", "books.googleusercontent.com"]);

function clip(value: string | null, max: number) {
  return value === null ? null : value.slice(0, max);
}

function clipList(values: string[] | null, maxItems: number, maxItemLength: number) {
  return values === null ? null : values.slice(0, maxItems).map((value) => value.slice(0, maxItemLength));
}

function allowedCover(value: string | null) {
  if (!value || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && COVER_HOSTS.has(url.hostname) ? value : null;
  } catch {
    return null;
  }
}

/**
 * Fits Google Books data to the CHECK constraints on public.books (see the
 * security_hardening migration), so an unusually long field from Google
 * trims instead of failing the insert.
 */
export function toCatalogRow(book: Book): Book {
  return {
    google_books_id: book.google_books_id,
    title: book.title.slice(0, 500),
    subtitle: clip(book.subtitle, 500),
    authors: clipList(book.authors, 20, 90),
    description: clip(book.description, 20_000),
    isbn_10: clip(book.isbn_10, 20),
    isbn_13: clip(book.isbn_13, 20),
    publisher: clip(book.publisher, 300),
    published_date: clip(book.published_date, 32),
    page_count: book.page_count !== null && book.page_count <= 50_000 ? book.page_count : null,
    genres: clipList(book.genres, 20, 90),
    language: clip(book.language, 16),
    cover_url: allowedCover(book.cover_url),
  };
}
