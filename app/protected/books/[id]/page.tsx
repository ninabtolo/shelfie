import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { BookDetails } from "@/components/books/book-details";
import type { PublicReview } from "@/components/books/public-reviews";
import type { ReviewInput } from "@/components/books/review-form";
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
  let isFavorite = false;
  let inWishlist = false;
  let publicReviews: PublicReview[] = [];
  let myReviews: ReviewInput[] = [];
  if (savedBook) {
    const { data: libraryEntry, error: libraryEntryError } = await supabase
      .from("user_books")
      .select("status, is_favorite")
      .eq("book_id", savedBook.id)
      .maybeSingle();

    if (libraryEntryError) throw new Error("Could not check your library.");
    if (
      libraryEntry?.status === "reading" ||
      libraryEntry?.status === "read" ||
      libraryEntry?.status === "abandoned"
    ) {
      libraryStatus = libraryEntry.status;
      isFavorite = libraryEntry.is_favorite === true;
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

    const [{ data: publicReviewRows, error: publicReviewsError }, { data: myReviewRows, error: myReviewsError }] = await Promise.all([
      supabase.from("public_reviews").select("review_id, username, avatar_url, rating, review_text, reading_status, created_at").eq("google_books_id", book.google_books_id).order("created_at", { ascending: false }),
      supabase.from("reviews").select("id, rating, review_text, reading_status, is_public, user_books!inner(book_id)").eq("user_books.book_id", savedBook.id).order("created_at", { ascending: false }),
    ]);
    if (publicReviewsError || myReviewsError) throw new Error("Could not load reviews.");
    publicReviews = (publicReviewRows ?? []) as PublicReview[];
    myReviews = (myReviewRows ?? []).map(({ id, rating, review_text, reading_status, is_public }) => ({
      id, rating, review_text, reading_status, is_public,
    })) as ReviewInput[];
  } else {
    const { data: publicReviewRows, error: publicReviewsError } = await supabase
      .from("public_reviews")
      .select("review_id, username, avatar_url, rating, review_text, reading_status, created_at")
      .eq("google_books_id", book.google_books_id)
      .order("created_at", { ascending: false });
    if (publicReviewsError) throw new Error("Could not load reviews.");
    publicReviews = (publicReviewRows ?? []) as PublicReview[];
  }

  return <BookDetails book={book} libraryStatus={libraryStatus} inWishlist={inWishlist} isFavorite={isFavorite} publicReviews={publicReviews} myReviews={myReviews} />;
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
