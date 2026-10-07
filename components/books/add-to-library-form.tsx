"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { Book } from "@/lib/books/types";

const statuses = [
  { value: "reading", label: "Reading" },
  { value: "read", label: "Read" },
  { value: "abandoned", label: "Abandoned" },
] as const;

type BookStatus = (typeof statuses)[number]["value"];

export function AddToLibraryForm({
  book,
  initialStatus,
  initialInWishlist = false,
}: {
  book: Book;
  initialStatus?: BookStatus;
  initialInWishlist?: boolean;
}) {
  const [status, setStatus] = useState<BookStatus>(initialStatus ?? "reading");
  const [isPublic, setIsPublic] = useState(true);
  const [pendingAction, setPendingAction] = useState<"adding" | "removing" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInLibrary, setIsInLibrary] = useState(initialStatus !== undefined);
  const [isInWishlist, setIsInWishlist] = useState(initialInWishlist);
  const [checkingLibrary, setCheckingLibrary] = useState(true);
  const pending = pendingAction !== null || checkingLibrary;

  useEffect(() => {
    let active = true;

    async function checkLibrary() {
      const supabase = createClient();
      const { data: savedBook, error: bookError } = await supabase
        .from("books")
        .select("id")
        .eq("google_books_id", book.google_books_id)
        .maybeSingle();

      if (bookError) {
        if (active) setError("Could not check your library. Please try again.");
        if (active) setCheckingLibrary(false);
        return;
      }

      if (!savedBook) {
        if (active) {
          setIsInLibrary(false);
          setCheckingLibrary(false);
        }
        return;
      }

      const { data: libraryEntry, error: libraryError } = await supabase
        .from("user_books")
        .select("status, is_public")
        .eq("book_id", savedBook.id)
        .maybeSingle();

      if (libraryError) {
        if (active) setError("Could not check your library. Please try again.");
      } else if (active) {
        const status = libraryEntry?.status;
        if (status === "reading" || status === "read" || status === "abandoned") {
          setStatus(status);
          setIsPublic(libraryEntry?.is_public !== false);
          setIsInLibrary(true);
          setIsInWishlist(false);
        } else {
          setIsInLibrary(false);
        }
      }

      if (active) setCheckingLibrary(false);
    }

    void checkLibrary();
    return () => {
      active = false;
    };
  }, [book.google_books_id]);

  async function toggleWishlist() {
    setPendingAction("adding");
    setError(null);
    const supabase = createClient();

    if (isInWishlist) {
      const { data: savedBook, error: bookError } = await supabase
        .from("books")
        .select("id")
        .eq("google_books_id", book.google_books_id)
        .maybeSingle();

      if (bookError || !savedBook) {
        setError("Could not remove this book from your wishlist. Please try again.");
        setPendingAction(null);
        return;
      }

      const { error: deleteError } = await supabase
        .from("wishlist")
        .delete()
        .eq("book_id", savedBook.id);
      if (deleteError) {
        setError("Could not remove this book from your wishlist. Please try again.");
        setPendingAction(null);
        return;
      }
      setIsInWishlist(false);
    } else {
      const { error: rpcError } = await supabase.rpc("add_book_to_wishlist", {
        p_google_books_id: book.google_books_id,
        p_title: book.title,
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
        setError("Could not add this book to your wishlist. Please try again.");
        setPendingAction(null);
        return;
      }
      setIsInWishlist(true);
    }
    setPendingAction(null);
  }

  async function removeFromLibrary() {
    if (!window.confirm("Remove this book from your library?")) return;

    setPendingAction("removing");
    setError(null);

    const supabase = createClient();
    const { data: savedBook, error: bookError } = await supabase
      .from("books")
      .select("id")
      .eq("google_books_id", book.google_books_id)
      .maybeSingle();

    if (bookError || !savedBook) {
      setError("Could not remove this book from your library. Please try again.");
      setPendingAction(null);
      return;
    }

    const { error: deleteError } = await supabase
      .from("user_books")
      .delete()
      .eq("book_id", savedBook.id);

    if (deleteError) {
      setError("Could not remove this book from your library. Please try again.");
      setPendingAction(null);
      return;
    }

    setIsInLibrary(false);
    setStatus("reading");
    setPendingAction(null);
  }

  async function addToLibrary() {
    setPendingAction("adding");
    setError(null);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("add_book_to_library", {
      p_google_books_id: book.google_books_id,
      p_title: book.title,
      p_status: status,
      p_is_public: isPublic,
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
      setPendingAction(null);
      return;
    }

    if (isInWishlist) {
      const { data: savedBook, error: bookError } = await supabase
        .from("books")
        .select("id")
        .eq("google_books_id", book.google_books_id)
        .maybeSingle();
      if (bookError || !savedBook) {
        setError("Book added to library, but could not be removed from wishlist.");
        setIsInLibrary(true);
        setPendingAction(null);
        return;
      }
      const { error: deleteError } = await supabase
        .from("wishlist")
        .delete()
        .eq("book_id", savedBook.id);
      if (deleteError) {
        setError("Book added to library, but could not be removed from wishlist.");
        setIsInLibrary(true);
        setPendingAction(null);
        return;
      }
      setIsInWishlist(false);
    }
    setIsInLibrary(true);
    setPendingAction(null);
  }

  return (
    <section className="space-y-3 border-t pt-6" aria-labelledby="add-to-library-title">
      <h2 id="add-to-library-title" className="font-semibold">
        {isInLibrary ? "In my library" : "Add to library"}
      </h2>
      <div className="grid gap-4 sm:grid-cols-[minmax(180px,auto)_auto] sm:items-end sm:gap-6">
        <div className="grid gap-2">
          <Label htmlFor="book-status" className="block">Status</Label>
          <select
            id="book-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            disabled={pending || isInLibrary}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {statuses.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        {!isInLibrary && (
          <label className="flex items-center gap-2 text-sm sm:pb-2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => setIsPublic(event.target.checked)}
              disabled={pending}
              className="size-4 accent-primary"
            />
            Add to my public library
          </label>
        )}
        {isInLibrary ? (
          <Button
            type="button"
            className="h-9 text-white hover:bg-primary/90"
            onClick={removeFromLibrary}
            disabled={pending}
          >
            {pendingAction === "removing" ? "Removing…" : "Remove from library"}
          </Button>
        ) : (
          <Button type="button" className="h-9" onClick={addToLibrary} disabled={pending}>
            {pendingAction === "adding" ? "Adding…" : "Add to library"}
          </Button>
        )}
      </div>
      {(!isInLibrary || isInWishlist) && (
        <Button type="button" variant="outline" onClick={toggleWishlist} disabled={pending}>
          {isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        </Button>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
