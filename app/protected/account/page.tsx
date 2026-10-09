import { createClient } from "@/lib/supabase/server";
import { ProfileEditor } from "@/components/profile/profile-editor";
import {
  FollowersList,
  FollowingList,
  type FollowProfile,
  type FollowingProfile,
} from "@/components/profile/follow-lists";

type FollowerRow = {
  username: string;
  avatar_url: string | null;
  bio: string | null;
};

type FollowingRow = {
  username: string;
  avatar_url: string | null;
  bio: string | null;
};

export default async function AccountPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : "Not informed";
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (!userId) throw new Error("Could not load your account.");
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, bio, avatar_url")
    .eq("id", userId)
    .single();
  if (error || !profile) throw new Error("Could not load your profile.");
  const { data: followerRows, error: followersError } = await supabase.rpc("get_my_followers");
  if (followersError) throw new Error("Could not load your followers.");
  const followers = (followerRows as FollowerRow[] ?? []).map((follower) => ({
    follower_username: follower.username,
    follower_avatar_url: follower.avatar_url,
    follower_bio: follower.bio,
  })) as FollowProfile[];
  const { data: followingRows, error: followingError } = await supabase.rpc("get_my_following");
  if (followingError) throw new Error("Could not load who you follow.");
  const following = (followingRows as FollowingRow[] ?? []).map((profile) => ({
    following_username: profile.username,
    following_avatar_url: profile.avatar_url,
    following_bio: profile.bio,
  })) as FollowingProfile[];
  const { data: followStats, error: followStatsError } = await supabase
    .from("public_follow_stats")
    .select("followers_count, following_count")
    .eq("username", profile.username)
    .maybeSingle();
  if (followStatsError) throw new Error("Could not load follow counts.");

  return (
    <section className="flex flex-col gap-6 py-8">
      <div>
        <p className="text-sm text-muted-foreground">Authenticated area</p>
        <h1 className="text-3xl font-bold">My account</h1>
      </div>
      <div className="rounded-xl border p-6">
        <p className="text-sm text-muted-foreground">E-mail</p>
        <p className="mt-1 font-medium">{email}</p>
      </div>
      <ProfileEditor
        userId={userId}
        username={profile.username}
        initialBio={profile.bio ?? ""}
        initialAvatarUrl={profile.avatar_url}
      />
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">My connections</h2>
        <FollowersList profiles={followers} count={followStats?.followers_count ?? followers.length} />
        <FollowingList profiles={following} count={followStats?.following_count ?? following.length} />
      </section>
    </section>
  );
}
