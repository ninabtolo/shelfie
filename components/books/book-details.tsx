import { BookCover } from "@/components/books/book-cover";
import { Button } from "@/components/ui/button";
import type { Book } from "@/lib/books/types";

export function BookDetails({ book }: { book: Book }) {
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
    <article className="grid gap-8 sm:grid-cols-[180px_minmax(0,1fr)]">
      <BookCover src={book.cover_url} title={book.title} className="w-40 sm:w-full" />
      <div className="min-w-0 space-y-6">
        <header className="space-y-2">
          <h1 className="break-words text-3xl font-bold">{book.title}</h1>
          {book.subtitle && <p className="text-lg text-muted-foreground">{book.subtitle}</p>}
          <p className="text-muted-foreground">{book.authors?.join(", ") ?? "Unknown author"}</p>
        </header>
        <section className="space-y-2" aria-labelledby="description-title">
          <h2 id="description-title" className="font-semibold">About this book</h2>
          <p className="whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">
            {book.description ?? "No description available."}
          </p>
        </section>
        <dl className="grid gap-4 border-t pt-6 sm:grid-cols-2">
          {metadata.map(([label, value]) => (
            <div key={label} className="min-w-0 space-y-1">
              <dt className="text-sm font-medium">{label}</dt>
              <dd className="break-words text-sm text-muted-foreground">{value ?? "Not available"}</dd>
            </div>
          ))}
        </dl>
        <div className="space-y-2 border-t pt-6">
          <p className="text-xs text-muted-foreground">Book data provided by Google Books.</p>
          <Button variant="outline" asChild>
            <a href={`https://books.google.com/books?id=${encodeURIComponent(book.google_books_id)}`} target="_blank" rel="noopener noreferrer">
              View on Google Books<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}
