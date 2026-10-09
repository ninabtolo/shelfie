import Link from "next/link";
import { BookCover } from "@/components/books/book-cover";
import { createClient } from "@/lib/supabase/server";

type ReceivedShare = {
  share_id: string;
  from_username: string;
  from_avatar_url: string | null;
  google_books_id: string;
  title: string;
  subtitle: string | null;
  authors: string[] | null;
  cover_url: string | null;
  message: string | null;
  shared_at: string;
};

export default async function SharedBooksPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_received_shares");

  if (error) throw new Error("Could not load shared books.");

  const shares = (data ?? []) as ReceivedShare[];

  return (
    <div className="space-y-8 py-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">Shared books</h1>
        <p className="text-muted-foreground">Books your friends have shared with you.</p>
      </section>
      {shares.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shares.map((share) => (
            <li key={share.share_id} className="rounded-xl border bg-card p-4 shadow-sm">
              <Link
                href={`/protected/books/${encodeURIComponent(share.google_books_id)}?from=shared-books`}
                prefetch={false}
                className="flex gap-4 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <BookCover
                  src={share.cover_url}
                  title={share.title}
                  priority={shares.indexOf(share) === 0}
                  className="w-20 shrink-0 self-start"
                />
                <div className="min-w-0 space-y-2">
                  <h2 className="line-clamp-3 font-semibold">{share.title}</h2>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {share.authors?.join(", ") ?? "Unknown author"}
                  </p>
                </div>
              </Link>
              <div className="mt-4 space-y-2 border-t pt-3 text-sm">
                <p className="text-muted-foreground">
                  Shared by <span className="font-medium text-foreground">@{share.from_username}</span>
                </p>
                {share.message && <p className="rounded-md bg-muted p-3">{share.message}</p>}
                <p className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(share.shared_at))}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No books have been shared with you yet.
        </p>
      )}
    </div>
  );
}
