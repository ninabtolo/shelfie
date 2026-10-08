import { notFound } from "next/navigation";
import { BookCover } from "@/components/books/book-cover";
import { PublicReviews, type PublicReview } from "@/components/books/public-reviews";
import { createClient } from "@/lib/supabase/server";

type PublicBook = {
  google_books_id: string;
  title: string;
  authors: string[] | null;
  cover_url: string | null;
  status: "reading" | "read" | "abandoned";
  is_favorite: boolean;
};

const statusLabels: Record<PublicBook["status"], string> = {
  reading: "Reading",
  read: "Read",
  abandoned: "Abandoned",
};

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const username = decodeURIComponent((await params).username);
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("public_profiles")
    .select("username, bio, avatar_url")
    .eq("username", username)
    .maybeSingle();

  if (profileError) throw new Error("Could not load profile.");
  if (!profile) notFound();

  const { data: books, error: booksError } = await supabase
    .from("public_libraries")
    .select("google_books_id, title, authors, cover_url, status, is_favorite")
    .eq("username", profile.username)
    .order("added_at", { ascending: false });
  if (booksError) throw new Error("Could not load public library.");

  const { data: reviewRows, error: reviewsError } = await supabase
    .from("public_reviews")
    .select("review_id, username, avatar_url, rating, review_text, reading_status, created_at, title, google_books_id")
    .eq("username", profile.username)
    .order("created_at", { ascending: false });
  if (reviewsError) throw new Error("Could not load public reviews.");
  const publicBooks = (books ?? []) as PublicBook[];

  return (
    <div className="space-y-8 py-8">
      <section className="flex items-center gap-4">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" className="size-20 rounded-full object-cover" />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-full bg-secondary text-2xl font-semibold">
            {profile.username[0].toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold">@{profile.username}</h1>
          <p className="mt-1 max-w-xl text-muted-foreground">{profile.bio || "No bio yet."}</p>
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Public library</h2>
        {publicBooks.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publicBooks.map((book) => (
              <li key={book.google_books_id} className="book-card flex gap-4 rounded-xl border bg-card p-4 shadow-sm">
                <BookCover src={book.cover_url} title={book.title} priority={books.indexOf(book) === 0} className="w-20 shrink-0 self-start" />
                <div className="min-w-0 space-y-2">
                  <h3 className="line-clamp-3 font-semibold">{book.title}</h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {book.authors?.join(", ") ?? "Unknown author"}
                  </p>
                  <p className="text-xs font-medium text-primary">{statusLabels[book.status]}</p>
                  {book.is_favorite && <p className="text-xs font-medium text-primary">★ Favorite</p>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            This library has no public books yet.
          </p>
        )}
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Favorite books</h2>
        {publicBooks.filter((book) => book.is_favorite).length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publicBooks.filter((book) => book.is_favorite).map((book) => (
              <li key={book.google_books_id} className="book-card flex gap-4 rounded-xl border bg-card p-4 shadow-sm">
                <BookCover src={book.cover_url} title={book.title} className="w-20 shrink-0 self-start" />
                <div className="min-w-0 space-y-2">
                  <h3 className="line-clamp-3 font-semibold">{book.title}</h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {book.authors?.join(", ") ?? "Unknown author"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
            This profile has no favorite books yet.
          </p>
        )}
      </section>
      <PublicReviews reviews={(reviewRows ?? []) as PublicReview[]} title="Public reviews" />
    </div>
  );
}
