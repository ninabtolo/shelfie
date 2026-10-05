import Link from "next/link";
import { BookCover } from "@/components/books/book-cover";
import { WishlistActions } from "@/components/books/wishlist-actions";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

type WishlistEntry = { id: string; book_id: string };
type BookRecord = {
  id: string;
  google_books_id: string;
  title: string;
  authors: string[] | null;
  cover_url: string | null;
};

export default async function WishlistPage() {
  const supabase = await createClient();
  const { data: entries, error: entriesError } = await supabase
    .from("wishlist")
    .select("id, book_id")
    .order("created_at", { ascending: false });

  if (entriesError) throw new Error("Could not load your wishlist.");

  const wishlistEntries = (entries ?? []) as WishlistEntry[];
  const bookIds = [...new Set(wishlistEntries.map((entry) => entry.book_id))];
  const { data: bookRecords, error: booksError } = bookIds.length
    ? await supabase
        .from("books")
        .select("id, google_books_id, title, authors, cover_url")
        .in("id", bookIds)
    : { data: [], error: null };

  if (booksError) throw new Error("Could not load your wishlist books.");

  const booksById = new Map((bookRecords as BookRecord[]).map((book) => [book.id, book]));
  const books = wishlistEntries.flatMap((entry) => {
    const book = booksById.get(entry.book_id);
    return book ? [{ ...entry, book }] : [];
  });

  return (
    <div className="space-y-8 py-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">My Wishlist</h1>
        <p className="text-muted-foreground">Books you want to read someday.</p>
      </section>
      {books.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((entry) => (
            <li key={entry.id} className="book-card flex gap-4 rounded-xl border bg-card p-4 shadow-sm">
              <Link
                href={`/protected/books/${encodeURIComponent(entry.book.google_books_id)}?from=wishlist`}
                prefetch={false}
                className="flex min-w-0 flex-1 gap-4 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <BookCover src={entry.book.cover_url} title={entry.book.title} className="w-20 shrink-0 self-start" />
                <div className="min-w-0 space-y-2">
                  <h2 className="line-clamp-3 font-semibold">{entry.book.title}</h2>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {entry.book.authors?.join(", ") ?? "Unknown author"}
                  </p>
                </div>
              </Link>
              <WishlistActions bookId={entry.book_id} title={entry.book.title} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Your wishlist is empty. Search for a book to get started.
        </p>
      )}
    </div>
  );
}
