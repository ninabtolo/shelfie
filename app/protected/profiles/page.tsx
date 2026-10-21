import Link from "next/link";
import { ArrowRight, UserRound } from "lucide-react";
import { ShelfieHero } from "@/components/shelfie-hero";
import { ProfileSearchForm } from "@/components/profile/profile-search-form";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = ((await searchParams).q ?? "").trim();
  const supabase = await createClient();
  let profiles: { username: string; bio: string | null; avatar_url: string | null }[] = [];

  if (query) {
    const { data, error } = await supabase
      .from("public_profiles")
      .select("username, bio, avatar_url")
      .ilike("username", `%${query}%`)
      .order("username")
      .limit(30);
    if (error) throw new Error("Could not search profiles.");
    profiles = data ?? [];
  }
  return (
    <div className="space-y-8">
      <ShelfieHero title="Profiles" description="Find a Shelfie user by username." />
      <ProfileSearchForm query={query} />
      {query && <div className="shelfie-rule" aria-hidden="true" />}
      {query ? (
        profiles.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <li key={profile.username} className="shelfie-profile-card shelfie-surface p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <Link
                    href={`/protected/profiles/${encodeURIComponent(profile.username)}`}
                    className="flex min-w-0 items-center gap-4 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {profile.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar_url} alt="" className="size-14 rounded-full object-cover" />
                    ) : (
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-semibold">
                        {profile.username[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="font-semibold">@{profile.username}</h2>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {profile.bio || "No bio yet."}
                      </p>
                    </div>
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/protected/profiles/${encodeURIComponent(profile.username)}`}
                      aria-label={`Open @${profile.username}'s profile`}
                      className="shelfie-profile-arrow"
                    >
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            No profiles found.
          </p>
        )
      ) : (
        <section className="shelfie-search-empty space-y-4">
          <div className="shelfie-rule" aria-hidden="true" />
          <div className="space-y-3 py-4">
            <div className="shelfie-empty-state-icon" aria-hidden="true">
              <UserRound className="size-6" />
            </div>
            <p className="shelfie-heading text-2xl text-foreground">Search for a username to get started.</p>
          </div>
          <div className="shelfie-rule" aria-hidden="true" />
        </section>
      )}
    </div>
  );
}
