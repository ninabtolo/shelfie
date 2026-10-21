import {
  LibraryBookList,
  type LibraryBook,
  type LibraryBookWithDetails,
} from "@/components/books/library-book-list";
import { ShelfieHero } from "@/components/shelfie-hero";
import { createClient } from "@/lib/supabase/server";

type BookRecord = {
  id: string;
  google_books_id: string;
  title: string;
  authors: string[] | null;
  cover_url: string | null;
};

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: entries, error: entriesError } = await supabase
    .from("user_books")
    .select("id, book_id, status, is_public, is_favorite")
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
    <div className="space-y-8">
      <ShelfieHero title="My library" description="Books you have added to your personal library." />
      {books.length ? (
        <LibraryBookList books={books} />
      ) : (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Your library is empty. Search for a book to get started.
        </p>
      )}
    </div>
  );
}
