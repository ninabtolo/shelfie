import { BookCover } from "@/components/books/book-cover";
import { AddToLibraryForm } from "@/components/books/add-to-library-form";
import { BookDescription } from "@/components/books/book-description";
import { MyReviews } from "@/components/books/my-reviews";
import { PublicReviews, type PublicReview } from "@/components/books/public-reviews";
import { ReviewForm, type ReviewInput } from "@/components/books/review-form";
import { ShareBookForm, type ShareRecipient } from "@/components/books/share-book-form";
import { BookWishlistProvider, WishlistButton } from "@/components/books/book-wishlist";
import { Button } from "@/components/ui/button";
import type { Book } from "@/lib/books/types";
import { BookOpen } from "lucide-react";

type BookStatus = "reading" | "read" | "abandoned";

export function BookDetails({
  book,
  libraryStatus,
  inWishlist,
  isFavorite = false,
  publicReviews = [],
  myReviews = [],
  shareRecipients = [],
}: {
  book: Book;
  libraryStatus?: BookStatus;
  inWishlist?: boolean;
  isFavorite?: boolean;
  publicReviews?: PublicReview[];
  myReviews?: ReviewInput[];
  shareRecipients?: ShareRecipient[];
}) {
  const metadata = [
    ["Publisher", book.publisher],
    ["Published", book.published_date],
    ["Pages", book.page_count],
    ["Language", book.language],
    ["ISBN-10", book.isbn_10],
    ["ISBN-13", book.isbn_13],
    ["Genres", book.genres?.join(", ")],
  ];

  return (
    <BookWishlistProvider book={book} initialInWishlist={inWishlist}>
      <article className="space-y-8">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <h1 className="shelfie-heading break-words text-4xl font-semibold sm:text-5xl">{book.title}</h1>
            {book.subtitle && <p className="text-lg text-muted-foreground">{book.subtitle}</p>}
            <p className="text-lg text-muted-foreground">{book.authors?.join(", ") ?? "Unknown author"}</p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <ShareBookForm book={book} recipients={shareRecipients} />
            <WishlistButton />
          </div>
        </header>
        <div className="shelfie-rule" aria-hidden="true" />
        <AddToLibraryForm book={book} initialStatus={libraryStatus} initialIsFavorite={isFavorite} />
        <div className="shelfie-rule" aria-hidden="true" />
        <div className="grid gap-8 border-b pb-8 sm:grid-cols-[180px_minmax(0,1fr)]">
          <BookCover src={book.cover_url} title={book.title} priority className="w-40 sm:w-full" />
          <dl className="grid content-start gap-x-8 gap-y-5 sm:grid-cols-2">
            {metadata.map(([label, value]) => (
              <div key={label} className="min-w-0 space-y-1">
                <dt className="text-sm font-medium">{label}</dt>
                <dd className="break-words text-sm text-muted-foreground">{value ?? "Not available"}</dd>
              </div>
            ))}
          </dl>
        </div>
        <section className="min-w-0 space-y-2" aria-labelledby="description-title">
          <h2 id="description-title" className="shelfie-section-heading"><BookOpen aria-hidden="true" className="size-6 text-primary" /><span>About this book</span></h2>
          <BookDescription description={book.description} />
        </section>
        <div className="shelfie-rule" aria-hidden="true" />
        <ReviewForm book={book} initialStatus={libraryStatus} />
        <div className="shelfie-rule" aria-hidden="true" />
        <MyReviews reviews={myReviews} />
        <div className="shelfie-rule" aria-hidden="true" />
        <PublicReviews reviews={publicReviews} />
        <div className="space-y-2 border-t pt-6">
          <p className="text-xs text-muted-foreground">Book data provided by Google Books.</p>
          <Button variant="outline" asChild>
            <a href={`https://books.google.com/books?id=${encodeURIComponent(book.google_books_id)}`} target="_blank" rel="noopener noreferrer">
              View on Google Books<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Button>
        </div>
      </article>
    </BookWishlistProvider>
  );
}
