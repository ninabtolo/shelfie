import { Suspense } from "react";
import { BookResults } from "@/components/books/book-results";
import { BookSearchForm } from "@/components/books/book-search-form";
import { parseBookSearch, type SearchParams } from "@/lib/books/search";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedPage({ searchParams }: {
  searchParams: Promise<SearchParams>;
}) {
  const { query, page } = parseBookSearch(await searchParams);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username = "user";

  if (user) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    if (error) {
      console.log("Error loading profile:", error);
    }

    if (profile?.username) {
      username = profile.username;
    }
  }

  return (
    <div className="space-y-8 pb-8">
      <section className="flex flex-col gap-3 pt-8">
        <p className="text-sm text-muted-foreground">Authenticated area</p>
        <h1 className="text-3xl font-bold">Welcome, @{username}</h1>
        <p className="text-muted-foreground">
          Your personalized library awaits for you
        </p>
      </section>
      <BookSearchForm query={query} />
      {query ? (
        <Suspense key={`${query}:${page}`} fallback={<p role="status" className="py-8 text-center text-muted-foreground">Searching Google Books…</p>}>
          <BookResults query={query} page={page} />
        </Suspense>
      ) : (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Search for a book to get started.
        </p>
      )}
    </div>
  );
}
