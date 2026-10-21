"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { BookCover } from "@/components/books/book-cover";
import { RemoveFromLibraryButton } from "@/components/books/remove-from-library-button";
import { Button } from "@/components/ui/button";

export type LibraryBookStatus = "reading" | "read" | "abandoned";

export type LibraryBook = {
  id: string;
  book_id: string;
  status: LibraryBookStatus;
  is_public: boolean;
  is_favorite: boolean;
};

export type LibraryBookWithDetails = LibraryBook & {
  book: {
    google_books_id: string;
    title: string;
    authors: string[] | null;
    cover_url: string | null;
  };
};

type FavoriteFilter = "all" | "favorite" | "not-favorite";
type VisibilityFilter = "all" | "public" | "private";

const statusLabels: Record<LibraryBookStatus, string> = {
  reading: "Reading",
  read: "Read",
  abandoned: "Abandoned",
};

export function LibraryBookList({ books }: { books: LibraryBookWithDetails[] }) {
  const [statusFilter, setStatusFilter] = useState<LibraryBookStatus | "all">("all");
  const [favoriteFilter, setFavoriteFilter] = useState<FavoriteFilter>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");

  const filteredBooks = useMemo(
    () =>
      books.filter((entry) => {
        const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
        const matchesFavorite = favoriteFilter === "all" ||
          (favoriteFilter === "favorite" ? entry.is_favorite : !entry.is_favorite);
        const matchesVisibility = visibilityFilter === "all" ||
          (visibilityFilter === "public" ? entry.is_public : !entry.is_public);

        return matchesStatus && matchesFavorite && matchesVisibility;
      }),
    [books, favoriteFilter, statusFilter, visibilityFilter],
  );

  const hasActiveFilters = statusFilter !== "all" || favoriteFilter !== "all" || visibilityFilter !== "all";

  function clearFilters() {
    setStatusFilter("all");
    setFavoriteFilter("all");
    setVisibilityFilter("all");
  }

  return (
    <>
      <section className="shelfie-surface space-y-4 p-4 sm:p-5" aria-label="Filter your library">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-lg font-semibold">Filter your library</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Narrow your books by reading status, favorite, or visibility.
            </p>
          </div>
          {hasActiveFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-2 text-sm font-medium">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as LibraryBookStatus | "all")}
              className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm font-normal shadow-sm outline-none transition focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All statuses</option>
              <option value="reading">Reading</option>
              <option value="read">Read</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium">
            <span>Favorite</span>
            <select
              value={favoriteFilter}
              onChange={(event) => setFavoriteFilter(event.target.value as FavoriteFilter)}
              className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm font-normal shadow-sm outline-none transition focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All books</option>
              <option value="favorite">Favorites only</option>
              <option value="not-favorite">Not favorites</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium">
            <span>Visibility</span>
            <select
              value={visibilityFilter}
              onChange={(event) => setVisibilityFilter(event.target.value as VisibilityFilter)}
              className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm font-normal shadow-sm outline-none transition focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All visibility</option>
              <option value="public">Public only</option>
              <option value="private">Private only</option>
            </select>
          </label>
        </div>

        <p className="text-xs text-muted-foreground" aria-live="polite">
          Showing {filteredBooks.length} of {books.length} {books.length === 1 ? "book" : "books"}
        </p>
      </section>

      {filteredBooks.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBooks.map((entry, index) => (
            <li key={entry.id} className="book-card flex gap-4 rounded-xl border bg-card p-4 shadow-sm">
              <Link
                href={`/protected/books/${encodeURIComponent(entry.book.google_books_id)}?from=library`}
                prefetch={false}
                className="flex min-w-0 flex-1 gap-4 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <BookCover
                  src={entry.book.cover_url}
                  title={entry.book.title}
                  priority={index === 0}
                  className="w-20 shrink-0 self-start"
                />
                <div className="min-w-0 space-y-2">
                  <h2 className="line-clamp-3 font-semibold">{entry.book.title}</h2>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {entry.book.authors?.join(", ") ?? "Unknown author"}
                  </p>
                  {entry.is_favorite && (
                    <p className="flex items-center gap-1 text-xs font-medium text-primary">
                      <Star aria-hidden="true" className="size-3.5" fill="currentColor" /> Favorite
                    </p>
                  )}
                  <p className="text-xs font-medium text-primary">{statusLabels[entry.status]}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.is_public ? "Public" : "Private"}
                  </p>
                </div>
              </Link>
              <RemoveFromLibraryButton bookId={entry.book_id} title={entry.book.title} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No books match these filters.</p>
          <Button type="button" variant="outline" className="mt-4" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      )}
    </>
  );
}
