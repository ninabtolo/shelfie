import { Suspense } from "react";
import { BookResults } from "@/components/books/book-results";
import { BookSearchForm } from "@/components/books/book-search-form";
import { BookResultsLoading } from "@/components/shelfie-loading";
import { ShelfieHero } from "@/components/shelfie-hero";
import { parseBookSearch, type SearchParams } from "@/lib/books/search";
import { createClient } from "@/lib/supabase/server";
import { BookOpen } from "lucide-react";

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
    <div className="space-y-8">
      <ShelfieHero title={`Welcome, @${username}`} description="Your personalized library awaits for you." />
      <section className="space-y-5" aria-label="Book search">
        <BookSearchForm query={query} />
        {query && <div className="shelfie-rule" aria-hidden="true" />}
      </section>
      {query ? (
        <Suspense key={`${query}:${page}`} fallback={<BookResultsLoading />}>
          <BookResults query={query} page={page} />
        </Suspense>
      ) : (
        <section className="shelfie-search-empty space-y-4">
          <div className="shelfie-rule" aria-hidden="true" />
          <div className="space-y-3 py-4">
            <div className="shelfie-empty-state-icon" aria-hidden="true">
              <BookOpen className="size-6" />
            </div>
            <p className="shelfie-heading text-2xl text-foreground">Search for a book to get started.</p>
          </div>
          <div className="shelfie-rule" aria-hidden="true" />
        </section>
      )}
    </div>
  );
}
