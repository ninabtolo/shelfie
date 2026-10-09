import Link from "next/link";
import { FollowButton } from "@/components/profile/follow-button";
import { ProfileSearchForm } from "@/components/profile/profile-search-form";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = ((await searchParams).q ?? "").trim();
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: ownProfile } = userData.user
    ? await supabase.from("profiles").select("username").eq("id", userData.user.id).maybeSingle()
    : { data: null };
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
  const followStates = await Promise.all(
    profiles.map(async (profile) => {
      if (!userData.user || ownProfile?.username === profile.username) {
        return [profile.username, false] as const;
      }
      const { data, error } = await supabase.rpc("is_following", {
        p_username: profile.username,
      });
      if (error) throw new Error("Could not load follow status.");
      return [profile.username, Boolean(data)] as const;
    }),
  );
  const followingByUsername = new Map(followStates);

  return (
    <div className="space-y-8 py-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">Profiles</h1>
        <p className="text-muted-foreground">Find a Shelfie user by username.</p>
      </section>
      <ProfileSearchForm query={query} />
      {query ? (
        profiles.length ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {profiles.map((profile) => (
              <li key={profile.username} className="rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
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
                  {userData.user && ownProfile?.username !== profile.username && (
                    <FollowButton
                      username={profile.username}
                      initialFollowing={followingByUsername.get(profile.username) ?? false}
                    />
                  )}
                </div>
                <Link
                  href={`/protected/profiles/${encodeURIComponent(profile.username)}`}
                  className="mt-4 block text-sm font-medium text-primary hover:underline"
                >
                  View books, favorites and reviews →
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            No profiles found.
          </p>
        )
      ) : (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Search for a username to get started.
        </p>
      )}
    </div>
  );
}
