"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { Book } from "@/lib/books/types";

const statuses = [
  { value: "reading", label: "Reading" },
  { value: "read", label: "Read" },
  { value: "abandoned", label: "Abandoned" },
] as const;

export function AddToLibraryForm({ book }: { book: Book }) {
  const [status, setStatus] = useState<(typeof statuses)[number]["value"]>("reading");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function addToLibrary() {
    setPending(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("add_book_to_library", {
      p_google_books_id: book.google_books_id,
      p_title: book.title,
      p_status: status,
      p_subtitle: book.subtitle,
      p_authors: book.authors,
      p_description: book.description,
      p_isbn_10: book.isbn_10,
      p_isbn_13: book.isbn_13,
      p_publisher: book.publisher,
      p_published_date: book.published_date,
      p_page_count: book.page_count,
      p_genres: book.genres,
      p_language: book.language,
      p_cover_url: book.cover_url,
    });

    if (rpcError) {
      setError(
        rpcError.code === "23505"
          ? "This book is already in your library."
          : "Could not add this book to your library. Please try again.",
      );
      setPending(false);
      return;
    }

    setSuccess(true);
    setPending(false);
  }

  return (
    <section className="space-y-3 border-t pt-6" aria-labelledby="add-to-library-title">
      <h2 id="add-to-library-title" className="font-semibold">Add to library</h2>
      <div className="grid gap-4 sm:grid-cols-[minmax(180px,auto)_auto] sm:items-end sm:gap-6">
        <div className="grid gap-2">
          <Label htmlFor="book-status" className="block">Status</Label>
          <select
            id="book-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            disabled={pending}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {statuses.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <Button type="button" className="h-9" onClick={addToLibrary} disabled={pending}>
          {pending ? "Adding…" : "Add to library"}
        </Button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {success && (
        <p role="status" className="text-sm text-green-600">
          Book added to your library.{" "}
          <Link href="/protected/library" className="font-medium underline">
            View my library
          </Link>
        </p>
      )}
    </section>
  );
}
