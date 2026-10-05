import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { BookDetails } from "@/components/books/book-details";
import { Button } from "@/components/ui/button";
import { getBook, GoogleBooksError } from "@/lib/books/google-books";
import { bookSearchHref, parseBookSearch, type SearchParams } from "@/lib/books/search";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

async function BookContent({ id }: { id: string }) {
  let book;
  try {
    book = await getBook(id);
  } catch (error) {
    if (!(error instanceof GoogleBooksError)) throw error;
    return <p role="alert" className="rounded-lg border p-6 text-sm text-destructive">{error.message}</p>;
  }
  if (!book) notFound();

  const supabase = await createClient();
  const { data: savedBook, error: savedBookError } = await supabase
    .from("books")
    .select("id")
    .eq("google_books_id", book.google_books_id)
    .maybeSingle();

  if (savedBookError) throw new Error("Could not check your library.");

  let libraryStatus: "reading" | "read" | "abandoned" | undefined;
  let inWishlist = false;
  if (savedBook) {
    const { data: libraryEntry, error: libraryEntryError } = await supabase
      .from("user_books")
      .select("status")
      .eq("book_id", savedBook.id)
      .maybeSingle();

    if (libraryEntryError) throw new Error("Could not check your library.");
    if (
      libraryEntry?.status === "reading" ||
      libraryEntry?.status === "read" ||
      libraryEntry?.status === "abandoned"
    ) {
      libraryStatus = libraryEntry.status;
    }

    if (!libraryStatus) {
      const { data: wishlistEntry, error: wishlistError } = await supabase
        .from("wishlist")
        .select("id")
        .eq("book_id", savedBook.id)
        .maybeSingle();
      if (wishlistError) throw new Error("Could not check your wishlist.");
      inWishlist = Boolean(wishlistEntry);
    }
  }

  return <BookDetails book={book} libraryStatus={libraryStatus} inWishlist={inWishlist} />;
}

export default async function BookPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id }, search] = await Promise.all([params, searchParams]);
  const { query, page } = parseBookSearch(search);
  const fromLibrary = search.from === "library";
  const fromWishlist = search.from === "wishlist";

  return (
    <div className="space-y-6 py-8">
      <Button variant="ghost" asChild>
        <Link prefetch={false} href={fromLibrary ? "/protected/library" : fromWishlist ? "/protected/wishlist" : bookSearchHref(query, page)}>
          <ArrowLeft aria-hidden="true" />{fromLibrary ? "Back to library" : fromWishlist ? "Back to wishlist" : "Back to search"}
        </Link>
      </Button>
      <Suspense key={id} fallback={<p role="status" className="py-8 text-muted-foreground">Loading book details…</p>}>
        <BookContent id={id} />
      </Suspense>
    </div>
  );
}
