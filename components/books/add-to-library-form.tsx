"use client";

import { useEffect, useState } from "react";
import { BookOpen, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { Book } from "@/lib/books/types";
import { useBookWishlist } from "@/components/books/book-wishlist";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

const statuses = [
  { value: "reading", label: "Reading" },
  { value: "read", label: "Read" },
  { value: "abandoned", label: "Abandoned" },
] as const;

type BookStatus = (typeof statuses)[number]["value"];

export function AddToLibraryForm({
  book,
  initialStatus,
  initialIsFavorite = false,
}: {
  book: Book;
  initialStatus?: BookStatus;
  initialIsFavorite?: boolean;
}) {
  const [status, setStatus] = useState<BookStatus>(initialStatus ?? "reading");
  const [isPublic, setIsPublic] = useState(true);
  const [pendingAction, setPendingAction] = useState<"adding" | "removing" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [isInLibrary, setIsInLibrary] = useState(initialStatus !== undefined);
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [checkingLibrary, setCheckingLibrary] = useState(true);
  const {
    isInWishlist,
    pending: wishlistPending,
    clearWishlist,
    setInLibrary,
  } = useBookWishlist();
  const pending = pendingAction !== null || checkingLibrary || wishlistPending;

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
          setInLibrary(false);
          setCheckingLibrary(false);
        }
        return;
      }

      const { data: libraryEntry, error: libraryError } = await supabase
        .from("user_books")
        .select("status, is_public, is_favorite")
        .eq("book_id", savedBook.id)
        .maybeSingle();

      if (libraryError) {
        if (active) setError("Could not check your library. Please try again.");
      } else if (active) {
        const status = libraryEntry?.status;
        if (status === "reading" || status === "read" || status === "abandoned") {
          setStatus(status);
          setIsPublic(libraryEntry?.is_public !== false);
          setIsFavorite(libraryEntry?.is_favorite === true);
          setIsInLibrary(true);
          setInLibrary(true);
        } else {
          setIsInLibrary(false);
          setInLibrary(false);
        }
      }

      if (active) setCheckingLibrary(false);
    }

    void checkLibrary();
    return () => {
      active = false;
    };
  }, [book.google_books_id, setInLibrary]);

  async function removeFromLibrary() {
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
    setInLibrary(false);
    setIsFavorite(false);
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
      if (rpcError.code === "23505") {
        setIsInLibrary(true);
        setInLibrary(true);
      }
      setError(
        rpcError.code === "23505"
          ? "This book is already in your library."
          : "Could not add this book to your library. Please try again.",
      );
      setPendingAction(null);
      return;
    }

    setIsInLibrary(true);
    setInLibrary(true);

    if (isInWishlist) {
      const { data: savedBook, error: bookError } = await supabase
        .from("books")
        .select("id")
        .eq("google_books_id", book.google_books_id)
        .maybeSingle();
      if (bookError || !savedBook) {
        setError("Book added to library, but could not be removed from wishlist.");
        setPendingAction(null);
        return;
      }
      const { error: deleteError } = await supabase
        .from("wishlist")
        .delete()
        .eq("book_id", savedBook.id);
      if (deleteError) {
        setError("Book added to library, but could not be removed from wishlist.");
        setPendingAction(null);
        return;
      }
      clearWishlist();
    }
    setIsFavorite(false);
    setPendingAction(null);
  }

  async function toggleFavorite() {
    if (!isInLibrary) return;

    setPendingAction("adding");
    setError(null);
    const supabase = createClient();
    const { data: savedBook, error: bookError } = await supabase
      .from("books")
      .select("id")
      .eq("google_books_id", book.google_books_id)
      .maybeSingle();
    if (bookError || !savedBook) {
      setError("Could not update your favorites. Please try again.");
      setPendingAction(null);
      return;
    }

    const { error: favoriteError } = await supabase
      .from("user_books")
      .update({ is_favorite: !isFavorite })
      .eq("book_id", savedBook.id);

    if (favoriteError) {
      setError("Could not update your favorites. Please try again.");
      setPendingAction(null);
      return;
    }

    setIsFavorite((current) => !current);
    setPendingAction(null);
  }

  return (
    <section className="space-y-4 py-2" aria-labelledby="add-to-library-title">
      <h2 id="add-to-library-title" className="shelfie-section-heading">
        <BookOpen aria-hidden="true" className="size-6 text-primary" />
        <span>{isInLibrary ? "In my library" : "Add to library"}</span>
      </h2>
      <div className={isInLibrary
        ? "grid gap-4 lg:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.45fr)] lg:items-end lg:gap-6"
        : "grid gap-4 lg:grid-cols-[minmax(220px,1fr)_minmax(180px,0.72fr)_minmax(180px,0.82fr)] lg:items-end lg:gap-6"}>
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
        {isInLibrary ? (
          <div className="grid min-w-0 gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant={isFavorite ? "default" : "outline"}
              className="h-10 min-w-0 w-full px-2 text-xs sm:text-sm"
              onClick={toggleFavorite}
              disabled={pending}
            >
              <Star aria-hidden="true" fill={isFavorite ? "currentColor" : "none"} />
              <span className="truncate">{isFavorite ? "Remove from favorites" : "Add to favorites"}</span>
            </Button>
            <Button
              type="button"
              className="h-10 min-w-0 w-full px-2 text-xs text-white hover:bg-primary/90 sm:text-sm"
              onClick={() => setRemoveDialogOpen(true)}
              disabled={pending}
            >
              {pendingAction === "removing" ? "Removing…" : "Remove from library"}
            </Button>
          </div>
        ) : (
          <Button type="button" className="h-10 w-full" onClick={addToLibrary} disabled={pending}>
            {pendingAction === "adding" ? "Adding…" : "Add to library"}
          </Button>
        )}
        {!isInLibrary && (
          <label className="flex min-h-9 items-center gap-2 text-sm lg:pb-2">
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
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <ConfirmationDialog
        open={removeDialogOpen}
        title="Remove from your library?"
        description={`Are you sure you want to remove “${book.title}” from your library?`}
        confirmLabel="Remove book"
        pendingLabel="Removing…"
        onCancel={() => setRemoveDialogOpen(false)}
        onConfirm={removeFromLibrary}
      />
    </section>
  );
}
