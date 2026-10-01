import { BookCover } from "@/components/books/book-cover";
import { RemoveFromLibraryButton } from "@/components/books/remove-from-library-button";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const instant = false

type LibraryBook = {
  id: string;
  book_id: string;
  status: "reading" | "read" | "abandoned";
};

type BookRecord = {
  id: string;
  google_books_id: string;
  title: string;
  authors: string[] | null;
  cover_url: string | null;
};

type LibraryBookWithDetails = LibraryBook & {
  book: {
    google_books_id: string;
    title: string;
    authors: string[] | null;
    cover_url: string | null;
  };
};

const statusLabels: Record<LibraryBook["status"], string> = {
  reading: "Reading",
  read: "Read",
  abandoned: "Abandoned",
};

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: entries, error: entriesError } = await supabase
    .from("user_books")
    .select("id, book_id, status")
    .order("updated_at", { ascending: false });

  if (entriesError) {
    throw new Error("Could not load your library.");
  }

  const libraryEntries = (entries ?? []) as LibraryBook[];
  const bookIds = [...new Set(libraryEntries.map((entry) => entry.book_id))];
  const { data: bookRecords, error: booksError } = bookIds.length
    ? await supabase
        .from("books")
        .select("id, google_books_id, title, authors, cover_url")
        .in("id", bookIds)
    : { data: [], error: null };

  if (booksError) {
    throw new Error("Could not load your library books.");
  }

  const booksById = new Map(
    (bookRecords as BookRecord[]).map((book) => [book.id, book]),
  );
  const books = libraryEntries.flatMap((entry): LibraryBookWithDetails[] => {
    const book = booksById.get(entry.book_id);
    return book ? [{ ...entry, book }] : [];
  });

  return (
    <div className="space-y-8 py-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">My Library</h1>
        <p className="text-muted-foreground">Books you have added to your personal library.</p>
      </section>
      {books.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((entry) => (
            <li key={entry.id} className="book-card flex gap-4 rounded-xl border bg-card p-4 shadow-sm">
              <Link
                href={`/protected/books/${encodeURIComponent(entry.book.google_books_id)}?from=library`}
                prefetch={false}
                className="flex min-w-0 flex-1 gap-4 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <BookCover
                  src={entry.book.cover_url}
                  title={entry.book.title}
                  className="w-20 shrink-0 self-start"
                />
                <div className="min-w-0 space-y-2">
                  <h2 className="line-clamp-3 font-semibold">{entry.book.title}</h2>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {entry.book.authors?.join(", ") ?? "Unknown author"}
                  </p>
                  <p className="text-xs font-medium text-primary">{statusLabels[entry.status]}</p>
                </div>
              </Link>
              <RemoveFromLibraryButton bookId={entry.book_id} title={entry.book.title} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Your library is empty. Search for a book to get started.
        </p>
      )}
    </div>
  );
}
