import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Star, UsersRound } from "lucide-react";
import { BookCover } from "@/components/books/book-cover";
import { PublicReviews, type PublicReview } from "@/components/books/public-reviews";
import { FollowButton } from "@/components/profile/follow-button";
import { Button } from "@/components/ui/button";
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
  const { data: userData } = await supabase.auth.getUser();
  const { data: ownProfile } = userData.user
    ? await supabase.from("profiles").select("username").eq("id", userData.user.id).maybeSingle()
    : { data: null };
  const { data: profile, error: profileError } = await supabase
    .from("public_profiles")
    .select("username, bio, avatar_url")
    .eq("username", username)
    .maybeSingle();

  if (profileError) throw new Error("Could not load profile.");
  if (!profile) notFound();
  const [
    { data: books, error: booksError },
    { data: reviewRows, error: reviewsError },
    { data: stats, error: statsError },
    { data: followingProfile, error: followingProfileError },
  ] = await Promise.all([
    supabase
      .from("public_libraries")
      .select("google_books_id, title, authors, cover_url, status, is_favorite")
      .eq("username", profile.username)
      .order("added_at", { ascending: false }),
    supabase
      .from("public_reviews")
      .select("review_id, username, avatar_url, rating, review_text, reading_status, created_at, title, google_books_id")
      .eq("username", profile.username)
      .order("created_at", { ascending: false }),
    supabase
      .from("public_follow_stats")
      .select("followers_count, following_count")
      .eq("username", profile.username)
      .maybeSingle(),
    userData.user && ownProfile?.username !== profile.username
      ? supabase.rpc("is_following", { p_username: profile.username })
      : Promise.resolve({ data: false, error: null }),
  ]);
  if (booksError) throw new Error("Could not load public library.");
  if (reviewsError) throw new Error("Could not load public reviews.");
  if (statsError || followingProfileError) {
    throw new Error("Could not load follow information.");
  }
  const publicBooks = (books ?? []) as PublicBook[];

  return (
    <div className="space-y-8">
      <Button variant="ghost" asChild className="-ml-3 w-fit">
        <Link href="/protected/profiles">
          <ArrowLeft aria-hidden="true" /> Back to profile search
        </Link>
      </Button>
      <section className="shelfie-profile-hero shelfie-surface flex flex-col gap-3 p-4 sm:p-5">
        <div className={`shelfie-profile-header flex w-full items-center justify-between gap-4 ${userData.user ? "has-follow-action" : ""}`}>
          <div className="flex min-w-0 items-center gap-4">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="size-14 rounded-full object-cover" />
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary text-xl font-semibold">
                {profile.username[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="shelfie-heading truncate text-2xl font-semibold">@{profile.username}</h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{profile.bio || "No bio yet."}</p>
            </div>
          </div>
        </div>
        {userData.user && (
          <div className="shelfie-profile-action">
            <FollowButton
              username={profile.username}
              initialFollowing={ownProfile?.username === profile.username ? true : Boolean(followingProfile)}
              disabled={ownProfile?.username === profile.username}
            />
          </div>
        )}
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-base">
          <p className="flex items-center gap-2"><UsersRound aria-hidden="true" className="size-4 text-primary" /><strong>{stats?.followers_count ?? 0}</strong> followers</p>
          <p><strong>{stats?.following_count ?? 0}</strong> following</p>
        </div>
      </section>
      <div className="shelfie-rule" aria-hidden="true" />
      <section className="space-y-4">
        <h2 className="shelfie-section-heading"><BookOpen aria-hidden="true" className="size-6 text-primary" /><span>Public library</span></h2>
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
                  {book.is_favorite && (
                    <p className="flex items-center gap-1 text-xs font-medium text-primary">
                      <Star aria-hidden="true" className="size-3.5" fill="currentColor" /> Favorite
                    </p>
                  )}
                  <p className="text-xs font-medium text-primary">{statusLabels[book.status]}</p>
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
        <h2 className="shelfie-section-heading"><Star aria-hidden="true" className="size-6 text-primary" fill="currentColor" /><span>Favorite books</span></h2>
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
