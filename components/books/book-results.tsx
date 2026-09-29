import Link from "next/link";
import { BookCover } from "@/components/books/book-cover";
import { Button } from "@/components/ui/button";
import { GoogleBooksError, searchBooks } from "@/lib/books/google-books";
import { bookSearchHref } from "@/lib/books/search";

export async function BookResults({ query, page }: { query: string; page: number }) {
  let result;
  try {
    result = await searchBooks(query, page);
  } catch (error) {
    if (!(error instanceof GoogleBooksError)) throw error;
    return <p role="alert" className="rounded-lg border p-6 text-sm text-destructive">{error.message}</p>;
  }

  const { books, hasNextPage } = result;

  return (
    <section className="space-y-5" aria-labelledby="results-title">
      <h2 id="results-title" className="text-lg font-semibold">Results for “{query}”</h2>
      {books.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <li key={book.google_books_id}>
              <Link
                href={`/protected/books/${encodeURIComponent(book.google_books_id)}?${new URLSearchParams({ q: query, page: String(page) })}`}
                prefetch={false}
                className="flex h-full gap-4 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <BookCover src={book.cover_url} title={book.title} className="w-20 shrink-0 self-start" />
                <div className="min-w-0 space-y-2">
                  <h3 className="line-clamp-3 font-semibold">{book.title}</h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{book.authors?.join(", ") ?? "Unknown author"}</p>
                  {book.published_date && <p className="text-xs text-muted-foreground">{book.published_date}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p role="status" className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {page > 1 ? "No more books on this page. Try the previous page." : "No books found. Try another title, author, or ISBN."}
        </p>
      )}
      {(page > 1 || hasNextPage) && (
        <nav aria-label="Book search pages" className="flex flex-wrap items-center justify-center gap-4">
          {page > 1 && <Button variant="outline" asChild><Link prefetch={false} href={bookSearchHref(query, page - 1)}>Previous</Link></Button>}
          <span className="text-sm text-muted-foreground">Page {page}</span>
          {hasNextPage && <Button variant="outline" asChild><Link prefetch={false} href={bookSearchHref(query, page + 1)}>Next</Link></Button>}
        </nav>
      )}
    </section>
  );
}
