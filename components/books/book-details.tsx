import { BookCover } from "@/components/books/book-cover";
import { AddToLibraryForm } from "@/components/books/add-to-library-form";
import { BookDescription } from "@/components/books/book-description";
import { Button } from "@/components/ui/button";
import type { Book } from "@/lib/books/types";

type BookStatus = "reading" | "read" | "abandoned";

export function BookDetails({
  book,
  libraryStatus,
}: {
  book: Book;
  libraryStatus?: BookStatus;
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
    <article className="space-y-8">
      <header className="space-y-2 border-b pb-6">
        <h1 className="break-words text-3xl font-bold">{book.title}</h1>
        {book.subtitle && <p className="text-lg text-muted-foreground">{book.subtitle}</p>}
        <p className="text-muted-foreground">{book.authors?.join(", ") ?? "Unknown author"}</p>
      </header>
      <div className="grid gap-8 border-b pb-8 sm:grid-cols-[180px_minmax(0,1fr)]">
        <BookCover src={book.cover_url} title={book.title} className="w-40 sm:w-full" />
        <dl className="grid gap-4 sm:grid-cols-2">
          {metadata.map(([label, value]) => (
            <div key={label} className="min-w-0 space-y-1">
              <dt className="text-sm font-medium">{label}</dt>
              <dd className="break-words text-sm text-muted-foreground">{value ?? "Not available"}</dd>
            </div>
          ))}
        </dl>
      </div>
      <section className="min-w-0 space-y-2" aria-labelledby="description-title">
        <h2 id="description-title" className="font-semibold">About this book</h2>
        <BookDescription description={book.description} />
      </section>
      <AddToLibraryForm book={book} initialStatus={libraryStatus} />
      <div className="space-y-2 border-t pt-6">
        <p className="text-xs text-muted-foreground">Book data provided by Google Books.</p>
        <Button variant="outline" asChild>
          <a href={`https://books.google.com/books?id=${encodeURIComponent(book.google_books_id)}`} target="_blank" rel="noopener noreferrer">
            View on Google Books<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </Button>
      </div>
    </article>
  );
}
