"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ensureBookSaved } from "@/lib/books/ensure-book";
import type { Book } from "@/lib/books/types";

type BookWishlistContextValue = {
  isInWishlist: boolean;
  isInLibrary: boolean;
  pending: boolean;
  error: string | null;
  toggleWishlist: () => Promise<void>;
  clearWishlist: () => void;
  setInLibrary: (value: boolean) => void;
};

const BookWishlistContext = createContext<BookWishlistContextValue | null>(null);

export function BookWishlistProvider({
  book,
  initialInWishlist = false,
  initialInLibrary = false,
  children,
}: {
  book: Book;
  initialInWishlist?: boolean;
  initialInLibrary?: boolean;
  children: ReactNode;
}) {
  const [isInWishlist, setIsInWishlist] = useState(initialInWishlist);
  const [isInLibrary, setIsInLibrary] = useState(initialInLibrary);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleWishlist() {
    setPending(true);
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
        setPending(false);
        return;
      }

      const { error: deleteError } = await supabase
        .from("wishlist")
        .delete()
        .eq("book_id", savedBook.id);
      if (deleteError) {
        setError("Could not remove this book from your wishlist. Please try again.");
        setPending(false);
        return;
      }
      setIsInWishlist(false);
    } else {
      try {
        await ensureBookSaved(book.google_books_id);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not add this book to your wishlist. Please try again.");
        setPending(false);
        return;
      }
      const { error: rpcError } = await supabase.rpc("add_book_to_wishlist", {
        p_google_books_id: book.google_books_id,
      });
      if (rpcError) {
        setError("Could not add this book to your wishlist. Please try again.");
        setPending(false);
        return;
      }
      setIsInWishlist(true);
    }
    setPending(false);
  }

  return (
    <BookWishlistContext.Provider
      value={{
        isInWishlist,
        isInLibrary,
        pending,
        error,
        toggleWishlist,
        clearWishlist: () => setIsInWishlist(false),
        setInLibrary: setIsInLibrary,
      }}
    >
      {children}
    </BookWishlistContext.Provider>
  );
}

function useBookWishlist() {
  const context = useContext(BookWishlistContext);
  if (!context) throw new Error("useBookWishlist must be used inside BookWishlistProvider.");
  return context;
}

export function WishlistButton() {
  const { isInWishlist, isInLibrary, pending, error, toggleWishlist } = useBookWishlist();

  if (isInLibrary) return null;

  return (
    <div className="flex flex-col items-end gap-2">
      <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={toggleWishlist} disabled={pending}>
        <Heart aria-hidden="true" fill={isInWishlist ? "currentColor" : "none"} />
        {isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
      </Button>
      {error && <p role="alert" className="text-right text-sm text-destructive">{error}</p>}
    </div>
  );
}

export { useBookWishlist };
